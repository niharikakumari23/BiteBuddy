// backend/services/geminiService.js

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialise the Gemini client with API key from env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Analyze a food image using Gemini and return macro‑nutrient JSON.
 * @param {string} imagePath Absolute path to the uploaded image file.
 * @returns {Promise<Object>} Object with keys: food_name, calories, carbs, protein, fats.
 */
async function analyzeImage(imagePath) {
  try {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const imgPart = {
      inlineData: {
        mimeType: 'image/jpeg', // assuming JPEG; Gemini also accepts png
        data: imageBuffer.toString('base64'),
      },
    };

    const systemPrompt = `You are a nutrition expert. Analyze the supplied food photograph and return ONLY a JSON object with EXACT keys: food_name (string), calories (integer), carbs (integer), protein (integer), fats (integer), fiber (integer), sugar (integer), sodium (integer). Do not include any extra text, markdown, or explanations.`;

    const result = await model.generateContent([imgPart, { text: systemPrompt }]);
    const responseText = result.response.text();
    // Gemini may include stray whitespace; attempt to extract JSON substring
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error('Gemini analysis error:', err);
    throw new Error('Failed to analyse image with Gemini');
  }
}

/**
 * Analyze a food image from a memory buffer (for serverless environments).
 * @param {Buffer} imageBuffer The image file buffer from multer memory storage.
 * @param {string} mimeType The MIME type of the image (e.g. 'image/jpeg').
 * @returns {Promise<Object>} Object with keys: food_name, calories, carbs, protein, fats.
 */
async function analyzeImageBuffer(imageBuffer, mimeType) {
  try {
    const imgPart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBuffer.toString('base64'),
      },
    };

    const systemPrompt = `You are a nutrition expert. Analyze the supplied food photograph and return ONLY a JSON object with EXACT keys: food_name (string), calories (integer), carbs (integer), protein (integer), fats (integer), fiber (integer), sugar (integer), sodium (integer). Do not include any extra text, markdown, or explanations.`;

    const result = await model.generateContent([imgPart, { text: systemPrompt }]);
    const responseText = result.response.text();
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error('Gemini buffer analysis error:', err);
    throw new Error('Failed to analyse image buffer with Gemini');
  }
}

/**
 * Query Spoonacular to get accurate nutrition details.
 * @param {string} foodName Name of the food.
 * @returns {Promise<Object|null>} Nutrition object or null.
 */
async function checkSpoonacularNutrition(foodName) {
  const apiKey = process.env.SPOONACULAR_KEY;
  if (!apiKey) return null;
  try {
    const encodedTitle = encodeURIComponent(foodName);
    
    // Try parseIngredients first to get detailed nutritional breakdown
    const parseUrl = `https://api.spoonacular.com/recipes/parseIngredients?apiKey=${apiKey}`;
    const parseRes = await fetch(parseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: `ingredientList=1 serving of ${encodedTitle}&servings=1&includeNutrition=true`
    });

    if (parseRes.ok) {
      const parseData = await parseRes.json();
      if (Array.isArray(parseData) && parseData.length > 0 && parseData[0].nutrition) {
        const nutrients = parseData[0].nutrition.nutrients || [];
        
        const getNutrientVal = (name) => {
          const nut = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
          return nut ? Math.round(nut.amount) : 0;
        };

        const calories = getNutrientVal('Calories');
        const fat = getNutrientVal('Fat');
        const protein = getNutrientVal('Protein');
        const carbs = getNutrientVal('Carbohydrates');
        const fiber = getNutrientVal('Fiber');
        const sugar = getNutrientVal('Sugar');
        const sodium = getNutrientVal('Sodium');
        const cholesterol = getNutrientVal('Cholesterol');

        return {
          calories,
          protein,
          carbs,
          fats: fat,
          fat,
          fiber,
          sugar,
          sodium,
          cholesterol,
          
          minCalories: Math.round(calories * 0.9),
          maxCalories: Math.round(calories * 1.1),
          minFat: Math.round(fat * 0.9),
          maxFat: Math.round(fat * 1.1),
          minProtein: Math.round(protein * 0.9),
          maxProtein: Math.round(protein * 1.1),
          minCarbs: Math.round(carbs * 0.9),
          maxCarbs: Math.round(carbs * 1.1),
          minFiber: Math.round(fiber * 0.9),
          maxFiber: Math.round(fiber * 1.1),
          minSugar: Math.round(sugar * 0.9),
          maxSugar: Math.round(sugar * 1.1),
          minSodium: Math.round(sodium * 0.9),
          maxSodium: Math.round(sodium * 1.1),
          minCholesterol: Math.round(cholesterol * 0.9),
          maxCholesterol: Math.round(cholesterol * 1.1)
        };
      }
    }
  } catch (err) {
    console.error('Spoonacular parseIngredients API error:', err);
  }

  // Fallback to guessNutrition if parseIngredients fails
  try {
    const encodedTitle = encodeURIComponent(foodName);
    const url = `https://api.spoonacular.com/recipes/guessNutrition?title=${encodedTitle}&apiKey=${apiKey}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.calories && typeof data.calories === 'object') {
        const cal = data.calories;
        const fat = data.fat;
        const pro = data.protein;
        const carb = data.carbs;
        
        const scaled = {
          calories: Math.round(cal.value || 0),
          protein: Math.round(pro.value || 0),
          carbs: Math.round(carb.value || 0),
          fat: Math.round(fat.value || 0)
        };
        
        return {
          calories: scaled.calories,
          protein: scaled.protein,
          carbs: scaled.carbs,
          fats: scaled.fat,
          fat: scaled.fat,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          cholesterol: 0,
          
          minCalories: Math.round(cal.confidenceRange95Percent?.min || scaled.calories),
          maxCalories: Math.round(cal.confidenceRange95Percent?.max || scaled.calories),
          minFat: Math.round(fat.confidenceRange95Percent?.min || scaled.fat),
          maxFat: Math.round(fat.confidenceRange95Percent?.max || scaled.fat),
          minProtein: Math.round(pro.confidenceRange95Percent?.min || scaled.protein),
          maxProtein: Math.round(pro.confidenceRange95Percent?.max || scaled.protein),
          minCarbs: Math.round(carb.confidenceRange95Percent?.min || scaled.carbs),
          maxCarbs: Math.round(carb.confidenceRange95Percent?.max || scaled.carbs),
          
          minCholesterol: 0,
          maxCholesterol: 0,
          minFiber: 0,
          maxFiber: 0,
          minSugar: 0,
          maxSugar: 0,
          minSodium: 0,
          maxSodium: 0
        };
      }
    }
  } catch (err) {
    console.error('Spoonacular guessNutrition API error:', err);
  }
  return null;
}

module.exports = { analyzeImage, analyzeImageBuffer, checkSpoonacularNutrition };


