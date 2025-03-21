#! python3

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp import add_mcp_server
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
import tiktoken
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings


if not os.environ.get("OPENAI_API_KEY"):
  os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter API key for OpenAI: ")


app = FastAPI(title="RAG MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

add_mcp_server(
    app,
    mount_path="/mcp",
    name="RAG MCP Server",
)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
encoding = tiktoken.encoding_for_model("gpt-4o-mini")


# Store vector stores in memory (keyed by session_id)
vector_stores = {}

class QueryRequest(BaseModel):
    session_id: str
    query: str

class DocumentReference(BaseModel):
    url: Optional[str] = None
    file_path: Optional[str] = None
    content: Optional[str] = None

class IngestRequest(BaseModel):
    session_id: str
    documents: List[DocumentReference]


def process_pdf(file_path: Path) -> List[Document]:
    """Process a PDF file into documents."""
    loader = PyPDFLoader(file_path)
    docs = loader.load_and_split()
    return docs


@app.post("/ingest")
async def ingest_documents(request: IngestRequest):
    """Ingest documents and create a vector store."""
    docs = []
    
    for doc_ref in request.documents:
        if doc_ref.file_path:
            # Process local file
            path = Path(doc_ref.file_path)
            if path.suffix.lower() == ".pdf":
                docs.extend(process_pdf(path))
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {path.suffix}")
        elif doc_ref.url:
            # TODO: Implement URL processing
            raise HTTPException(status_code=501, detail="URL processing not yet implemented")
        elif doc_ref.content:
            # Process direct content
            docs.append(Document(page_content=doc_ref.content))
    
    if not docs:
        raise HTTPException(status_code=400, detail="No valid documents provided")
    
    vector_store = InMemoryVectorStore.from_documents(docs, embeddings)
    vector_stores[request.session_id] = vector_store
    
    return {"message": f"Successfully processed {len(docs)} documents", "session_id": request.session_id}


@app.post("/query")
async def query_documents(request: QueryRequest):
    """Query the vector store for relevant context."""
    if request.session_id not in vector_stores:
        raise HTTPException(status_code=404, detail="Session not found")
    
    vector_store = vector_stores[request.session_id]
    retriever = vector_store.as_retriever()
    
    relevant_docs = retriever.get_relevant_documents(request.query)
    
    return {
        "context": [doc.page_content for doc in relevant_docs],
        "metadata": [doc.metadata for doc in relevant_docs]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
    