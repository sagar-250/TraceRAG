from dotenv import load_dotenv
load_dotenv()


from langchain.chains import LLMChain
from pydantic import BaseModel
from typing import List ,Dict
import instructor
from groq import Groq

# Initialize Groq client
client = Groq()

# class InfoModel(BaseModel):
#   info_type: List[str]
#   value : str 
class ResponseModel(BaseModel):
    table_json: List[Dict[str,str]]
    
    
client = instructor.from_groq(Groq(), mode=instructor.Mode.JSON) 
output_schema="""{
                  "table_json": 
                      [{
                          "name":"<value>",
                          "mother_name":"<value>",
                          "email":"<value>",
                          "ph_no.":"<value>",
                          "DOB": "<value>",
                        
                      }]
              }"""
def table_process(text):
  types=["Application_for_bank (for e.g. creditcard,savings accoun opening)","Identity_Document","Supporting_Financial_Document (for e.g. income statements/paystubs, tax returns)","Reciepts","Other"]
  messages = [
          {
              "role": "system",
              "content": f"""
              Please analyze the table json: {text} 
              You are a helpful assistant. whose work is clean up and organize given json of a table . if heading are multiple line it leads to new row with empty value ,etc.properly clean and give back cleaned table json"
              Example of output format response:{output_schema}
              """
          }
      ]
  response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_model=ResponseModel,
        messages=messages,
        temperature=0.9,
        max_tokens=1000,
    )

  return response.json()


