const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const WorkoutTemplate = require('../models/WorkoutTemplate');
const { adjustWeeklyPlanForUser } = require('./meallog');
const auth = require('../middleware/auth');

/**
 * Helper to calculate workout metrics from raw exercises and sets data
 */
function calculateWorkoutMetrics(exercises) {
  let totalSets = 0;
  let totalReps = 0;
  let trainingVolume = 0;
  const musclesSet = new Set();

  if (exercises && Array.isArray(exercises)) {
    exercises.forEach(ex => {
      if (ex.muscleGroup) {
        musclesSet.add(ex.muscleGroup);
      }
      if (ex.sets && Array.isArray(ex.sets)) {
        ex.sets.forEach(set => {
          if (set.isCompleted) {
            totalSets += 1;
            totalReps += (set.reps || 0);
            trainingVolume += ((set.reps || 0) * (set.weight || 0));
          }
        });
      }
    });
  }

  return {
    totalSets,
    totalReps,
    trainingVolume,
    primaryMuscleGroups: Array.from(musclesSet)
  };
}

// ==========================================
// 1. WORKOUT LOG / HISTORY ENDPOINTS
// ==========================================

// GET /api/workouts - Get workout history
router.get('/', auth, async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts - Log a completed workout
router.post('/', auth, async (req, res) => {
  try {
    const { exercises, type, duration, caloriesBurned, notes, templateId } = req.body;
    
    // Calculate metrics
    const metrics = calculateWorkoutMetrics(exercises);

    const log = new WorkoutLog({
      userId: req.user._id,
      type: type || 'Custom Workout',
      duration: duration || 0,
      caloriesBurned: caloriesBurned || 0,
      exercises,
      notes,
      totalSets: metrics.totalSets,
      totalReps: metrics.totalReps,
      trainingVolume: metrics.trainingVolume,
      primaryMuscleGroups: metrics.primaryMuscleGroups,
      date: req.body.date || new Date()
    });

    await log.save();

    // If completed via template, update template statistics
    if (templateId) {
      try {
        await WorkoutTemplate.findOneAndUpdate(
          { _id: templateId, userId: req.user._id },
          { 
            $inc: { timesUsed: 1 },
            $set: { lastUsed: new Date() }
          }
        );
      } catch (tmplErr) {
        console.error("Failed to update template usage stats:", tmplErr);
      }
    }

    // Trigger AI meal plan adjustment if this workout is for today
    const isToday = new Date(log.date).toDateString() === new Date().toDateString();
    let updatedPlan = null;
    if (isToday) {
      updatedPlan = await adjustWeeklyPlanForUser(req.user._id);
    }

    res.status(201).json({
      success: true,
      workoutLog: log,
      mealPlan: updatedPlan
    });
  } catch (err) {
    console.error("Log workout error:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/workouts/:id - Delete a logged workout
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedLog = await WorkoutLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!deletedLog) {
      return res.status(404).json({ error: 'Workout log not found or unauthorized' });
    }

    // Trigger AI adjustment since a workout was removed
    const isToday = new Date(deletedLog.date).toDateString() === new Date().toDateString();
    let updatedPlan = null;
    if (isToday) {
      updatedPlan = await adjustWeeklyPlanForUser(req.user._id);
    }

    res.json({
      success: true,
      mealPlan: updatedPlan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. WORKOUT TEMPLATES ENDPOINTS
// ==========================================

// GET /api/workouts/templates - Get all templates
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await WorkoutTemplate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts/templates - Create a template
router.post('/templates', auth, async (req, res) => {
  try {
    const template = new WorkoutTemplate({
      ...req.body,
      userId: req.user._id
    });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/workouts/templates/:id - Edit a template
router.put('/templates/:id', auth, async (req, res) => {
  try {
    const updatedTemplate = await WorkoutTemplate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }
    res.json(updatedTemplate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/workouts/templates/:id/duplicate - Duplicate a template
router.post('/templates/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await WorkoutTemplate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!original) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }

    const copy = new WorkoutTemplate({
      userId: req.user._id,
      name: `${original.name} (Copy)`,
      exercises: original.exercises,
      notes: original.notes,
      timesUsed: 0
    });

    await copy.save();
    res.status(201).json(copy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/workouts/templates/:id - Delete a template
router.delete('/templates/:id', auth, async (req, res) => {
  try {
    const deleted = await WorkoutTemplate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }
    res.json({ success: true, deletedId: deleted._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
