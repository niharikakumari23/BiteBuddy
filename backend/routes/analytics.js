const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');
const WorkoutLog = require('../models/WorkoutLog');
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// GET /api/analytics
router.get('/', auth, async (req, res) => {
  try {
    const todayStr = analyticsService.getLocalDateString(new Date());

    const dailyTotals = await analyticsService.calculateDailyTotals(req.user._id, todayStr);
    const workoutsBurned = await analyticsService.calculateWorkoutsBurned(req.user._id, todayStr);
    
    const mealStreak = await analyticsService.calculateStreak(req.user._id, MealLog);
    const workoutStreak = await analyticsService.calculateStreak(req.user._id, WorkoutLog);

    const weeklyTrends = await analyticsService.calculateWeeklyTrends(req.user._id);
    const monthlySummary = await analyticsService.calculateMonthlySummary(req.user._id);

    res.json({
      todayTotals: dailyTotals,
      workoutsBurned,
      streaks: {
        meals: mealStreak,
        workouts: workoutStreak
      },
      weeklyTrends,
      monthlySummary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
