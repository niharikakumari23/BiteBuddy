// backend/models/MealLog.js

const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String }, // path to uploaded image
  foodName: { type: String, required: true },
  calories: { type: Number },
  carbs: { type: Number },
  protein: { type: Number },
  fats: { type: Number },
  loggedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MealLog', mealLogSchema);
