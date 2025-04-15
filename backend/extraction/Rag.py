from .utils import retrieve_top_queries
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from typing import List,Optional
from groq import Groq
import asyncio
import instructor
from dotenv import load_dotenv
load_dotenv()
Groq()
model_name="llama-3.3-70b-versatile"
client = instructor.from_groq(Groq(), mode=instructor.Mode.JSON)

class ContextCheck(BaseModel):
    eval: bool = Field(description="needed steps to properly extract data from web")

class RagResponse(BaseModel):
    response: str 

async def context_checker(user_query,context):
    messages = [
    {
        "role": "system",
        "content": f"""
        **Task Objective**:  
        - Verify whether the provided context is relevant to the user query.  
        - If relevant, return: `true`  
        - If irrelevant, return: `false`  
        - Do not provide any explanations or additional text—only return a boolean value.  
        """
    },
    {
        "role": "user",
        "content": f"""
        **User Query**: "{user_query}"  
        **Context**: "{context}" 
        """
    }
]

    response = client.chat.completions.create(
        model=model_name,
        response_model=ContextCheck,
        messages=messages,
        temperature=0.9,
        max_tokens=1000,
    )
    return response.eval

async def relavant_context(user_query):
    retrivals= retrieve_top_queries(user_query,5)
    relavant_content=[]
    relavant_metadata=[]
    for context in retrivals:
        content=context["metadata"]["content"]
        eval= await context_checker(user_query,content)
        if eval:
            relavant_content.append(content)
            relavant_metadata.append(context["metadata"])    
    print(relavant_content)
    return relavant_content,relavant_metadata        
        
async def rag(user_query):
    
    context,metadata=await relavant_context(user_query)
    
    messages = [
    {
        "role": "system",
        "content": f"""
        **Task Objective**:  
        - Generate a response to the user's query using the provided context.  
        - If the context is empty or missing, state: `"No relevant document was found. Responding based on general knowledge."`  
        - If context is available, ensure the response is derived primarily from it.  
        - Keep responses clear, concise, and directly related to the query.  

        **Response Handling**:  
        - **If context is provided** → Use it as the primary source for the response.  
        - **If context is missing/empty** → Indicate this and generate a response based on general knowledge.  

        **Example Outputs**:  

        **User Query**: "What is the impact of climate change on agriculture?"  
        **Context**: "[Research paper discussing reduced crop yields due to changing rainfall patterns.]"  
        **Generated Response**: "Climate change affects agriculture by altering rainfall patterns, leading to reduced crop yields and increased drought frequency, as indicated in the provided research."  

        **User Query**: "What is quantum computing?"  
        **Context**: "[]"  
        **Generated Response**: "No relevant document was found. Responding based on general knowledge.  
        Quantum computing leverages qubits to perform calculations exponentially faster than classical computers for certain tasks, such as cryptography and simulations."  
        """
    },
    {
        "role": "user",
        "content": f"""
        **User Query**: "{user_query}"  
        **Context**: "{context}"  
        """
    }
    ]


    response = client.chat.completions.create(
        model=model_name,
        response_model=RagResponse,
        messages=messages,
        temperature=0.9,
        max_tokens=1000,
    )
    # import pdb;pdb.set_trace()
    return response.response,metadata

asyncio.run(relavant_context("peacock"))