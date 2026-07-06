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

    const systemPrompt = `You are a nutrition expert. Analyze the supplied food photograph and return ONLY a JSON object with EXACT keys: food_name (string), calories (integer), carbs (integer), protein (integer), fats (integer). Do not include any extra text, markdown, or explanations.`;

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

module.exports = { analyzeImage };
