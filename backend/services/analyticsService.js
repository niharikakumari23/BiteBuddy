const MealLog = require('../models/MealLog');
const WorkoutLog = require('../models/WorkoutLog');
const MealPlan = require('../models/MealPlan');

// Helper to convert Date to YYYY-MM-DD local string
function getLocalDateString(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function calculateDailyTotals(userId, localDateStr) {
  const start = new Date(localDateStr + 'T00:00:00');
  const end = new Date(localDateStr + 'T23:59:59.999');
  
  const logs = await MealLog.find({
    userId,
    date: { $gte: start, $lte: end }
  });

  return logs.reduce((acc, log) => {
    acc.calories += (log.calories || 0);
    acc.protein += (log.protein || 0);
    acc.carbs += (log.carbs || 0);
    acc.fat += (log.fats || log.fat || 0);
    acc.fiber += (log.fiber || 0);
    acc.sugar += (log.sugar || 0);
    acc.sodium += (log.sodium || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
}

async function calculateWorkoutsBurned(userId, localDateStr) {
  const start = new Date(localDateStr + 'T00:00:00');
  const end = new Date(localDateStr + 'T23:59:59.999');

  const logs = await WorkoutLog.find({
    userId,
    date: { $gte: start, $lte: end }
  });

  return logs.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
}

async function calculateStreak(userId, Model) {
  const logs = await Model.find({ userId });
  if (logs.length === 0) return 0;

  const uniqueDates = Array.from(new Set(logs.map(l => getLocalDateString(l.date))));
  uniqueDates.sort((a, b) => new Date(b) - new Date(a)); // Descending order (newest first)

  let streak = 0;
  const todayStr = getLocalDateString(new Date());
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0;
  }

  let currentCheck = new Date();
  if (!uniqueDates.includes(todayStr)) {
    currentCheck.setDate(currentCheck.getDate() - 1);
  }

  while (true) {
    const checkStr = getLocalDateString(currentCheck);
    if (uniqueDates.includes(checkStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function calculateWeeklyTrends(userId) {
  const trends = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const activePlan = await MealPlan.findOne({ userId }).sort({ generatedAt: -1 });
  const targets = activePlan?.macroTargets || { protein: 150, carbs: 200, fat: 65 };
  const calorieGoal = activePlan?.calorieTarget || 2000;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayName = daysOfWeek[d.getDay()];

    const totals = await calculateDailyTotals(userId, dateStr);
    trends.push({
      day: dayName,
      date: dateStr,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber,
      targets: {
        calories: calorieGoal,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat
      }
    });
  }
  return trends;
}

async function calculateMonthlySummary(userId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const mealLogs = await MealLog.find({
    userId,
    date: { $gte: start, $lte: end }
  });

  const activePlan = await MealPlan.findOne({ userId }).sort({ generatedAt: -1 });
  const calorieGoal = activePlan?.calorieTarget || 2000;

  if (mealLogs.length === 0) {
    return {
      compliance: 0,
      avgKcal: 0,
      perfectDays: 0,
      loggedDaysCount: 0
    };
  }

  const dailyCalories = {};
  mealLogs.forEach(log => {
    const dateStr = getLocalDateString(log.date);
    dailyCalories[dateStr] = (dailyCalories[dateStr] || 0) + (log.calories || 0);
  });

  const loggedDays = Object.keys(dailyCalories);
  const totalCals = Object.values(dailyCalories).reduce((sum, val) => sum + val, 0);
  const avgKcal = Math.round(totalCals / loggedDays.length);

  let perfectDays = 0;
  let compliantDays = 0;
  loggedDays.forEach(dateStr => {
    const cals = dailyCalories[dateStr];
    if (cals >= calorieGoal * 0.9 && cals <= calorieGoal * 1.1) {
      perfectDays++;
    }
    if (cals <= calorieGoal * 1.1) {
      compliantDays++;
    }
  });

  const compliance = Math.round((compliantDays / loggedDays.length) * 100);

  return {
    compliance,
    avgKcal,
    perfectDays,
    loggedDaysCount: loggedDays.length
  };
}

module.exports = {
  getLocalDateString,
  calculateDailyTotals,
  calculateWorkoutsBurned,
  calculateStreak,
  calculateWeeklyTrends,
  calculateMonthlySummary
};
