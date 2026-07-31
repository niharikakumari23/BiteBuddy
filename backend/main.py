import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from prompts import CHAT_SYSTEM_PROMPT
load_dotenv()
from meal_scan import router as meal_router
from shopping_ai import router as shopping_router
from ai_personalize import router as ai_router

load_dotenv()

# Configure Google Gemini
api_key = os.getenv("GEMINIKEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("WARNING: Neither GEMINIKEY nor GOOGLE_API_KEY environment variable is set.")
genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=CHAT_SYSTEM_PROMPT
)

app = FastAPI(title="BiteBuddy API", description="AI Food Assistant Backend")
app.include_router(meal_router)
app.include_router(shopping_router)
app.include_router(ai_router)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
        # Convert request messages to Gemini chat history format:
        # role can be 'user' or 'model'
        history = []
        for msg in request.messages[:-1]:
            gemini_role = "user" if msg.role == "user" else "model"
            history.append({
                "role": gemini_role,
                "parts": [msg.content]
            })
            
        last_message = request.messages[-1].content
        
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(last_message)
        
        return {"response": response.text}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok", "api_key_set": api_key is not None}