import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from google.generativeai import GenerativeModel

router = APIRouter()

def get_fallback_meal_plan(profile: Dict[str, Any]) -> Dict[str, Any]:
    country = profile.get('country') or 'India'
    diet = (profile.get('dietType') or 'balanced').lower()
    cals = int(profile.get('targetCalories') or profile.get('calorieTarget') or 2000)
    if cals <= 0:
        cals = 2000
    
    # Calculate protein, carbs, fats targets based on diet and calories
    if diet == 'keto':
        pro = int(cals * 0.25 / 4)
        carbs = int(cals * 0.05 / 4)
        fat = int(cals * 0.70 / 9)
    elif diet == 'high-protein':
        pro = int(cals * 0.35 / 4)
        carbs = int(cals * 0.40 / 4)
        fat = int(cals * 0.25 / 9)
    else: # balanced / vegan
        pro = int(cals * 0.25 / 4)
        carbs = int(cals * 0.50 / 4)
        fat = int(cals * 0.25 / 9)
        
    # Local Indian recipes list
    if country.lower() == 'india':
        if diet == 'keto':
            bf_name = "Paneer Bhurji (200g) with spinach"
            lh_name = "Keto Tandoori Chicken Salad or Butter Paneer (no sugar)"
            dn_name = "Mutton Seekh Kebab or Grilled Paneer Tikka with cucumber"
            shop = [
                {"name": "Paneer", "qty": "1kg"},
                {"name": "Chicken Breast", "qty": "500g"},
                {"name": "Spinach", "qty": "1 bunch"},
                {"name": "Butter", "qty": "500g"},
                {"name": "Cucumber", "qty": "1kg"}
            ]
        elif diet == 'vegan':
            bf_name = "Moong Dal Cheela with green chutney"
            lh_name = "Brown Rice with Dal Tadka and Stir-fry Cabbage"
            dn_name = "Soya Chunks Masala with 2 Bajra Rotis"
            shop = [
                {"name": "Moong Dal", "qty": "1kg"},
                {"name": "Brown Rice", "qty": "1kg"},
                {"name": "Soya Chunks", "qty": "500g"},
                {"name": "Bajra Flour", "qty": "1kg"},
                {"name": "Cabbage", "qty": "1 head"}
            ]
        else: # balanced / high-protein
            bf_name = "Oatmeal with almonds & banana or 2 Masala Omelettes with Toast"
            lh_name = "Roti (2 pcs) with Chicken Curry or Paneer Masala and Dal Tadka"
            dn_name = "Grilled Fish or Tofu Tikka with steamed Broccoli and Moong Dal"
            shop = [
                {"name": "Eggs", "qty": "1 dozen"},
                {"name": "Oats", "qty": "1kg"},
                {"name": "Chicken Curry pieces", "qty": "1kg"},
                {"name": "Moong Dal", "qty": "1kg"},
                {"name": "Broccoli", "qty": "500g"}
            ]
        advice_nut = "Prioritize locally sourced lentils (Dal), paneer, and eggs for your protein intake. Keep rotis portion-controlled."
    elif country.lower() == 'mexico':
        bf_name = "Huevos Rancheros with corn tortilla"
        lh_name = "Chicken Burrito Bowl with black beans and salsa"
        dn_name = "Carne Asada with sliced Avocado and lime salad"
        shop = [
            {"name": "Eggs", "qty": "1 dozen"},
            {"name": "Chicken Breast", "qty": "1kg"},
            {"name": "Avocado", "qty": "3 pcs"},
            {"name": "Black Beans", "qty": "2 cans"},
            {"name": "Corn Tortillas", "qty": "1 pack"}
        ]
        advice_nut = "Focus on healthy fats from fresh avocados and prioritize lean beef/chicken for protein."
    else: # USA / default
        bf_name = "Oatmeal with peanut butter and protein powder"
        lh_name = "Turkey & Swiss Cheese Wrap with whole wheat tortilla"
        dn_name = "Baked Salmon with sweet potato and green beans"
        shop = [
            {"name": "Oats", "qty": "1 pack"},
            {"name": "Salmon Fillets", "qty": "4 pcs"},
            {"name": "Turkey Breast slices", "qty": "1 pack"},
            {"name": "Sweet Potatoes", "qty": "1kg"},
            {"name": "Green Beans", "qty": "500g"}
        ]
        advice_nut = "Include lean protein sources such as turkey and salmon, and keep carbs complex (oats/sweet potato)."

    plan = {}
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        plan[day] = {
            "breakfast": {"name": bf_name, "kcal": int(cals * 0.25)},
            "lunch": {"name": lh_name, "kcal": int(cals * 0.45)},
            "dinner": {"name": dn_name, "kcal": int(cals * 0.30)}
        }
        
    return {
        "plan": plan,
        "shoppingList": shop,
        "calorieTarget": cals,
        "macroTargets": {
            "protein": pro,
            "carbs": carbs,
            "fat": fat
        },
        "advice": {
            "nutrition": advice_nut,
            "recovery": "Hydrate well after training. Rest at least 7-8 hours tonight."
        }
    }

