const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  height: { type: Number, required: true },
  currentWeight: { type: Number, required: true },
  targetWeight: { type: Number, required: true },
  primaryGoal: { type: String, required: true },
  dietType: { type: String, required: true },
  allergies: [{ type: String }],
  foodsToAvoid: [{ type: String }],
  cuisinePreference: { type: String },
  monthlyFoodBudget: { type: Number },
  dailyActivityLevel: { type: String, required: true },
  workoutStatus: { type: String, required: true },
  workoutType: { type: String },
  workoutFrequency: { type: Number },
  workoutDuration: { type: Number },
  workoutTime: { type: String },
  waterGoal: { type: Number, required: true },
  sleepHours: { type: Number, required: true },
  trainingExperience: { type: String },
  preferredSplit: { type: String },
  gymOrHome: { type: String },
  equipmentAvailable: [{ type: String }],
  country: { type: String, default: 'India' }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
