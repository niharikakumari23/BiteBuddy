import React, { useState, useEffect } from 'react';
import { Flame, Dumbbell, Droplets, Target, Utensils, Camera, Calendar, Sparkles, Plus, Minus, GlassWater, ArrowRight, Activity, Clipboard, Leaf } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { WeeklyChart } from '../components/charts/WeeklyChart';
import { DAYS } from '../data/constants';
import './Dashboard.css';

export const Dashboard = ({ 
  profile, 
  activePlan, 
  plan, 
  navigateTo, 
  API_BASE, 
  token, 
  logs = [], 
  setLogs, 
  openQuickFoodEntry,
  workoutLogs = [],
  analyticsData,
  refreshData
}) => {
  const [waterGlasses, setWaterGlasses] = useState(0); 
  
  // Fetch water log from database for today on mount
  useEffect(() => {
    const fetchWater = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const res = await fetch(`${API_BASE}/waterlog?date=${todayStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWaterGlasses(data.glasses || 0);
        }
      } catch (err) {
        console.error("Failed to load water log:", err);
      }
    };
    if (token) {
      fetchWater();
    }
  }, [token, API_BASE]);

  // Persist updated water log to database
  const updateWater = async (val) => {
    const newGlasses = Math.max(0, val);
    setWaterGlasses(newGlasses);
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      await fetch(`${API_BASE}/waterlog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: todayStr, glasses: newGlasses })
      });
      if (refreshData) {
        refreshData();
      }
    } catch (err) {
      console.error("Failed to save water log:", err);
    }
  };

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  
  const calorieGoal = activePlan?.calorieTarget || 2000;
  const macroGoals = activePlan?.macroTargets || { protein: 150, carbs: 200, fat: 65 };
  const fiberGoal = 30;
  // Since profile.waterGoal is in Liters (e.g. 2.5), convert to glasses (1 glass = 250ml)
  const waterGoal = Math.round((parseFloat(profile?.waterGoal) || 2.0) * 4);
  
  // Calculate consumed from today's real meal logs
  const consumed = logs.reduce((acc, log) => {
    acc.cals += (log.calories || 0);
    acc.pro += (log.protein || 0);
    acc.carbs += (log.carbs || 0);
    acc.fat += (log.fats || log.fat || 0);
    acc.fiber += (log.fiber || 0);
    return acc;
  }, { cals: 0, pro: 0, carbs: 0, fat: 0, fiber: 0 });

  // Calculate today's real workouts burned
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayWorkouts = (workoutLogs || []).filter(w => new Date(w.date).toLocaleDateString('en-CA') === todayStr);
  const burned = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  // Net Calories = Consumed - Burned
  const netCalories = Math.max(0, consumed.cals - burned);
  
  // Weekly trend chart data populated from DB analytics
  const weeklyData = (analyticsData?.weeklyTrends || []).map(t => ({
    day: t.day,
    value: t.calories || 0,
    target: t.targets?.calories || calorieGoal
  }));

  const hasWeeklyData = weeklyData.some(d => d.value > 0);

  const getProgressState = (current, target, defaultColor) => {
    if (current > target) {
      return { pct: 100, color: 'var(--destructive)', label: `+${Math.round(current - target)} over` };
    }
    return { pct: (current / target) * 100, color: defaultColor, label: `${Math.round(target - current)} left` };
  };

  const calState = getProgressState(netCalories, calorieGoal, 'var(--color-calories)');
  const proState = getProgressState(consumed.pro, macroGoals.protein, 'var(--color-protein)');
  const carbState = getProgressState(consumed.carbs, macroGoals.carbs, 'var(--color-carbs)');
  const fatState = getProgressState(consumed.fat, macroGoals.fat, 'var(--color-fat)');
  const fibState = getProgressState(consumed.fiber, fiberGoal, '#10b981');

  // Smart alerts based on live totals
  const getSmartWarning = (current, target, name, unit) => {
    const diff = current - target;
    if (diff > 0) {
      return {
        text: `⚠ ${name} exceeded by ${Math.round(diff)}${unit}.`,
        isExceeded: true
      };
    }
    return {
      text: `${Math.round(target - current)}${unit} ${name.toLowerCase()} remaining`,
      isExceeded: false
    };
  };

  const smartWarnings = [
    getSmartWarning(netCalories, calorieGoal, 'Calories', ' kcal'),
    getSmartWarning(consumed.pro, macroGoals.protein, 'Protein', 'g'),
    getSmartWarning(consumed.carbs, macroGoals.carbs, 'Carbs', 'g'),
    getSmartWarning(consumed.fat, macroGoals.fat, 'Fat', 'g'),
    getSmartWarning(consumed.fiber, fiberGoal, 'Fiber', 'g'),
    getSmartWarning(waterGlasses, waterGoal, 'Water', ' glasses')
  ];

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title animate-zoom-out-right">
            Eat Better, <br />
            <span style={{ color: 'var(--primary)' }}>Plan Smarter!</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up">
            Welcome back, {profile?.name || 'User'}. {activePlan ? 'Your personalized weekly meal plan is ready.' : 'Time to generate your personalized meal plan.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="animate-fade-in-up">
            <Button size="lg" className="hero-cta" onClick={() => navigateTo('settings')}>
              {activePlan ? 'View Plan Settings' : 'Generate AI Plan'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </Button>
            <Button size="lg" variant="secondary" onClick={openQuickFoodEntry}>
              <Sparkles size={18} style={{ marginRight: 8 }} /> Quick Food Entry
            </Button>
          </div>
        </div>
        <div className="hero-image-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg viewBox="0 0 200 200" className="hero-svg-graphic" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--info)" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--info)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Pulsing background circle */}
            <circle cx="100" cy="100" r="75" fill="url(#glowGrad)" className="svg-pulse-circle" />
            
            {/* Spinning dotted track */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="5,8" className="svg-spin-circle" />
            
            {/* Glowing active ring */}
            <circle cx="100" cy="100" r="50" fill="none" stroke="url(#circleGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="220, 314" className="svg-ring-active" />
            
            {/* Center leaf detail */}
            <g transform="translate(100, 100) scale(0.9)" className="svg-center-icon">
              <path d="M-12,0 C-12,-15 12,-15 12,0 C12,12 0,22 0,22 C0,22 -12,12 -12,0 Z" fill="var(--primary)" opacity="0.85" />
              <path d="M-6,-2 C-2,-6 2,-6 6,-2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
            
            {/* Floating nutrition sparkles */}
            <circle cx="50" cy="60" r="5" fill="var(--color-calories)" className="svg-float-dot-1" />
            <circle cx="150" cy="70" r="6" fill="var(--color-protein)" className="svg-float-dot-2" />
            <circle cx="145" cy="145" r="5" fill="var(--color-carbs)" className="svg-float-dot-3" />
            <circle cx="55" cy="140" r="7" fill="var(--color-water)" className="svg-float-dot-4" />
          </svg>
        </div>
      </div>

      {/* Smart Warnings Feed */}
      <Card className="smart-warnings-card animate-fade-in-up" style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Activity size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Daily Goals & Coaching Alerts</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {smartWarnings.map((warning, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: warning.isExceeded ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${warning.isExceeded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
              borderRadius: '8px',
              color: warning.isExceeded ? '#f87171' : '#34d399',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: warning.isExceeded ? '#ef4444' : '#10b981'
              }} />
              <span>{warning.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="bento-grid">
        {/* Macros - Left Column */}
        <div className="bento-macros animate-staggered" style={{ animationDelay: '0.1s' }}>
          <Card className="bento-stat cal-card">
            <div className="bento-stat-header">
              <div className="stat-card-icon-wrapper cal-icon"><Flame size={20} /></div>
              <div className="stat-card-info">
                <span className="stat-card-label">Calories (Net)</span>
                <span className="stat-card-value" style={{color: netCalories > calorieGoal ? 'var(--destructive)' : ''}}>
                  {netCalories} <span className="stat-card-unit">/ {calorieGoal} kcal</span>
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                  <span>Consumed: <strong>{consumed.cals}</strong></span>
                  <span>•</span>
                  <span>Burned: <strong>{burned}</strong></span>
                </div>
              </div>
            </div>
            <ProgressBar progress={calState.pct} color={calState.color} />
          </Card>
          <Card className="bento-stat pro-card">
            <div className="bento-stat-header">
              <div className="stat-card-icon-wrapper pro-icon"><Dumbbell size={20} /></div>
              <div className="stat-card-info">
                <span className="stat-card-label">Protein</span>
                <span className="stat-card-value" style={{color: consumed.pro > macroGoals.protein ? 'var(--destructive)' : ''}}>
                  {Math.round(consumed.pro)} <span className="stat-card-unit">/ {macroGoals.protein}g ({proState.label})</span>
                </span>
              </div>
            </div>
            <ProgressBar progress={proState.pct} color={proState.color} />
          </Card>
          <Card className="bento-stat carb-card">
            <div className="bento-stat-header">
              <div className="stat-card-icon-wrapper carb-icon"><Droplets size={20} /></div>
              <div className="stat-card-info">
                <span className="stat-card-label">Carbs</span>
                <span className="stat-card-value" style={{color: consumed.carbs > macroGoals.carbs ? 'var(--destructive)' : ''}}>
                  {Math.round(consumed.carbs)} <span className="stat-card-unit">/ {macroGoals.carbs}g ({carbState.label})</span>
                </span>
              </div>
            </div>
            <ProgressBar progress={carbState.pct} color={carbState.color} />
          </Card>
          <Card className="bento-stat fat-card">
            <div className="bento-stat-header">
              <div className="stat-card-icon-wrapper fat-icon"><Target size={20} /></div>
              <div className="stat-card-info">
                <span className="stat-card-label">Fat</span>
                <span className="stat-card-value" style={{color: consumed.fat > macroGoals.fat ? 'var(--destructive)' : ''}}>
                  {Math.round(consumed.fat)} <span className="stat-card-unit">/ {macroGoals.fat}g ({fatState.label})</span>
                </span>
              </div>
            </div>
            <ProgressBar progress={fatState.pct} color={fatState.color} />
          </Card>
          <Card className="bento-stat fiber-card">
            <div className="bento-stat-header">
              <div className="stat-card-icon-wrapper fiber-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><Leaf size={20} /></div>
              <div className="stat-card-info">
                <span className="stat-card-label">Fiber</span>
                <span className="stat-card-value" style={{color: consumed.fiber > fiberGoal ? '#10b981' : ''}}>
                  {Math.round(consumed.fiber)} <span className="stat-card-unit">/ {fiberGoal}g ({fibState.label})</span>
                </span>
              </div>
            </div>
            <ProgressBar progress={fibState.pct} color={fibState.color} />
          </Card>
        </div>

        {/* Center - Recent Food Logs */}
        <Card className="bento-meals animate-staggered" style={{ animationDelay: '0.2s' }}>
          <div className="card-header-flex">
            <h3 className="card-title">Recent Food Logs</h3>
            <Button variant="ghost" size="sm" onClick={() => navigateTo('foodlog')}>View All</Button>
          </div>
          <div className="bento-meals-list">
            {logs.length > 0 ? (
              logs.slice(0, 3).map((log) => (
                <div key={log._id} className="bento-meal-item">
                  <div className="bento-meal-img">
                    {log.imageUrl ? <img src={log.imageUrl} alt={log.foodName} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : <Clipboard size={20} />}
                  </div>
                  <div className="bento-meal-details">
                    <span className="bento-meal-type">{log.mealType || 'Snacks'}</span>
                    <span className="bento-meal-name">{log.foodName}</span>
                  </div>
                  <div className="bento-meal-kcal">{log.calories} kcal</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <Clipboard size={32} color="var(--muted-foreground)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No meals logged today.</p>
                <Button size="sm" style={{ marginTop: '1rem' }} onClick={() => navigateTo('scanner')}>Log a Meal</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Right - AI Insight & Water */}
        <div className="bento-right animate-staggered" style={{ animationDelay: '0.3s' }}>
          <Card className="bento-insight">
            <div className="insight-header">
              <Sparkles size={20} color="#000" />
              <h3 className="card-title" style={{color: '#000'}}>AI Insight</h3>
            </div>
            <p className="insight-text">
              {activePlan?.advice?.nutrition || "I'm ready to generate your personalized nutrition and recovery insights once you create a plan!"}
            </p>
          </Card>

          <Card className="bento-water">
            <h3 className="card-title">Hydration</h3>
            <div className="water-tracker">
              <div className="water-glass-display">
                <GlassWater size={32} color="var(--color-water)" />
                <div className="water-count">{waterGlasses} <span className="water-unit">/ {waterGoal} glasses</span></div>
              </div>
              <div className="water-controls">
                <button className="water-btn" onClick={() => updateWater(waterGlasses - 1)}><Minus size={16} /></button>
                <button className="water-btn primary" onClick={() => updateWater(waterGlasses + 1)}><Plus size={16} /></button>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Left - Quick Actions */}
        <Card className="bento-actions animate-staggered" style={{ animationDelay: '0.4s' }}>
          <h3 className="card-title">Quick Actions</h3>
          <div className="bento-actions-grid">
            <button className="bento-action-btn" onClick={openQuickFoodEntry}>
              <div className="action-icon-circle" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)'}}><Sparkles size={20} /></div>
              <span>Quick Food Entry</span>
            </button>
            <button className="bento-action-btn" onClick={() => navigateTo('scanner')}>
              <div className="action-icon-circle"><Camera size={20} /></div>
              <span>Scan Meal</span>
            </button>
            <button className="bento-action-btn" onClick={() => navigateTo('workouts')}>
              <div className="action-icon-circle" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}><Activity size={20} /></div>
              <span>Log Workout</span>
            </button>
          </div>
        </Card>

        {/* Bottom Right - Weekly Trend */}
        {hasWeeklyData ? (
          <Card className="bento-chart animate-staggered" style={{ animationDelay: '0.5s' }}>
            <div className="card-header-flex">
              <h3 className="card-title">Weekly Trend</h3>
            </div>
            <WeeklyChart data={weeklyData} height={180} />
          </Card>
        ) : (
          <Card className="bento-chart animate-staggered" style={{ animationDelay: '0.5s', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
            <div className="card-header-flex" style={{ alignSelf: 'flex-start', width: '100%' }}>
              <h3 className="card-title">Weekly Trend</h3>
            </div>
            <Activity size={32} color="var(--muted-foreground)" style={{ margin: '20px 0 10px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No meal log data this week yet.</p>
          </Card>
        )}

      </div>
    </div>
  );
};
