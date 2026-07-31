import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from google.generativeai import GenerativeModel

router = APIRouter()

# The system prompt instructs the model to return ONLY JSON.
model = GenerativeModel(
    model_name='gemini-2.5-flash', 
    system_instruction="You are an expert nutritionist and meal planner. Generate a comprehensive grocery shopping list based on the provided weekly meal plan. Return ONLY valid JSON format, specifically a list of objects with 'name' (string) and 'qty' (string) fields. For example: [{\"name\": \"Chicken Breast\", \"qty\": \"2 lbs\"}, {\"name\": \"Spinach\", \"qty\": \"1 bunch\"}]. Do not include any markdown wrappers or other text."
)

class PlanRequest(BaseModel):
    plan: Dict[str, Any]

class ShoppingItem(BaseModel):
    name: str
    qty: str

class ShoppingResponse(BaseModel):
    items: List[ShoppingItem]

@router.post('/api/shopping/generate', response_model=ShoppingResponse)
def generate_shopping_list(request: PlanRequest):
    try:
        prompt = f"Here is my meal plan for the week: {json.dumps(request.plan)}. Please generate a complete shopping list of ingredients needed for these meals."
        response = model.generate_content(prompt)
        
        raw = response.text
        start = raw.find('[')
        end = raw.rfind(']') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON list found in response")
            
        json_str = raw[start:end]
        data = json.loads(json_str)
        
        return ShoppingResponse(items=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Gemini error: {exc}')
