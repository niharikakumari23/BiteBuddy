import React from 'react';
import { Target, Flame, Dumbbell, Droplets, Trophy, Activity, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { MacroRing } from '../components/charts/MacroRing';
import { WeeklyChart } from '../components/charts/WeeklyChart';
import { DAYS } from '../data/constants';
import './Nutrition.css';

export const Nutrition = ({ profile, activePlan, plan, allMeals = [], analyticsData }) => {
  const calorieGoal = activePlan?.calorieTarget || 2000;
  const macroGoals = activePlan?.macroTargets || { protein: 150, carbs: 200, fat: 65 };

  // Fetch totals from backend computed analytics
  const todayTotals = analyticsData?.todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const dailyCals = todayTotals.calories || 0;
  const dailyProtein = todayTotals.protein || 0;
  const dailyCarbs = todayTotals.carbs || 0;
  const dailyFat = todayTotals.fat || 0;

  // Streaks
  const mealStreak = analyticsData?.streaks?.meals || 0;

  // Monthly stats
  const compliance = analyticsData?.monthlySummary?.compliance || 0;
  const avgKcal = analyticsData?.monthlySummary?.avgKcal || 0;
  const perfectDays = analyticsData?.monthlySummary?.perfectDays || 0;

  // Weekly trend charts mapping from real database logs
  const weeklyProtein = (analyticsData?.weeklyTrends || []).map(t => ({
    day: t.day,
    value: t.protein || 0,
    target: t.targets?.protein || macroGoals.protein
  }));

  const weeklyCarbs = (analyticsData?.weeklyTrends || []).map(t => ({
    day: t.day,
    value: t.carbs || 0,
    target: t.targets?.carbs || macroGoals.carbs
  }));

  const weeklyFat = (analyticsData?.weeklyTrends || []).map(t => ({
    day: t.day,
    value: t.fat || 0,
    target: t.targets?.fat || macroGoals.fat
  }));

  const hasTrendsData = weeklyProtein.some(p => p.value > 0) || 
                         weeklyCarbs.some(c => c.value > 0) || 
                         weeklyFat.some(f => f.value > 0);

  const getMonthName = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Nutrition & Macros</h1>
        <p className="page-subtitle">Track your daily intake and analyze long-term trends.</p>
      </div>

      <div className="nutrition-grid">
        {/* Daily Summary */}
        <Card className="nutrition-daily-card">
          <div className="card-header-flex">
            <h3 className="card-title">Today's Macros</h3>
            <span className="text-muted text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="macro-rings-container">
            <MacroRing 
              calories={{ current: dailyCals, target: calorieGoal }}
              protein={{ current: Math.round(dailyProtein), target: macroGoals.protein }}
              carbs={{ current: Math.round(dailyCarbs), target: macroGoals.carbs }}
              fat={{ current: Math.round(dailyFat), target: macroGoals.fat }}
              size={240}
            />
            
            <div className="macro-legend">
              <div className="macro-legend-item">
                <div className="macro-legend-dot" style={{ backgroundColor: 'var(--color-calories)' }}></div>
                <div className="macro-legend-info">
                  <span className="macro-legend-label">Calories</span>
                  <span className="macro-legend-value">{dailyCals} / {calorieGoal} kcal</span>
                </div>
              </div>
              <div className="macro-legend-item">
                <div className="macro-legend-dot" style={{ backgroundColor: 'var(--color-protein)' }}></div>
                <div className="macro-legend-info">
                  <span className="macro-legend-label">Protein</span>
                  <span className="macro-legend-value">{Math.round(dailyProtein)} / {macroGoals.protein}g</span>
                </div>
              </div>
              <div className="macro-legend-item">
                <div className="macro-legend-dot" style={{ backgroundColor: 'var(--color-carbs)' }}></div>
                <div className="macro-legend-info">
                  <span className="macro-legend-label">Carbs</span>
                  <span className="macro-legend-value">{Math.round(dailyCarbs)} / {macroGoals.carbs}g</span>
                </div>
              </div>
              <div className="macro-legend-item">
                <div className="macro-legend-dot" style={{ backgroundColor: 'var(--color-fat)' }}></div>
                <div className="macro-legend-info">
                  <span className="macro-legend-label">Fat</span>
                  <span className="macro-legend-value">{Math.round(dailyFat)} / {macroGoals.fat}g</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="nutrition-side-grid">
          {/* Streaks */}
          <Card className="streak-card">
            <div className="streak-icon-box">
              <Flame size={32} color={mealStreak > 0 ? "var(--warning)" : "var(--muted)"} />
            </div>
            <div className="streak-info">
              <h3 className="streak-title">{mealStreak > 0 ? `${mealStreak} Day Streak!` : "0 Day Streak"}</h3>
              <p className="streak-desc">
                {mealStreak > 0 
                  ? `You've logged your meals for ${mealStreak} consecutive days.` 
                  : "Start logging your meals daily to build a healthy streak!"}
              </p>
            </div>
          </Card>

          {/* Monthly Summary */}
          <Card className="summary-card">
            <h3 className="card-title">{getMonthName()} Summary</h3>
            <div className="summary-stats">
              <div className="summary-stat-item">
                <Activity size={20} color="var(--primary)" />
                <div className="summary-stat-info">
                  <span className="summary-stat-value">{compliance}%</span>
                  <span className="summary-stat-label">Goal Compliance</span>
                </div>
              </div>
              <div className="summary-stat-item">
                <Calendar size={20} color="var(--info)" />
                <div className="summary-stat-info">
                  <span className="summary-stat-value">{avgKcal} kcal</span>
                  <span className="summary-stat-label">Avg Kcal / Day</span>
                </div>
              </div>
              <div className="summary-stat-item">
                <Trophy size={20} color="var(--warning)" />
                <div className="summary-stat-info">
                  <span className="summary-stat-value">{perfectDays}</span>
                  <span className="summary-stat-label">Perfect Days</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Weekly Trends */}
      <h2 className="section-title">Weekly Trends</h2>
      {hasTrendsData ? (
        <div className="trends-grid">
          <Card className="trend-card">
            <div className="trend-header">
              <div className="trend-title-box">
                <Dumbbell size={18} color="var(--color-protein)" />
                <span className="trend-title">Protein</span>
              </div>
              <span className="trend-avg">Avg: {Math.round(weeklyProtein.reduce((sum, d) => sum + d.value, 0) / 7)}g</span>
            </div>
            <WeeklyChart data={weeklyProtein} height={120} />
          </Card>

          <Card className="trend-card">
            <div className="trend-header">
              <div className="trend-title-box">
                <Droplets size={18} color="var(--color-carbs)" />
                <span className="trend-title">Carbs</span>
              </div>
              <span className="trend-avg">Avg: {Math.round(weeklyCarbs.reduce((sum, d) => sum + d.value, 0) / 7)}g</span>
            </div>
            <WeeklyChart data={weeklyCarbs} height={120} />
          </Card>

          <Card className="trend-card">
            <div className="trend-header">
              <div className="trend-title-box">
                <Target size={18} color="var(--color-fat)" />
                <span className="trend-title">Fat</span>
              </div>
              <span className="trend-avg">Avg: {Math.round(weeklyFat.reduce((sum, d) => sum + d.value, 0) / 7)}g</span>
            </div>
            <WeeklyChart data={weeklyFat} height={120} />
          </Card>
        </div>
      ) : (
        <Card className="trends-empty-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
          <Activity size={40} color="var(--muted-foreground)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>No Macro Data Available</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
            No meal logs recorded for this week. Once you log your breakfast, lunch, or dinner, your calorie and macronutrient trend charts will populate here!
          </p>
        </Card>
      )}
    </div>
  );
};
