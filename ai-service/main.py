from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests

app = FastAPI()

# Configuration from Environment Variables
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")

class ChatRequest(BaseModel):
    message: str

# 1. Add a Root Route to fix the 404
@app.get("/")
async def root():
    return {"message": "AI Service is Up and Running"}

@app.post("/generate")
async def generate_response(req: ChatRequest):
    try:
        # Calling Ollama on your Windows Host
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3", # Ensure you have llama3 pulled in Ollama!
                "prompt": req.message,
                "stream": False
            },
            timeout=30 # AI can take a second
        )
        response.raise_for_status()
        return {"response": response.json().get("response", "No response content")}
    
    except requests.exceptions.RequestException as e:
        print(f"Ollama Error: {e}")
        raise HTTPException(status_code=503, detail=f"Cannot connect to Ollama: {str(e)}")

@app.post("/ingest")
async def ingest_data(req: dict):
    # Placeholder for your Qdrant logic
    return {"status": "success", "data": "Ingested into vector db"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)