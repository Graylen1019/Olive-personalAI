import os
import uuid
import requests
import uvicorn
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

# --- NEW: Import the secure logger from your database.py ---
from database import log_chat 

app = FastAPI()

# --- Setup & Configuration ---
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
COLLECTION_NAME = "knowledge_base"

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
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )
        else:
            print(f"Collection '{COLLECTION_NAME}' is ready.")
    except Exception as e:
        print(f"Database initialization error: {e}")

init_db()

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    message: str

class IngestRequest(BaseModel):
    content: str
    category: Optional[str] = "general" # 'schedule', 'vibe', etc.

# --- Endpoints ---

@app.get("/")
async def root():
    return {"status": "graylenOS Brain Active", "version": "4.0-CommandCenter"}

@app.get("/documents")
async def list_documents():
    """Retrieve all stored knowledge for the Library view"""
    try:
        # We 'scroll' through points to get the metadata/payload
        results, _ = qdrant.scroll(
            collection_name=COLLECTION_NAME, 
            limit=100, 
            with_payload=True
        )
        # Formats the data for your React 'Library' tab
        docs = []
        for r in results:
            docs.append({
                "id": r.id,
                "content": r.payload.get("text", ""),
                "source": r.payload.get("source", "Manual Entry"),
                "category": r.payload.get("category", "general"),
                "created_at": r.payload.get("created_at", "Unknown")
            })
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload documents (txt/md) to the Library"""
    try:
        content = await file.read()
        text = content.decode('utf-8')
        
        vector = encoder.encode(text).tolist()
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": text, 
                    "source": file.filename, 
                    "category": "document",
                    "created_at": str(datetime.now())
                }
            )]
        )
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/ingest")
async def ingest_data(req: IngestRequest):
    """Manual text ingestion for schedule, vibes, or facts"""
    try:
        vector = encoder.encode(req.content).tolist()
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    payload={
                        "text": req.content, 
                        "source": "Manual Entry",
                        "category": req.category,
                        "created_at": str(datetime.now())
                    },
                    vector=vector,
                )
            ],
        )
        return {"status": "success", "message": "Content memorized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_response(req: ChatRequest):
    try:
        print(f"\n--- graylenOS QUERY: {req.message} ---")
        query_vector = encoder.encode(req.message).tolist()
        
        # RAG: Search Qdrant for context
        search_result = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=5, # Increased limit for better context
            score_threshold=0.35 # Only grab truly relevant stuff
        )
        
        hits = search_result.points
        context_list = [hit.payload["text"] for hit in hits]
        context = "\n".join(context_list) if context_list else "No relevant information found in your personal database."

        # Hardened System Prompt for OliveAI
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are OliveAI, a personalized executive assistant.

Use information from the user’s personal database (such as schedules, preferences, and documents) whenever it helps answer a question or complete a task.

Respond in a clear, natural, and helpful way. Keep the tone professional but relaxed, like a capable assistant speaking with someone they work with regularly.

If the user’s database does not contain the information needed, say that you don’t know based on the current data rather than guessing or inventing details.
<|end_header_id|>
""

Context:
{context}<|eot_id|><|start_header_id|>user<|end_header_id|>
{req.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3", 
                "prompt": prompt, 
                "stream": False,
                "options": {"temperature": 0.1, "stop": ["<|eot_id|>"]} 
            },
            timeout=180, 
        )
        
        response.raise_for_status()
        ai_final_text = response.json().get("response")

        # PERSISTENCE: Log to Postgres
        log_chat(req.message, ai_final_text)

        # Return response + the sources used
        sources = list(set([hit.payload.get("source", "Unknown") for hit in hits]))
        return {"response": ai_final_text, "sources": sources}

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {"response": "I encountered a system error while processing your request."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)