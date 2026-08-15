const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const WorkoutLog = require('../models/WorkoutLog');
const MealPlan = require('../models/MealPlan');
const auth = require('../middleware/auth');

// POST /api/generate
router.post('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(400).json({ error: 'No profile found. Please complete onboarding first.' });
    }

    const workouts = await WorkoutLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(5);

    // Call Python AI Service (deployed separately, e.g. on Render)
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/ai/personalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: profile,
        recentWorkouts: workouts
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Service Error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    
    // Create new meal plan associated with this user
    const newPlan = new MealPlan({
      userId: req.user._id,
      userProfileId: profile._id,
      plan: aiData.plan,
      shoppingList: aiData.shoppingList,
      calorieTarget: aiData.calorieTarget,
      macroTargets: aiData.macroTargets,
      advice: aiData.advice
    });

    await newPlan.save();
    res.json(newPlan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET active plan for the current user
router.get('/', auth, async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT active plan (Save user modifications)
router.put('/', auth, async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });
    if (!plan) return res.status(404).json({ error: 'No active plan to modify' });

    if (req.body.plan) {
      plan.plan = req.body.plan;
    }
    if (req.body.shoppingList) {
      plan.shoppingList = req.body.shoppingList;
    }

    // Mark as modified since it's a Mixed type
    plan.markModified('plan');
    plan.markModified('shoppingList');

    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
