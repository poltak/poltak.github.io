#! ./venv/bin/python3

import sys
import time
import getpass
import os
import tiktoken
from pathlib import Path
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.callbacks import get_openai_callback


if not os.environ.get("OPENAI_API_KEY"):
  os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter API key for OpenAI: ")


# uncomment for local models
# llm = OllamaLLM(model="llama3.2", temperature=0.0)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)
encoding = tiktoken.encoding_for_model("gpt-4o-mini")


prompt_template = ChatPromptTemplate(
    [
        ('human', 'Answer the question based on ONLY the provided context. Context: {context}\n'
         'Question: {question}\n'
         'Answer:'),
    ]
)


def process_file_into_documents(file_path: Path) -> List[Document]:
    """Process a document based on its file type."""
    file_type = file_path.suffix.lower()
    
    match file_type:
        case ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load_and_split()
            print(f"Processed PDF file: {file_path}")
            return docs
        case ".txt":
            loader = TextLoader(file_path)
            docs = loader.load_and_split()
            print(f"Processed text file: {file_path}")
            return docs
        case _:
            print(f"Unsupported file type for {file_path}")
            return []


def process_path_into_documents(path: Path) -> List[Document]:
    """Process a path which can be either a file or directory."""
    if path.is_file():
        return process_file_into_documents(path)
    elif path.is_dir():
        # Process all files in the directory and its subdirectories
        docs = []
        for file_path in path.rglob("*"):
            if file_path.is_file():
                docs.extend(process_file_into_documents(file_path))
    else:
        print(f"Path not found or inaccessible: {path}")
    return docs


def print_token_counts_to_embed(docs: List[Document]) -> None:
    tokens_by_source = {}
    total_tokens_to_embed = 0

    for doc in docs:
        source = doc.metadata['source']
        tokens = len(encoding.encode(doc.page_content))
        tokens_by_source[source] = tokens_by_source.get(source, 0) + tokens
        total_tokens_to_embed += tokens

    print(f"---")
    for source, token_count in tokens_by_source.items():
        print(f"Source file {source} has {token_count} tokens")
    print(f"Total tokens to embed: {total_tokens_to_embed}")
    print(f"---")


def print_token_counts_in_prompt_via_LLM(input_dict):
    query_text = input_dict["question"]
    context_text = str(input_dict["context"])
    query_tokens = len(encoding.encode(query_text))

    with get_openai_callback() as cb:
        llm.invoke(query_text)
        query_tokens = cb.prompt_tokens
    
    with get_openai_callback() as cb:
        llm.invoke(context_text)
        context_tokens = cb.prompt_tokens
        
    # Count tokens for complete prompt
    prompt = prompt_template.format(**input_dict)
    with get_openai_callback() as cb:
        llm.invoke(prompt)
        total_tokens = cb.prompt_tokens
        total_cost = cb.total_cost
        
    print(f"---")
    print(f"Query tokens: {query_tokens}")
    print(f"Context tokens: {context_tokens}")
    print(f"Total tokens in final prompt: {total_tokens}")
    print(f"Total cost (USD): {total_cost:.2f}")
    print(f"---")
    
    return input_dict


def print_token_counts_in_prompt(input_dict):
    query_text = input_dict["question"]
    context_text = str(input_dict["context"])

    query_tokens = len(encoding.encode(query_text))
    context_tokens = len(encoding.encode(context_text))

    print(f"---")
    print(f"Query tokens: {query_tokens}")
    print(f"Context tokens: {context_tokens}")
    print(f"---")

    return input_dict


def main(paths: List[str]) -> None:
    """Main function to process multiple paths (files or directories)."""
    if not paths:
        print("Please provide at least one file or directory path")
        sys.exit(1)
    
    docs = []
    for path_str in paths:
        path = Path(path_str)
        docs.extend(process_path_into_documents(path))

    print(f"Processing {len(docs)} documents")
    print_token_counts_to_embed(docs)

    # Embed and store the documents
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    # swap this in for local models
    # embeddings = OllamaEmbeddings(model="llama3.2") 


    print(f"Creating vector store...")
    start_time = time.time()
    vector_store = InMemoryVectorStore.from_documents(docs, embeddings)
    end_time = time.time()
    print(f"Vector store creation took {end_time - start_time:.2f} seconds")
    
    retriever = vector_store.as_retriever()

    chain = ({"context": retriever, "question": RunnablePassthrough()} 
        # uncomment to print the token counts+cost for the prompt (works via talking to LLM, thus more slow/expensive)
        # | RunnableLambda(print_token_counts_in_prompt_via_LLM)
        | RunnableLambda(print_token_counts_in_prompt)
        | prompt_template 
        | llm
        # uncomment to print only the answer text for models that give back more than a string
        # | RunnableLambda(lambda x: x.content if hasattr(x, 'content') else x)
    )
    
    while True:
        query = input("\nEnter a query: ")
        print(chain.invoke(query))


if __name__ == "__main__":
    main(sys.argv[1:])