SYSTEM_PROMPT = """
You are an expert fitness, nutrition, and AI health coach. 
Given a user's profile and their recent workout history, generate a highly personalized weekly meal plan.

CRITICAL INSTRUCTION FOR LOCAL CUISINES:
Identify the user's country from their profile (e.g. "country" field). 
You MUST suggest local food dishes, meals, and ingredients that are native, highly popular, and easily accessible in that specific country.
For example:
- If the country is India, suggest popular Indian fitness meals (e.g., Paneer Bhurji, Chicken Biryani, Roti/Tandoori Roti, Poha, Besan Cheela, Dal Tadka, Moong Dal).
- If the country is USA, suggest typical American fitness meals (e.g., Oatmeal, Turkey Wrap, Chicken Breast with Broccoli, Grilled Salmon, Salad).
- If the country is Mexico, suggest Mexican fit options (e.g., Chicken Tacos, Huevos Rancheros, Burrito Bowls).
Always adapt the names of the dishes to be local and familiar to that country's culture.

Return exactly and ONLY a JSON object matching this schema:
{
  "plan": {
    "Mon": { "breakfast": {"name": "...", "kcal": 0}, "lunch": {"name": "...", "kcal": 0}, "dinner": {"name": "...", "kcal": 0} },
    "Tue": { ... },
    ...
    "Sun": { ... }
  },
  "shoppingList": [
    { "name": "...", "qty": "..." }
  ],
  "calorieTarget": 0,
  "macroTargets": {
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "advice": {
    "nutrition": "...",
    "recovery": "..."
  }
}
Do not include any markdown wrappers (like ```json), just the raw JSON object.
"""

from prompts import ADJUST_SYSTEM_PROMPT
model = GenerativeModel(
    model_name='gemini-2.5-flash', 
    system_instruction=SYSTEM_PROMPT
)
adjust_model = GenerativeModel(
    model_name='gemini-2.5-flash',
    system_instruction=ADJUST_SYSTEM_PROMPT
)

class AIPersonalizeRequest(BaseModel):
    profile: Dict[str, Any]
    recentWorkouts: List[Dict[str, Any]]

@router.post('/api/ai/personalize')
def personalize_plan(request: AIPersonalizeRequest):
    try:
        country = request.profile.get('country') or 'India'
        prompt = (
            f"User Profile: {json.dumps(request.profile)}\n"
            f"User Country Preference: {country}\n"
            f"Recent Workouts: {json.dumps(request.recentWorkouts)}\n"
            f"Generate the personalized plan. Remember that the user is located in {country}, "
            f"so you MUST generate weekly meals, breakfast/lunch/dinner dishes, and grocery shopping list items native, highly popular, and easily accessible in {country}."
        )
        response = model.generate_content(prompt)
        
        raw = response.text
        start = raw.find('{')
        end = raw.rfind('}') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in response")
            
        json_str = raw[start:end]
        data = json.loads(json_str)
        
        return data
    except Exception as exc:
        print(f"Gemini personalize failed: {exc}. Using robust localized fallback generator...")
        return get_fallback_meal_plan(request.profile)

from typing import Optional

class AIAdjustRequest(BaseModel):
    current_plan: Dict[str, Any]
    today_day: str
    consumed_today: Dict[str, Any]
    daily_targets: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None
    today_workouts: Optional[List[Dict[str, Any]]] = None

@router.post('/api/ai/adjust')
def adjust_plan(request: AIAdjustRequest):
    try:
        prompt = (
            f"Current Plan: {json.dumps(request.current_plan)}\n"
            f"Today: {request.today_day}\n"
            f"Consumed Today: {json.dumps(request.consumed_today)}\n"
            f"Daily Targets: {json.dumps(request.daily_targets)}\n"
            f"User Profile: {json.dumps(request.profile) if request.profile else 'N/A'}\n"
            f"Today's Workouts Logged: {json.dumps(request.today_workouts) if request.today_workouts else '[]'}\n"
            f"Adjust the remaining meals for today."
        )
        response = adjust_model.generate_content(prompt)
        raw = response.text
        start = raw.find('{')
        end = raw.rfind('}') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in response: " + raw)
            
        json_str = raw[start:end]
        data = json.loads(json_str)
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Gemini error: {exc}')
