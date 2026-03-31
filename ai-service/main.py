import os
import uuid
import requests
import uvicorn
import psycopg2
from typing import List, Optional
from datetime import datetime

# Added UploadFile and File for multipart support
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

# --- NEW: Import the secure logger ---
from database import log_chat

app = FastAPI()

# --- Setup & Configuration ---
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
COLLECTION_NAME = "knowledge_base"

# Postgres connection for reading history
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")

print("Loading Embedding Model (all-MiniLM-L6-v2)...")
encoder = SentenceTransformer("all-MiniLM-L6-v2")

qdrant = QdrantClient(host=QDRANT_HOST, port=6333)


def init_db():
    try:
        collections = qdrant.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if not exists:
            print(f"Creating new collection: {COLLECTION_NAME}")
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=384, distance=models.Distance.COSINE
                ),
            )
        else:
            print(f"Collection '{COLLECTION_NAME}' is ready.")
    except Exception as e:
        print(f"Database initialization error: {e}")


init_db()


# --- Models ---
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000000"


# --- NEW: Multipart Ingest Route ---
@app.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    """Handles binary file uploads from the Gateway/Frontend"""
    try:
        # 1. Read the file content
        content = await file.read()
        text_content = content.decode("utf-8")  # Basic decoding for TXT/MD

        # 2. Vectorize the content
        vector = encoder.encode(text_content).tolist()

        # 3. Store in Qdrant (Long-Term Memory)
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    payload={
                        "text": text_content,
                        "filename": file.filename,
                        "source": "Manual Upload",
                        "created_at": str(datetime.now()),
                    },
                    vector=vector,
                )
            ],
        )

        print(f"✅ Successfully vectorized: {file.filename}")
        return {"status": "success", "message": f"Vectorized {file.filename}"}

    except Exception as e:
        print(f"❌ Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Short-Term Memory Helper ---
def get_short_term_memory(user_id: str, limit: int = 5):
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
        )
        cur = conn.cursor()
        cur.execute(
            "SELECT prompt, response FROM chat_history WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
            (user_id, limit),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        history = ""
        for prompt, response in reversed(rows):
            history += f"User: {prompt}\nAssistant: {response}\n"
        return history
    except Exception as e:
        print(f"Short-term memory error: {e}")
        return ""


# --- Autonomous Learning ---
def auto_learn(content: str):
    vector = encoder.encode(content).tolist()
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            models.PointStruct(
                id=str(uuid.uuid4()),
                payload={
                    "text": content,
                    "source": "Autonomous Learning",
                    "category": "personal_fact",
                    "created_at": str(datetime.now()),
                },
                vector=vector,
            )
        ],
    )


@app.get("/")
async def root():
    return {"status": "graylenOS Brain Active", "version": "5.0-MemoryLink"}


@app.get("/documents")
async def list_documents():
    try:
        # Scrolling gets the existing documents from Qdrant
        results, _ = qdrant.scroll(
            collection_name=COLLECTION_NAME, limit=100, with_payload=True
        )
        docs = [{"id": r.id, **r.payload} for r in results]
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks")
async def get_tasks():
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
        )
        cur = conn.cursor()
        # Fetch tasks for the next 24 hours
        cur.execute(
            "SELECT title, start_time, status FROM tasks ORDER BY start_time ASC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        tasks = [
            {"task": r[0], "time": r[1].strftime("%I:%M %p"), "status": r[2]}
            for r in rows
        ]
        return {"tasks": tasks}
    except Exception as e:
        print(f"Database error: {e}")
        return {"tasks": []}  # Fallback to empty list


@app.post("/generate")
async def generate_response(req: ChatRequest):
    try:
        history = get_short_term_memory(req.user_id)

        query_vector = encoder.encode(req.message).tolist()
        search_result = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=3,
            score_threshold=0.35,
        )
        context = "\n".join([hit.payload["text"] for hit in search_result.points])

        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are OliveAI, a personalized executive assistant. 

Short-Term Memory (Recent Chat):
{history}

Long-Term Context:
{context}

If you don't know the answer from either memory source, say so. Keep it professional but relaxed.
<|end_header_id|>
<|start_header_id|>user<|end_header_id|>
{req.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2, "stop": ["<|eot_id|>"]},
            },
            timeout=180,
        )
        ai_final_text = response.json().get("response")

        log_chat(req.message, ai_final_text)

        if any(
            trigger in req.message.lower()
            for trigger in ["my girlfriend", "i love", "my favorite"]
        ):
            auto_learn(req.message)

        return {"response": ai_final_text}

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {"response": "System memory error."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
