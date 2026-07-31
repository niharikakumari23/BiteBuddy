const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
  generatedAt: { type: Date, default: Date.now },
  plan: { type: mongoose.Schema.Types.Mixed, required: true },
  shoppingList: { type: mongoose.Schema.Types.Mixed, required: true },
  calorieTarget: { type: Number },
  macroTargets: {
    protein: Number,
    carbs: Number,
    fat: Number
  },
  advice: {
    nutrition: String,
    recovery: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
