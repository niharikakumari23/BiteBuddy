const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const WorkoutLog = require('../models/WorkoutLog');
const MealLog = require('../models/MealLog');
const MealPlan = require('../models/MealPlan');
const auth = require('../middleware/auth');

// POST /api/chat - Context-aware AI Coach proxy
router.post('/', auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages list is required.' });
    }

    // 1. Retrieve User Context
    const profile = await UserProfile.findOne({ userId: req.user._id });
    const workouts = await WorkoutLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(10);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayWorkouts = await WorkoutLog.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const todayLogs = await MealLog.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const activePlan = await MealPlan.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });

    // 2. Calculate remaining macros
    const consumed = todayLogs.reduce((acc, log) => {
      acc.calories += (log.calories || 0);
      acc.protein += (log.protein || 0);
      acc.carbs += (log.carbs || 0);
      acc.fat += (log.fats || log.fat || 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const targets = {
      calories: activePlan?.calorieTarget || 2000,
      protein: activePlan?.macroTargets?.protein || 150,
      carbs: activePlan?.macroTargets?.carbs || 200,
      fat: activePlan?.macroTargets?.fat || 65
    };

    const remaining = {
      calories: targets.calories - consumed.calories,
      protein: targets.protein - consumed.protein,
      carbs: targets.carbs - consumed.carbs,
      fat: targets.fat - consumed.fat
    };

    // 3. Format Context Prompt
    const contextPrompt = `
[SYSTEM CONTEXT]
User Profile Name: ${profile?.name || 'User'}
Goal: ${profile?.primaryGoal || 'N/A'}, Diet Type: ${profile?.dietType || 'N/A'}
Experience: ${profile?.trainingExperience || 'N/A'}, Splits Pref: ${profile?.preferredSplit || 'N/A'}, Location: ${profile?.gymOrHome || 'N/A'}
Today's Workouts Logged: ${JSON.stringify(todayWorkouts.map(w => ({ type: w.type, duration: w.duration, cals: w.caloriesBurned, muscles: w.primaryMuscleGroups, volume: w.trainingVolume })))}
Recent Workout History (Last 10): ${JSON.stringify(workouts.map(w => ({ date: w.date.toLocaleDateString(), type: w.type, duration: w.duration, volume: w.trainingVolume })))}
Today's Consumed: Calories: ${consumed.calories} kcal, Protein: ${consumed.protein}g, Carbs: ${consumed.carbs}g, Fat: ${consumed.fat}g
Daily Targets: Calories: ${targets.calories} kcal, Protein: ${targets.protein}g, Carbs: ${targets.carbs}g, Fat: ${targets.fat}g
Today's Remaining Budget: Calories: ${remaining.calories} kcal, Protein: ${remaining.protein}g, Carbs: ${remaining.carbs}g, Fat: ${remaining.fat}g

[INSTRUCTIONS]
You are BiteBuddy AI, the user's smart coach. Use the context details above to answer their questions about today's remaining calories, workout history, recovery tips, and custom post-workout macros. Always maintain this context implicitly. Answer questions conversationally.
`;

    // 4. Build chat payload history (inject context first)
    const chatPayload = [
      { role: 'user', content: contextPrompt },
      { role: 'model', content: "Understood. I have locked in Niharika's profile, today's workout stats, history, and macros. Ready to coach!" },
      ...messages
    ];

    // 5. Query FastAPI AI service (deployed separately, e.g. on Render)
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatPayload })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Chat Service Error: ${errText}`);
    }

    const data = await aiResponse.json();
    res.json(data);
  } catch (err) {
    console.error("Express Chat proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
