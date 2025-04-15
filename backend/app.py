from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from extraction.Rag import rag
import traceback
from extraction.utils import retrieve_top_queries
from extraction.extractor import main as index_pdf
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
import os

retrieve_top_queries("tiger")
app = FastAPI()

class QueryModel(BaseModel):
    query: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)
@app.post("/query/")
async def process_query(query: QueryModel):
    try:
        response, metadata = await rag(query.query) if callable(rag) and hasattr(rag, '__code__') and rag.__code__.co_flags & 0x80 else rag(query.query)
        # import pdb;pdb.set_trace()
        return {"response": response, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = "C:/Sagar/AI/project/backend/retrived_pdf/retrived.pdf"

        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_location), exist_ok=True)

        with open(file_location, "wb") as f:
            f.write(await file.read())

        index_pdf(file_location)   

        return {"message": "File uploaded successfully", "file_path": file_location}

    except Exception as e:
        error_trace = traceback.format_exc() 
        print(error_trace)# Get the full error traceback
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_trace})

if __name__ == "__main__":
    uvicorn.run(app,host="127.0.0.1",port=9000)