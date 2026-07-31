// backend/controllers/mealController.js

const path = require('path');
const MealLog = require('../models/MealLog');
const { analyzeImage, checkSpoonacularNutrition } = require('../services/geminiService');

/**
 * Helper to get demo user ID – replace with real auth later.
 */
function getDemoUserId() {
  return 'demo-user';
}

/**
 * POST /api/meals/scan
 * Expects an uploaded image file (field name "image").
 * Calls Gemini to extract food macros, stores them in MongoDB, and returns the saved document.
 */
async function scanMeal(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file missing' });
    }

    const imagePath = req.file.path; // absolute path on disk
    const imageUrl = `/uploads/${path.basename(imagePath)}`; // served statically by Express

    // Call Gemini service
    const geminiData = await analyzeImage(imagePath);
    const foodName = geminiData.food_name || geminiData.foodName || 'Unknown Food';

    let calories = geminiData.calories;
    let carbs = geminiData.carbs;
    let protein = geminiData.protein;
    let fats = geminiData.fats || geminiData.fat;
    let fiber = geminiData.fiber || 0;
    let sugar = geminiData.sugar || 0;
    let sodium = geminiData.sodium || 0;
    let servingSize = geminiData.serving_size || geminiData.servingSize || '1 serving';
    let confidenceScore = geminiData.confidence_score || geminiData.confidenceScore || 0.85;

    try {
      const spoonData = await checkSpoonacularNutrition(foodName);
      if (spoonData) {
        calories = spoonData.calories;
        carbs = spoonData.carbs;
        protein = spoonData.protein;
        fats = spoonData.fats || spoonData.fat;
        fiber = spoonData.fiber || 0;
        sugar = spoonData.sugar || 0;
        sodium = spoonData.sodium || 0;
      }
    } catch (err) {
      console.error('Spoonacular check failed, using Gemini data:', err);
    }

    // Build document – mapping Gemini keys to our schema fields
    const mealDoc = new MealLog({
      userId: getDemoUserId(),
      imageUrl,
      foodName,
      calories,
      carbs,
      protein,
      fats,
      fiber,
      sugar,
      sodium,
      servingSize,
      confidenceScore,
      mealType: 'Snacks' // default fallback type
    });

    const savedMeal = await mealDoc.save();

    res.status(201).json(savedMeal);
  } catch (err) {
    console.error('Meal scan error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

module.exports = { scanMeal };
