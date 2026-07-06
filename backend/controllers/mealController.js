// backend/controllers/mealController.js

const path = require('path');
const MealLog = require('../models/MealLog');
const { analyzeImage } = require('../services/geminiService');

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

    // Build document – mapping Gemini keys to our schema fields
    const mealDoc = new MealLog({
      userId: getDemoUserId(),
      imageUrl,
      foodName: geminiData.food_name || geminiData.foodName,
      calories: geminiData.calories,
      carbs: geminiData.carbs,
      protein: geminiData.protein,
      fats: geminiData.fats,
    });

    const savedMeal = await mealDoc.save();

    res.status(201).json(savedMeal);
  } catch (err) {
    console.error('Meal scan error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

module.exports = { scanMeal };
