from langchain.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os
import json
from typing import List,Tuple,Dict
from pinecone import Pinecone
from dataclasses import dataclass
# from pinecone import Index
load_dotenv()
os.getenv("PINECONE_API_ENV")
pinecone_api=os.getenv("PINECONE_API_KEY")
pinecone_env=os.getenv("PINECONE_API_ENV")
pc = Pinecone()

@dataclass
class PDFElement:
    type: str  
    content: any  
    bbox: List[float]
    page_num: int
    metadata: Dict = None



def download_hugging_face_embeddings():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    # embeddings = OpenAIEmbeddings()
    
    return embeddings


def prepare_texts(elements: List[PDFElement]) -> List[str]:
    """Extract text content from PDF elements."""
    return [e.content for e in elements]

def prepare_metadata(elements: List[PDFElement]) -> str:
    """Prepare metadata for each PDF element."""
    return [
        {
            "type": e.type,
            "bbox": json.dumps(e.bbox),
            "page_num": e.page_num,
            **(e.metadata or {})
        }
        for e in elements
    ]
    
def empty_index(index_name: str):
    index = pc.Index(index_name)
    index.delete(delete_all=True)
    print(f"All vectors in the index '{index_name}' have been deleted.")

def store_index(elements: List[PDFElement]):
    embeddings = download_hugging_face_embeddings()
    # empty_index("aichatbot")
    
    # Extract text and metadata
    texts = prepare_texts(elements)
    metadata = prepare_metadata(elements)

    # Compute embeddings
    text_embeddings = embeddings.embed_documents(texts)
    

    index_name = "aichatbot"
    index = pc.Index(index_name)

    # Store data in Pinecone
    for i, (embedding, meta, text) in enumerate(zip(text_embeddings, metadata, texts)):
        index.upsert(
            vectors=[{
                "id": f"doc-{i}",
                "values": embedding,
                "metadata": {
                    **meta, 
                    "content": text  # Store original text as part of metadata
                }
            }]
        )
    print("Indexing completed.")

def retrieve_top_queries(query: str, top_k: int = 5) -> List[Dict]:
 
    embeddings = download_hugging_face_embeddings()
    
    query_embedding = embeddings.embed_documents([query])[0]
    
    index_name = "aichatbot"
    index = pc.Index(index_name)

    query_results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    return query_results.matches

# l=retrieve_top_queries("tiger",2)
# import pdb;pdb.set_trace()
# print(l)        