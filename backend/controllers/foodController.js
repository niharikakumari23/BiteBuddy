// backend/controllers/foodController.js

const MealLog = require('../models/MealLog');
const MealPlan = require('../models/MealPlan');
const UserProfile = require('../models/UserProfile');
const WorkoutLog = require('../models/WorkoutLog');

/**
 * Helper to get day string matching the plan keys (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
 */
function getDayString() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

/**
 * Helper to guess meal type based on local hour
 */
function getMealTypeFromHour() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Breakfast';
  if (hour >= 11 && hour < 16) return 'Lunch';
  if (hour >= 16 && hour < 22) return 'Dinner';
  return 'Snacks';
}

/**
 * POST /api/food/analyze
 * Body: { food: string, persist: boolean, mealType: string }
 */
async function analyzeAndLogFood(req, res) {
  try {
    const { food, persist = true, mealType } = req.body;
    if (!food || typeof food !== 'string' || !food.trim()) {
      return res.status(400).json({ error: 'Food description is required.' });
    }

    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(400).json({ error: 'No profile found. Please complete onboarding first.' });
    }

    // 1. Call FastAPI to analyze text description
    const aiResponse = await fetch('http://127.0.0.1:8000/api/meals/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Analysis Service Error: ${errText}`);
    }

    const nutritionData = await aiResponse.json();

    let savedMeal = null;
    let todayLogs = [];
    let updatedPlan = null;
    let adjusted = false;
    let adjustmentNotification = '';

    if (persist) {
      // Determine mealType
      const finalMealType = mealType || getMealTypeFromHour();

      // 2. Save meal log into MongoDB
      const mealDoc = new MealLog({
        userId: req.user._id,
        userProfileId: profile._id,
        foodName: nutritionData.food_name,
        calories: nutritionData.calories,
        carbs: nutritionData.carbs,
        protein: nutritionData.protein,
        fats: nutritionData.fat, // map fat from API to fats in schema
        fiber: nutritionData.fiber,
        sugar: nutritionData.sugar,
        sodium: nutritionData.sodium,
        servingSize: nutritionData.serving_size,
        confidenceScore: nutritionData.confidence_score,
        mealType: finalMealType,
        source: 'AI Food Search'
      });

      savedMeal = await mealDoc.save();

      // Fetch all today's logs to calculate today's summary
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      todayLogs = await MealLog.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ createdAt: -1 });

      const consumedToday = todayLogs.reduce((acc, log) => {
        acc.calories += (log.calories || 0);
        acc.protein += (log.protein || 0);
        acc.carbs += (log.carbs || 0);
        acc.fat += (log.fats || 0);
        acc.fiber += (log.fiber || 0);
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      // 3. Fetch Weekly Plan
      const activePlan = await MealPlan.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });
      if (activePlan && activePlan.plan) {
        const todayDay = getDayString();
        const dailyTargets = {
          calories: activePlan.calorieTarget || 2000,
          protein: activePlan.macroTargets?.protein || 150,
          carbs: activePlan.macroTargets?.carbs || 200,
          fat: activePlan.macroTargets?.fat || 65,
          fiber: 30 // default fiber goal
        };

        // Fetch today's workouts to pass to AI
        const todayWorkouts = await WorkoutLog.find({
          userId: req.user._id,
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        // Call FastAPI to adjust remaining plan
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
            adjusted = true;
            activePlan.plan[todayDay] = adjustData.adjusted_day_plan;
            activePlan.markModified('plan');

            // Regenerate weekly shopping list based on the new plan
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

            // Save adjustments
            updatedPlan = await activePlan.save();
            adjustmentNotification = adjustData.advice || "We adjusted today's remaining meals to keep you closer to your nutrition goals.";
          } else {
            updatedPlan = activePlan;
          }
        } else {
          updatedPlan = activePlan;
        }
      }
    }

    res.status(200).json({
      success: true,
      nutrition: nutritionData,
      mealLog: savedMeal,
      todayLogs: todayLogs,
      mealPlan: updatedPlan,
      adjusted,
      adjustmentNotification
    });

  } catch (err) {
    console.error('Quick food entry error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

module.exports = {
  analyzeAndLogFood
};
