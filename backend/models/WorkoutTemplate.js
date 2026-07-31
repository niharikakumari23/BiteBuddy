const mongoose = require('mongoose');

const templateSetSchema = new mongoose.Schema({
  setIndex: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  restTime: { type: Number, default: 60 }
});

const templateExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String },
  sets: [templateSetSchema],
  notes: { type: String }
});

const workoutTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  exercises: [templateExerciseSchema],
  notes: { type: String },
  timesUsed: { type: Number, default: 0 },
  lastUsed: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);
