import os, pathlib
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from google.generativeai import GenerativeModel
from prompts import FOOD_ANALYSIS_PROMPT, FOOD_TEXT_ANALYSIS_PROMPT

import json
import urllib.request
import urllib.parse
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("gemini_requests.log"),
        logging.StreamHandler()  # Outputs to the terminal console
    ]
)

def check_spoonacular_nutrition(food_name: str):
    spoon_key = os.getenv('SPOONACULAR_KEY')
    if not spoon_key:
        return None
    try:
        # Try parseIngredients first to get detailed nutritional breakdown
        encoded_title = urllib.parse.quote(food_name)
        url = f"https://api.spoonacular.com/recipes/parseIngredients?apiKey={spoon_key}"
        data_payload = urllib.parse.urlencode({
            'ingredientList': f"1 serving of {food_name}",
            'servings': 1,
            'includeNutrition': 'true'
        }).encode('utf-8')
        
        req = urllib.request.Request(
            url, 
            data=data_payload,
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                parse_data = json.loads(response.read().decode())
                if isinstance(parse_data, list) and len(parse_data) > 0 and 'nutrition' in parse_data[0]:
                    nutrients = parse_data[0]['nutrition'].get('nutrients', [])
                    
                    def get_nutrient_val(name):
                        for nut in nutrients:
                            if nut.get('name', '').lower() == name.lower():
                                return int(round(nut.get('amount', 0)))
                        return 0

                    calories = get_nutrient_val('Calories')
                    fat = get_nutrient_val('Fat')
                    protein = get_nutrient_val('Protein')
                    carbs = get_nutrient_val('Carbohydrates')
                    fiber = get_nutrient_val('Fiber')
                    sugar = get_nutrient_val('Sugar')
                    sodium = get_nutrient_val('Sodium')
                    cholesterol = get_nutrient_val('Cholesterol')

                    return {
                        'calories': calories,
                        'fat': fat,
                        'fats': fat,
                        'protein': protein,
                        'carbs': carbs,
                        'fiber': fiber,
                        'sugar': sugar,
                        'sodium': sodium,
                        'cholesterol': cholesterol,
                        
                        'minCalories': int(calories * 0.9),
                        'maxCalories': int(calories * 1.1),
                        'minFat': int(fat * 0.9),
                        'maxFat': int(fat * 1.1),
                        'minProtein': int(protein * 0.9),
                        'maxProtein': int(protein * 1.1),
                        'minCarbs': int(carbs * 0.9),
                        'maxCarbs': int(carbs * 1.1),
                        'minFiber': int(fiber * 0.9),
                        'maxFiber': int(fiber * 1.1),
                        'minSugar': int(sugar * 0.9),
                        'maxSugar': int(sugar * 1.1),
                        'minSodium': int(sodium * 0.9),
                        'maxSodium': int(sodium * 1.1),
                        'minCholesterol': int(cholesterol * 0.9),
                        'maxCholesterol': int(cholesterol * 1.1)
                    }
    except Exception as e:
        print(f"Spoonacular parseIngredients error: {e}")

    # Fallback to guessNutrition if parseIngredients fails
    try:
        encoded_title = urllib.parse.quote(food_name)
        url = f"https://api.spoonacular.com/recipes/guessNutrition?title={encoded_title}&apiKey={spoon_key}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode())
                if 'calories' in res_data and isinstance(res_data['calories'], dict):
                    cal_data = res_data.get('calories', {})
                    fat_data = res_data.get('fat', {})
                    pro_data = res_data.get('protein', {})
                    carb_data = res_data.get('carbs', {})
                    
                    scaled_cal = int(float(cal_data.get('value', 0)))
                    scaled_fat = int(float(fat_data.get('value', 0)))
                    scaled_pro = int(float(pro_data.get('value', 0)))
                    scaled_carb = int(float(carb_data.get('value', 0)))

                    return {
                        'calories': scaled_cal,
                        'fat': scaled_fat,
                        'fats': scaled_fat,
                        'protein': scaled_pro,
                        'carbs': scaled_carb,
                        'fiber': 0,
                        'sugar': 0,
                        'sodium': 0,
                        'cholesterol': 0,
                        
                        'minCalories': int(float(cal_data.get('confidenceRange95Percent', {}).get('min', scaled_cal))),
                        'maxCalories': int(float(cal_data.get('confidenceRange95Percent', {}).get('max', scaled_cal))),
                        'minFat': int(float(fat_data.get('confidenceRange95Percent', {}).get('min', scaled_fat))),
                        'maxFat': int(float(fat_data.get('confidenceRange95Percent', {}).get('max', scaled_fat))),
                        'minProtein': int(float(pro_data.get('confidenceRange95Percent', {}).get('min', scaled_pro))),
                        'maxProtein': int(float(pro_data.get('confidenceRange95Percent', {}).get('max', scaled_pro))),
                        'minCarbs': int(float(carb_data.get('confidenceRange95Percent', {}).get('min', scaled_carb))),
                        'maxCarbs': int(float(carb_data.get('confidenceRange95Percent', {}).get('max', scaled_carb))),
                        
                        'minCholesterol': 0,
                        'maxCholesterol': 0,
                        'minFiber': 0,
                        'maxFiber': 0,
                        'minSugar': 0,
                        'maxSugar': 0,
                        'minSodium': 0,
                        'maxSodium': 0,
                    }
    except Exception as e:
        print(f"Spoonacular guessNutrition error: {e}")
    return None




router = APIRouter()

api_key = os.getenv('GEMINIKEY') or os.getenv('GOOGLE_API_KEY') or ''

model = GenerativeModel(model_name='gemini-2.5-flash', system_instruction=FOOD_ANALYSIS_PROMPT)
text_model = GenerativeModel(model_name='gemini-2.5-flash', system_instruction=FOOD_TEXT_ANALYSIS_PROMPT)

class MealResponse(BaseModel):
    food_name: str
    calories: int
    carbs: int
    protein: int
    fats: int
    image_url: str
    minCalories: int = 0
    maxCalories: int = 0
    minFat: int = 0
    maxFat: int = 0
    minProtein: int = 0
    maxProtein: int = 0
    minCarbs: int = 0
    maxCarbs: int = 0
    minCholesterol: int = 0
    maxCholesterol: int = 0
    minFiber: int = 0
    maxFiber: int = 0
    minSugar: int = 0
    maxSugar: int = 0
    minSodium: int = 0
    maxSodium: int = 0

class AnalyzeTextRequest(BaseModel):
    food: str

class AnalyzeTextResponse(BaseModel):
    food_name: str
    calories: int
    protein: int
    carbs: int
    fat: int
    fiber: int
    sugar: int
    sodium: int
    serving_size: str
    confidence_score: float
    minCalories: int = 0
    maxCalories: int = 0
    minFat: int = 0
    maxFat: int = 0
    minProtein: int = 0
    maxProtein: int = 0
    minCarbs: int = 0
    maxCarbs: int = 0
    minCholesterol: int = 0
    maxCholesterol: int = 0
    minFiber: int = 0
    maxFiber: int = 0
    minSugar: int = 0
    maxSugar: int = 0
    minSodium: int = 0
    maxSodium: int = 0

@router.post('/api/meals/scan', response_model=MealResponse)
async def scan_meal(image: UploadFile = File(...)):
    try:
        upload_dir = pathlib.Path(__file__).parent / 'uploads'
        upload_dir.mkdir(exist_ok=True)
        
        # Handle cases where the filename is empty or None
        safe_filename = image.filename if image.filename else "scanned_image.jpg"
        file_path = upload_dir / safe_filename
        
        img_data = await image.read()
        with open(file_path, 'wb') as f:
            f.write(img_data)
            
        # Direct print to terminal console & logging of the scan attempt
        print(f"\n--- [Gemini Image Scan Request] ---\nFile: {safe_filename}\nContent-Type: {image.content_type}\nSize: {len(img_data)} bytes\n-----------------------------------\n")
        logging.info(f"Gemini Image Scan: filename={safe_filename}, content_type={image.content_type}")
        
        img_part = {'mime_type': image.content_type if image.content_type else 'image/jpeg', 'data': img_data}
        response = model.generate_content([img_part, "Analyze this food and provide nutritional information in JSON format."])
        raw = response.text
        print(f"\n--- [Gemini Image Scan Response] ---\n{raw}\n------------------------------------\n")
        logging.info(f"Gemini Image Scan raw response: {raw}")
        start = raw.find('{')
        end = raw.rfind('}') + 1
        json_str = raw[start:end]
        data = json.loads(json_str)
        
        food_name = data.get('food_name', 'Unknown Food')
        calories = int(data.get('calories', 0))
        carbs = int(data.get('carbs', 0))
        protein = int(data.get('protein', 0))
        fats = int(data.get('fats', data.get('fat', 0)))
        fiber = int(data.get('fiber', 0))
        sugar = int(data.get('sugar', 0))
        sodium = int(data.get('sodium', 0))
        cholesterol = int(data.get('cholesterol', 0))
        
        minCalories = int(calories * 0.9)
        maxCalories = int(calories * 1.1)
        minFat = int(fats * 0.9)
        maxFat = int(fats * 1.1)
        minProtein = int(protein * 0.9)
        maxProtein = int(protein * 1.1)
        minCarbs = int(carbs * 0.9)
        maxCarbs = int(carbs * 1.1)
        
        minCholesterol = int(cholesterol * 0.9)
        maxCholesterol = int(cholesterol * 1.1)
        minFiber = int(fiber * 0.9)
        maxFiber = int(fiber * 1.1)
        minSugar = int(sugar * 0.9)
        maxSugar = int(sugar * 1.1)
        minSodium = int(sodium * 0.9)
        maxSodium = int(sodium * 1.1)

        spoon_nut = check_spoonacular_nutrition(food_name)
        if spoon_nut:
            calories = spoon_nut.get('calories', calories)
            carbs = spoon_nut.get('carbs', carbs)
            protein = spoon_nut.get('protein', protein)
            fats = spoon_nut.get('fats', spoon_nut.get('fat', fats))
            
            minCalories = spoon_nut.get('minCalories', minCalories)
            maxCalories = spoon_nut.get('maxCalories', maxCalories)
            minFat = spoon_nut.get('minFat', minFat)
            maxFat = spoon_nut.get('maxFat', maxFat)
            minProtein = spoon_nut.get('minProtein', minProtein)
            maxProtein = spoon_nut.get('maxProtein', maxProtein)
            minCarbs = spoon_nut.get('minCarbs', minCarbs)
            maxCarbs = spoon_nut.get('maxCarbs', maxCarbs)
            
            minCholesterol = spoon_nut.get('minCholesterol', minCholesterol)
            maxCholesterol = spoon_nut.get('maxCholesterol', maxCholesterol)
            minFiber = spoon_nut.get('minFiber', minFiber)
            maxFiber = spoon_nut.get('maxFiber', maxFiber)
            minSugar = spoon_nut.get('minSugar', minSugar)
            maxSugar = spoon_nut.get('maxSugar', maxSugar)
            minSodium = spoon_nut.get('minSodium', minSodium)
            maxSodium = spoon_nut.get('maxSodium', maxSodium)
            
        return MealResponse(
            food_name=food_name,
            calories=calories,
            carbs=carbs,
            protein=protein,
            fats=fats,
            image_url=f'http://localhost:5000/uploads/{safe_filename}',
            minCalories=minCalories,
            maxCalories=maxCalories,
            minFat=minFat,
            maxFat=maxFat,
            minProtein=minProtein,
            maxProtein=maxProtein,
            minCarbs=minCarbs,
            maxCarbs=maxCarbs,
            minCholesterol=minCholesterol,
            maxCholesterol=maxCholesterol,
            minFiber=minFiber,
            maxFiber=maxFiber,
            minSugar=minSugar,
            maxSugar=maxSugar,
            minSodium=minSodium,
            maxSodium=maxSodium
        )
    except Exception as exc:
        print(f"\n--- [Gemini Image Scan Error] ---\n{exc}\n---------------------------------\n")
        logging.error(f"Gemini Image Scan failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f'Gemini error: {exc}')

@router.post('/api/meals/analyze-text', response_model=AnalyzeTextResponse)
def analyze_text_meal(request: AnalyzeTextRequest):
    # Direct print statement to guarantee output in the terminal console
    print(f"\n--- [Gemini Input Request] ---\n{request.food}\n------------------------------\n")
    logging.info(f"Gemini Text Analysis Prompt: {request.food}")
    try:
        response = text_model.generate_content(request.food)
        raw = response.text
        start = raw.find('{')
        end = raw.rfind('}') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in response: " + raw)
            
        json_str = raw[start:end]
        data = json.loads(json_str)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Gemini error: {exc}')
        
    food_name = data.get('food_name', request.food)
    calories = int(data.get('calories', 0))
    protein = int(data.get('protein', 0))
    carbs = int(data.get('carbs', 0))
    fat = int(data.get('fat', 0))
    fiber = int(data.get('fiber', 0))
    sugar = int(data.get('sugar', 0))
    sodium = int(data.get('sodium', 0))
    serving_size = data.get('serving_size', '1 serving')
    confidence_score = float(data.get('confidence_score', 0.8))
    
    minCalories = int(calories * 0.9)
    maxCalories = int(calories * 1.1)
    minFat = int(fat * 0.9)
    maxFat = int(fat * 1.1)
    minProtein = int(protein * 0.9)
    maxProtein = int(protein * 1.1)
    minCarbs = int(carbs * 0.9)
    maxCarbs = int(carbs * 1.1)
    
    minCholesterol = 0
    maxCholesterol = 0
    minFiber = int(fiber * 0.9)
    maxFiber = int(fiber * 1.1)
    minSugar = int(sugar * 0.9)
    maxSugar = int(sugar * 1.1)
    minSodium = int(sodium * 0.9)
    maxSodium = int(sodium * 1.1)

    spoon_nut = check_spoonacular_nutrition(food_name)
    if spoon_nut:
        calories = spoon_nut.get('calories', calories)
        protein = spoon_nut.get('protein', protein)
        carbs = spoon_nut.get('carbs', carbs)
        fat = spoon_nut.get('fat', fat)
        
        minCalories = spoon_nut.get('minCalories', minCalories)
        maxCalories = spoon_nut.get('maxCalories', maxCalories)
        minFat = spoon_nut.get('minFat', minFat)
        maxFat = spoon_nut.get('maxFat', maxFat)
        minProtein = spoon_nut.get('minProtein', minProtein)
        maxProtein = spoon_nut.get('maxProtein', maxProtein)
        minCarbs = spoon_nut.get('minCarbs', minCarbs)
        maxCarbs = spoon_nut.get('maxCarbs', maxCarbs)
        
        minCholesterol = spoon_nut.get('minCholesterol', minCholesterol)
        maxCholesterol = spoon_nut.get('maxCholesterol', maxCholesterol)
        minFiber = spoon_nut.get('minFiber', minFiber)
        maxFiber = spoon_nut.get('maxFiber', maxFiber)
        minSugar = spoon_nut.get('minSugar', minSugar)
        maxSugar = spoon_nut.get('maxSugar', maxSugar)
        minSodium = spoon_nut.get('minSodium', minSodium)
        maxSodium = spoon_nut.get('maxSodium', maxSodium)
        
        confidence_score = min(1.0, confidence_score + 0.1)
        
    return AnalyzeTextResponse(
        food_name=food_name,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fiber=fiber,
        sugar=sugar,
        sodium=sodium,
        serving_size=serving_size,
        confidence_score=confidence_score,
        minCalories=minCalories,
        maxCalories=maxCalories,
        minFat=minFat,
        maxFat=maxFat,
        minProtein=minProtein,
        maxProtein=maxProtein,
        minCarbs=minCarbs,
        maxCarbs=maxCarbs,
        minCholesterol=minCholesterol,
        maxCholesterol=maxCholesterol,
        minFiber=minFiber,
        maxFiber=maxFiber,
        minSugar=minSugar,
        maxSugar=maxSugar,
        minSodium=minSodium,
        maxSodium=maxSodium
    )
