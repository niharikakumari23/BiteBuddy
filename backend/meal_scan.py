import os, pathlib
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from google.generativeai import GenerativeModel
from prompts import SYSTEM_PROMPT

router = APIRouter()

api_key = os.getenv('GEMINIKEY')
if not api_key:
    # Fallback: empty string; Gemini client will raise its own error if used without a key
    api_key = ''

model = GenerativeModel(model_name='gemini-2.5-flash', system_instruction=SYSTEM_PROMPT)

class MealResponse(BaseModel):
    food_name: str
    calories: int
    carbs: int
    protein: int
    fats: int

@router.post('/api/meals/scan', response_model=MealResponse)
async def scan_meal(image: UploadFile = File(...)):
    upload_dir = pathlib.Path(__file__).parent / 'uploads'
    upload_dir.mkdir(exist_ok=True)
    file_path = upload_dir / image.filename
    with open(file_path, 'wb') as f:
        f.write(await image.read())
    try:
        with open(file_path, 'rb') as img_f:
            img_bytes = img_f.read().hex()
        img_part = {'inlineData': {'mimeType': image.content_type, 'data': img_bytes}}
        response = model.generate_content([img_part, {'text': ''}])
        raw = response.text
        start = raw.find('{')
        end = raw.rfind('}') + 1
        json_str = raw[start:end]
        data = eval(json_str)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Gemini error: {exc}')
    return MealResponse(
        food_name=data.get('food_name', 'unknown'),
        calories=int(data.get('calories', 0)),
        carbs=int(data.get('carbs', 0)),
        protein=int(data.get('protein', 0)),
        fats=int(data.get('fats', 0)),
    )
