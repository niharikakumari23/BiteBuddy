const mongoose = require('mongoose');

const workoutSetSchema = new mongoose.Schema({
  setIndex: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  restTime: { type: Number, default: 60 },
  rpe: { type: Number },
  isCompleted: { type: Boolean, default: false }
});

const exerciseLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String },
  sets: [workoutSetSchema],
  notes: { type: String }
});

const workoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true }, // e.g. "Push Day", "Legs", "Cardio"
  duration: { type: Number, required: true }, // in minutes
  caloriesBurned: { type: Number, required: true },
  exercises: [exerciseLogSchema],
  totalSets: { type: Number, default: 0 },
  totalReps: { type: Number, default: 0 },
  trainingVolume: { type: Number, default: 0 },
  primaryMuscleGroups: [{ type: String }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
