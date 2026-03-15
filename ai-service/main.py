from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.llms import Ollama
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
import uuid
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Connections
llm = Ollama(model="llama3")
qdrant_client = QdrantClient("http://localhost:6333")
encoder = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Ensure the collection exists in Qdrant
# This is like creating a table in a database
try:
    qdrant_client.recreate_collection(
    collection_name="my_documents",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
except Exception as e:
    print(f"Collection setup skipped: {e}")

# 3. Data Models
class ChatRequest(BaseModel):
    message: str

class DocumentRequest(BaseModel):
    content: str

@app.get("/")
def home():
    return {"status": "AI Service is Online"}

# THE INPUT: Store a memory
@app.post("/ingest")
def ingest_document(doc: DocumentRequest):
    point_id = str(uuid.uuid4())
    real_vector = encoder.encode(doc.content).tolist()
    qdrant_client.upsert(
        collection_name="my_documents",
        points=[PointStruct(id=str(uuid.uuid4()), vector=real_vector, payload={"text": doc.content})]
    )
    return {"status": "Success", "message": "Document memorized!", "id": point_id}

# THE OUTPUT: Search memory and answer
@app.post("/generate")
def generate_ai_response(request: ChatRequest):
    try:
        # STEP 1: Turn the user's question into a real vector
        # This replaces the hardcoded [0.1, 0.2, 0.3]
        query_vector = encoder.encode(request.message).tolist()

        # STEP 2: Use that real vector to query Qdrant
        query_res = qdrant_client.query_points(
            collection_name="my_documents",
            query=query_vector,  # Now uses the dynamic vector!
            limit=3,
            with_payload=True,
        )

        context_text = ""
        for hit in query_res.points:
            payload = hit.payload or {}
            context_text += payload.get("text", "") + "\n"

        prompt = f"""
        You are a helpful assistant. Use the following facts to answer the question.
        FACTS: {context_text}
        QUESTION: {request.message}
        ANSWER:
        """
        
        response = llm.invoke(prompt)
        return {"response": response}
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        return {"response": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    # Changed 8000 to 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)