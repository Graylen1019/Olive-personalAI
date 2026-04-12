import os
import uuid
import requests
import uvicorn
import psycopg2
from typing import List, Optional
from datetime import datetime

# FastAPI imports
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

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000000"
    calendar_context: Optional[List[dict]] = None

# --- DATABASE & UTILITY FUNCTIONS (Defined before routes) ---

def init_db():
    """Initializes the Qdrant collection for RAG"""
    try:
        collections = qdrant.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if not exists:
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )
            print(f"Collection '{COLLECTION_NAME}' created.")
    except Exception as e:
        print(f"Qdrant init error: {e}")

def get_short_term_memory(user_id: str):
    """Fetches recent chat history from Postgres"""
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST
        )
        cur = conn.cursor()
        # Fetch last 5 messages for context
        cur.execute(
            "SELECT role, content FROM chat_logs WHERE user_id = %s ORDER BY created_at DESC LIMIT 5",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        history = "\n".join([f"{r[0]}: {r[1]}" for r in reversed(rows)])
        return history
    except Exception as e:
        print(f"Memory Fetch Error: {e}")
        return ""

def auto_learn(text: str):
    """Automatically vectors interesting user facts into Qdrant"""
    try:
        vector = encoder.encode(text).tolist()
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={"text": text, "type": "auto_learned", "date": str(datetime.now())}
                )
            ]
        )
        print(f"Learned new context: {text[:30]}...")
    except Exception as e:
        print(f"Auto-learn failure: {e}")

# --- API ROUTES ---

@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    """Handles multipart file ingestion from the Gateway"""
    try:
        content = await file.read()
        text = content.decode("utf-8")
        
        # Split into chunks (simple version)
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        
        for chunk in chunks:
            vector = encoder.encode(chunk).tolist()
            qdrant.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=str(uuid.uuid4()),
                        vector=vector,
                        payload={"text": chunk, "source": file.filename}
                    )
                ]
            )
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_response(req: ChatRequest):
    """Main AI generation route with RAG and Memory"""
    try:
        # 1. Fetch Short-Term Memory (Postgres)
        history = get_short_term_memory(req.user_id)
        
        # 2. Fetch Long-Term Context (Qdrant)
        query_vector = encoder.encode(req.message).tolist()
        search_result = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=3,
            score_threshold=0.35,
        )
        context = "\n".join([hit.payload["text"] for hit in search_result.points])

        # 3. Process Calendar Context (Google)
        cal_str = "No events found."
        if req.calendar_context:
            cal_str = "\n".join([f"- {e.get('summary')} at {e.get('start', {}).get('dateTime')}" for e in req.calendar_context])

        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are OliveAI, a personalized executive assistant. 

Upcoming Calendar:
{cal_str}

Short-Term Memory (Recent Chat):
{history}

Long-Term Context (RAG):
{context}

Keep it professional but relaxed. Use the calendar data if relevant.
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

        # 4. Log to Database
        log_chat(req.message, ai_final_text)

        # 5. Autonomous Learning Triggers
        if any(trigger in req.message.lower() for trigger in ["my favorite", "i love", "remember that"]):
            auto_learn(req.message)

        return {"response": ai_final_text}
    except Exception as e:
        print(f"Generation Error: {e}")
        return {"response": "System memory error. Please check database connections."}

@app.get("/tasks")
async def get_tasks():
    """Fallback task endpoint"""
    return {"tasks": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)