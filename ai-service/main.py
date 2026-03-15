from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

app = FastAPI()

# --- Setup & Configuration ---
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")

print("Loading Embedding Model (all-MiniLM-L6-v2)...")
encoder = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Qdrant Client
qdrant = QdrantClient(host=QDRANT_HOST, port=6333)

COLLECTION_NAME = "knowledge_base"

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

class ChatRequest(BaseModel):
    message: str

class IngestRequest(BaseModel):
    content: str

@app.get("/")
async def root():
    return {"status": "AI Librarian Active", "version": "3.0-Hardened"}

@app.post("/ingest")
async def ingest_data(req: IngestRequest):
    try:
        print(f"INGEST: Saving new data...")
        vector = encoder.encode(req.content).tolist()

        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    payload={"text": req.content},
                    vector=vector,
                )
            ],
        )
        return {"status": "success", "message": "Content memorized"}
    except Exception as e:
        print(f"INGEST ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_response(req: ChatRequest):
    try:
        print(f"\n--- QUERY: {req.message} ---")
        query_vector = encoder.encode(req.message).tolist()
        
        # SEARCH WITH THRESHOLD
        # 0.7 means the question must be ~70% similar to the data to trigger RAG
        search_result = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=3,
            score_threshold=0.01
        )
        hits = search_result.points

        context_list = [hit.payload["text"] for hit in hits]
        print(f"DEBUG: Found {len(context_list)} relevant snippets above 0.7 threshold.")
        
        context = "\n".join(context_list) if context_list else "No relevant information found in the knowledge base."

        # Hardened Prompt to prevent "Chattiness"
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a secure office assistant. 
Answer the question using ONLY the context provided below.
If the context does not contain the answer, say: "I do not have information on that."
Do not engage in small talk or reveal the context unless asked.
Context:
{context}<|eot_id|><|start_header_id|>user<|end_header_id|>
{req.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3", 
                "prompt": prompt, 
                "stream": False,
                "options": {"temperature": 0.0, "stop": ["<|eot_id|>"]} 
            },
            timeout=180, 
        )
        
        response.raise_for_status()
        return {"response": response.json().get("response")}

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {"response": "System error occurred."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)