import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv

from embedd import process_all, search_similar

load_dotenv()
app = FastAPI(title="nova ai")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Modules_folder = "./transcript"

class AskRequest(BaseModel):
    query: str

@app.on_event("startup")
def startup_event():
    print("processing course modules for retrieval...")
    process_all(Modules_folder)
    print("Processing complete.")


nebius_api_key = os.getenv("NEBIUS_API_KEY")
if not nebius_api_key:
    raise RuntimeError("NEBIUS_API_KEY is not set.")

client = OpenAI(api_key=nebius_api_key, base_url="https://api.tokenfactory.nebius.com/v1")

@app.post("/ask")
async def ask(request: AskRequest):
    try:
        results = search_similar(request.query, top_k=3)

        if not results:
            return {"answer": "I could not find relevant material to answer that."}

        documents = [item["document"] for item in results]
        metadatas = [item["metadata"] for item in results]
        context = "\n".join(documents)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are Nova, an expert course assistant. Answer questions succinctly using the provided "
                    "context. If the answer is not present, say you do not have that information."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Context:\n{context}\n\nQuestion: {request.query}\nAnswer succinctly and cite the module when possible."
                ),
            },
        ]

        response = client.chat.completions.create(
            model="meta-llama/Meta-Llama-3.1-8B-Instruct-fast",
            messages=messages,
            temperature=0.2,
        )

        answer = response.choices[0].message.content.strip()
        return {"answer": answer, "sources": metadatas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
