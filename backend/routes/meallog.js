const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');
const UserProfile = require('../models/UserProfile');
const WorkoutLog = require('../models/WorkoutLog');
const auth = require('../middleware/auth');

// Get all meal logs for the current user (optionally filter by date)
router.get('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ error: 'Profile not found. Please complete onboarding first.' });

    let query = { userId: req.user._id };
    
    // Optional date filter: /api/meallog?date=2024-03-24
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const logs = await MealLog.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new meal log
router.post('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ error: 'Profile not found. Please complete onboarding first.' });

    const newLog = new MealLog({
      userId: req.user._id,
      userProfileId: profile._id,
      ...req.body
    });
    await newLog.save();

    // Check if it's today's log to trigger adjustment
    const isToday = new Date(newLog.date).toDateString() === new Date().toDateString();
    let updatedPlan = null;
    if (isToday) {
      updatedPlan = await adjustWeeklyPlanForUser(req.user._id);
    }

    res.status(201).json({
      success: true,
      mealLog: newLog,
      mealPlan: updatedPlan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to auto adjust plan for user
async function adjustWeeklyPlanForUser(userId) {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return null;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayLogs = await MealLog.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const consumedToday = todayLogs.reduce((acc, log) => {
      acc.calories += (log.calories || 0);
      acc.protein += (log.protein || 0);
      acc.carbs += (log.carbs || 0);
      acc.fat += (log.fats || log.fat || 0);
      acc.fiber += (log.fiber || 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const activePlan = await MealPlan.findOne({ userId }).sort({ generatedAt: -1 });
    if (!activePlan || !activePlan.plan) return null;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = days[new Date().getDay()];

    const dailyTargets = {
      calories: activePlan.calorieTarget || 2000,
      protein: activePlan.macroTargets?.protein || 150,
      carbs: activePlan.macroTargets?.carbs || 200,
      fat: activePlan.macroTargets?.fat || 65,
      fiber: 30
    };

    const todayWorkouts = await WorkoutLog.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const adjustRes = await fetch('http://127.0.0.1:8000/api/ai/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_plan: activePlan.plan,
        today_day: todayDay,
        consumed_today: consumedToday,
        daily_targets: dailyTargets,
        profile: profile,
        today_workouts: todayWorkouts
      })
    });

    if (adjustRes.ok) {
      const adjustData = await adjustRes.json();
      if (adjustData.adjusted && adjustData.adjusted_day_plan) {
        activePlan.plan[todayDay] = adjustData.adjusted_day_plan;
        activePlan.markModified('plan');

        const shoppingRes = await fetch('http://127.0.0.1:8000/api/shopping/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: activePlan.plan })
        });

        if (shoppingRes.ok) {
          const shoppingData = await shoppingRes.json();
          activePlan.shoppingList = shoppingData.items || [];
          activePlan.markModified('shoppingList');
        }

        return await activePlan.save();
      }
    }
    return activePlan;
  } catch (err) {
    console.error('Error auto adjusting meal plan:', err);
    return null;
  }
}

// Update a meal log
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedLog = await MealLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!updatedLog) {
      return res.status(404).json({ error: 'Meal log not found or unauthorized' });
    }

    // Check if it's today's log to trigger adjustment
    const isToday = new Date(updatedLog.date).toDateString() === new Date().toDateString();
    let updatedPlan = null;
    if (isToday) {
      updatedPlan = await adjustWeeklyPlanForUser(req.user._id);
    }

    res.json({
      success: true,
      mealLog: updatedLog,
      mealPlan: updatedPlan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a meal log
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedLog = await MealLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!deletedLog) {
      return res.status(404).json({ error: 'Meal log not found or unauthorized' });
    }

    // Check if it's today's log to trigger adjustment
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

module.exports = { router, adjustWeeklyPlanForUser };
