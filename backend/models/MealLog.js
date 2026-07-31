// backend/models/MealLog.js

const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
  imageUrl: { type: String }, 
  foodName: { type: String, required: true },
  calories: { type: Number, required: true },
  carbs: { type: Number, required: true },
  protein: { type: Number, required: true },
  fats: { type: Number, required: true },
  mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], required: true },
  time: { type: String }, // e.g. "08:30 AM"
  date: { type: Date, default: Date.now },
  fiber: { type: Number, default: 0 },
  servingSize: { type: String },
  source: { type: String, default: 'Manual' },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  confidenceScore: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('MealLog', mealLogSchema);
