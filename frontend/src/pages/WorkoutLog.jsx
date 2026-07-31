import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Plus, Clock, Flame, Dumbbell, Play, Trash2, Copy, Edit3, 
  Check, RotateCcw, BarChart2, Calendar, Sparkles, Award, HelpCircle 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import './WorkoutLog.css';

// Pre-defined template split choices
const TEMPLATE_CHOICES = [
  {
    name: "Push Day (Chest, Shoulders, Triceps)",
    exercises: [
      { name: "Flat Bench Press", muscleGroup: "Chest", sets: [{ setIndex: 1, reps: 10, weight: 60, restTime: 90 }, { setIndex: 2, reps: 8, weight: 70, restTime: 90 }] },
      { name: "Overhead Barbell Press", muscleGroup: "Shoulders", sets: [{ setIndex: 1, reps: 10, weight: 40, restTime: 90 }, { setIndex: 2, reps: 8, weight: 45, restTime: 90 }] },
      { name: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", sets: [{ setIndex: 1, reps: 12, weight: 10, restTime: 60 }, { setIndex: 2, reps: 12, weight: 10, restTime: 60 }] },
      { name: "Tricep Rope Pushdowns", muscleGroup: "Triceps", sets: [{ setIndex: 1, reps: 12, weight: 20, restTime: 60 }, { setIndex: 2, reps: 10, weight: 25, restTime: 60 }] }
    ]
  },
  {
    name: "Pull Day (Back, Biceps)",
    exercises: [
      { name: "Barbell Deadlifts", muscleGroup: "Back", sets: [{ setIndex: 1, reps: 8, weight: 100, restTime: 120 }, { setIndex: 2, reps: 6, weight: 120, restTime: 120 }] },
      { name: "Wide-Grip Lat Pulldowns", muscleGroup: "Back", sets: [{ setIndex: 1, reps: 10, weight: 55, restTime: 90 }, { setIndex: 2, reps: 10, weight: 60, restTime: 90 }] },
      { name: "Dumbbell Hammer Curls", muscleGroup: "Biceps", sets: [{ setIndex: 1, reps: 12, weight: 14, restTime: 60 }, { setIndex: 2, reps: 10, weight: 16, restTime: 60 }] }
    ]
  },
  {
    name: "Leg Day (Quads, Hamstrings, Calves)",
    exercises: [
      { name: "Barbell Squats", muscleGroup: "Legs", sets: [{ setIndex: 1, reps: 10, weight: 80, restTime: 120 }, { setIndex: 2, reps: 8, weight: 90, restTime: 120 }] },
      { name: "Romanian Deadlifts", muscleGroup: "Legs", sets: [{ setIndex: 1, reps: 10, weight: 70, restTime: 90 }, { setIndex: 2, reps: 10, weight: 75, restTime: 90 }] },
      { name: "Standing Calf Raises", muscleGroup: "Legs", sets: [{ setIndex: 1, reps: 15, weight: 40, restTime: 60 }] }
    ]
  }
];

export const WorkoutLog = ({ API_BASE, token, setActivePlan, setShoppingItems, workoutLogs, setWorkoutLogs, refreshData }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'active', 'history', 'analytics'
  const logs = workoutLogs || [];
  const setLogs = setWorkoutLogs;
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active workout session states (persisted in localStorage)
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const timerRef = useRef(null);

  // Template creation & modification modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', notes: '', exercises: [] });
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // Exercise database options for selection
  const EXERCISE_OPTIONS = [
    { name: "Bench Press", muscle: "Chest" },
    { name: "Incline Bench Press", muscle: "Chest" },
    { name: "Dumbbell Flyes", muscle: "Chest" },
    { name: "Deadlifts", muscle: "Back" },
    { name: "Barbell Rows", muscle: "Back" },
    { name: "Lat Pulldown", muscle: "Back" },
    { name: "Barbell Squats", muscle: "Legs" },
    { name: "Leg Extensions", muscle: "Legs" },
    { name: "Romanian Deadlifts", muscle: "Legs" },
    { name: "Overhead Press", muscle: "Shoulders" },
    { name: "Lateral Raises", muscle: "Shoulders" },
    { name: "Bicep Curls", muscle: "Biceps" },
    { name: "Hammer Curls", muscle: "Biceps" },
    { name: "Tricep Pushdowns", muscle: "Triceps" },
    { name: "HIIT Cardio", muscle: "Cardio" },
    { name: "Running", muscle: "Cardio" }
  ];

  // Fetch workout logs & templates
  const fetchData = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };
      
      const logsRes = await fetch(`${API_BASE}/workouts`, { headers: authHeader });
      const logsData = await logsRes.json();
      setLogs(logsData);

      const tempRes = await fetch(`${API_BASE}/workouts/templates`, { headers: authHeader });
      const tempData = await tempRes.json();
      setTemplates(tempData);
    } catch (e) {
      addToast('Error', 'Could not sync workout details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle active session timer
  useEffect(() => {
    // Read persisted session from localstorage
    const stored = localStorage.getItem('bitebuddy_active_workout');
    if (stored) {
      const parsed = JSON.parse(stored);
      setActiveSession(parsed);
      const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
      setSessionTime(elapsed > 0 ? elapsed : 0);
      setActiveTab('active');
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - activeSession.startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  // Persist session change helper
  const updateSession = (newSession) => {
    setActiveSession(newSession);
    if (newSession) {
      localStorage.setItem('bitebuddy_active_workout', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('bitebuddy_active_workout');
    }
  };

  // Format timer seconds into MM:SS or HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // ACTIVE WORKOUT INTERACTIONS
  // ==========================================

  const startCustomWorkout = () => {
    const session = {
      name: "Custom Workout",
      startTime: Date.now(),
      exercises: [],
      notes: ''
    };
    updateSession(session);
    setActiveTab('active');
    addToast('Workout Started! 🏋️‍♂️', 'Add exercises and sets below.', 'success');
  };

  const startTemplateWorkout = (template) => {
    // Clone template exercises structure
    const clonedExercises = template.exercises.map(ex => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup || 'Other',
      sets: ex.sets.map(s => ({
        setIndex: s.setIndex,
        reps: s.reps || 10,
        weight: s.weight || 0,
        restTime: s.restTime || 60,
        isCompleted: false
      })),
      notes: ex.notes || ''
    }));

    const session = {
      name: template.name,
      templateId: template._id,
      startTime: Date.now(),
      exercises: clonedExercises,
      notes: template.notes || ''
    };
    updateSession(session);
    setActiveTab('active');
    addToast('Session Loaded!', `Ready to log ${template.name}`, 'success');
  };

  const addExerciseToActive = (exChoice) => {
    if (!activeSession) return;
    const newEx = {
      name: exChoice.name,
      muscleGroup: exChoice.muscle,
      sets: [{ setIndex: 1, reps: 10, weight: 0, restTime: 60, isCompleted: false }],
      notes: ''
    };
    const updated = {
      ...activeSession,
      exercises: [...activeSession.exercises, newEx]
    };
    updateSession(updated);
  };

  const removeExerciseFromActive = (exIdx) => {
    const updatedExs = [...activeSession.exercises];
    updatedExs.splice(exIdx, 1);
    updateSession({ ...activeSession, exercises: updatedExs });
  };

  const addSetToActive = (exIdx) => {
    const updatedExs = [...activeSession.exercises];
    const sets = updatedExs[exIdx].sets;
    const lastSet = sets[sets.length - 1];
    const newSet = {
      setIndex: sets.length + 1,
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      restTime: lastSet ? lastSet.restTime : 60,
      isCompleted: false
    };
    updatedExs[exIdx].sets = [...sets, newSet];
    updateSession({ ...activeSession, exercises: updatedExs });
  };

  const removeSetFromActive = (exIdx, setIdx) => {
    const updatedExs = [...activeSession.exercises];
    updatedExs[exIdx].sets.splice(setIdx, 1);
    // Reindex remaining sets
    updatedExs[exIdx].sets = updatedExs[exIdx].sets.map((s, i) => ({ ...s, setIndex: i + 1 }));
    updateSession({ ...activeSession, exercises: updatedExs });
  };

  const handleActiveSetChange = (exIdx, setIdx, field, value) => {
    const updatedExs = [...activeSession.exercises];
    updatedExs[exIdx].sets[setIdx][field] = value;
    updateSession({ ...activeSession, exercises: updatedExs });
  };

  const toggleSetCompletion = (exIdx, setIdx) => {
    const updatedExs = [...activeSession.exercises];
    const state = updatedExs[exIdx].sets[setIdx].isCompleted;
    updatedExs[exIdx].sets[setIdx].isCompleted = !state;
    updateSession({ ...activeSession, exercises: updatedExs });
  };

  const finishWorkout = async () => {
    if (!activeSession || activeSession.exercises.length === 0) {
      addToast('Cannot Complete', 'You must add at least one exercise to save.', 'warning');
      return;
    }

    try {
      const minutes = Math.ceil(sessionTime / 60);
      // Rough estimation of calories burned: 7.5 kcal per completed set + 3 kcal per minute
      const completedSetsCount = activeSession.exercises.reduce((sum, ex) => 
        sum + ex.sets.filter(s => s.isCompleted).length, 0
      );
      const estCals = (completedSetsCount * 8) + (minutes * 3.5);

      const payload = {
        type: activeSession.name,
        duration: minutes,
        caloriesBurned: Math.round(estCals),
        exercises: activeSession.exercises,
        notes: activeSession.notes,
        templateId: activeSession.templateId
      };

      const res = await fetch(`${API_BASE}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to log workout session');
      
      const data = await res.json();
      
      // Update local states & macro plan
      if (data.mealPlan) {
        setActivePlan(data.mealPlan);
        if (setShoppingItems && data.mealPlan.shoppingList) {
          setShoppingItems(data.mealPlan.shoppingList);
        }
      }

      addToast('Workout Completed! 🎉', `Logged ${minutes} mins workout. Target nutrition adjusted!`, 'success');
      updateSession(null);
      setActiveTab('history');
      fetchData();
      if (refreshData) {
        refreshData();
      }
    } catch (e) {
      addToast('Error saving workout', e.message, 'error');
    }
  };

  const deleteWorkoutLog = async (logId) => {
    if (!window.confirm('Delete this completed workout from your history?')) return;
    try {
      const res = await fetch(`${API_BASE}/workouts/${logId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete history item');
      
      const data = await res.json();
      if (data.mealPlan) {
        setActivePlan(data.mealPlan);
      }
      addToast('Workout Deleted', 'Log removed from history.', 'success');
      fetchData();
      if (refreshData) {
        refreshData();
      }
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  // ==========================================
  // REUSABLE WORKOUT TEMPLATES INTERACTIONS
  // ==========================================

  const createDefaultTemplate = async (choice) => {
    try {
      const res = await fetch(`${API_BASE}/workouts/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: choice.name,
          exercises: choice.exercises
        })
      });
      if (!res.ok) throw new Error('Could not create default split');
      addToast('Template Loaded', `${choice.name} added to templates hub.`, 'success');
      fetchData();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const duplicateTemplate = async (templateId) => {
    try {
      const res = await fetch(`${API_BASE}/workouts/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to duplicate template');
      addToast('Template Duplicated', 'Created reusable copy.', 'success');
      fetchData();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template permanently?')) return;
    try {
      const res = await fetch(`${API_BASE}/workouts/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete template');
      addToast('Template Deleted', 'Removed from templates hub.', 'success');
      fetchData();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  // ==========================================
  // TEMPLATE EDIT MODAL FORM HELPERS
  // ==========================================

  const openNewTemplateModal = () => {
    setEditingTemplateId(null);
    setTemplateForm({ name: '', notes: '', exercises: [] });
    setIsTemplateModalOpen(true);
  };

  const openEditTemplateModal = (template) => {
    setEditingTemplateId(template._id);
    setTemplateForm({
      name: template.name,
      notes: template.notes || '',
      exercises: template.exercises.map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets.map(s => ({ setIndex: s.setIndex, reps: s.reps, weight: s.weight, restTime: s.restTime }))
      }))
    });
    setIsTemplateModalOpen(true);
  };

  const addExerciseToTemplateForm = (exChoice) => {
    setTemplateForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        name: exChoice.name,
        muscleGroup: exChoice.muscle,
        sets: [{ setIndex: 1, reps: 10, weight: 0, restTime: 60 }]
      }]
    }));
  };

  const removeExerciseFromTemplateForm = (idx) => {
    setTemplateForm(prev => {
      const clone = [...prev.exercises];
      clone.splice(idx, 1);
      return { ...prev, exercises: clone };
    });
  };

  const addSetToTemplateForm = (exIdx) => {
    setTemplateForm(prev => {
      const clone = [...prev.exercises];
      const sets = clone[exIdx].sets;
      const lastSet = sets[sets.length - 1];
      clone[exIdx].sets = [...sets, {
        setIndex: sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 0,
        restTime: lastSet ? lastSet.restTime : 60
      }];
      return { ...prev, exercises: clone };
    });
  };

  const removeSetFromTemplateForm = (exIdx, setIdx) => {
    setTemplateForm(prev => {
      const clone = [...prev.exercises];
      clone[exIdx].sets.splice(setIdx, 1);
      clone[exIdx].sets = clone[exIdx].sets.map((s, i) => ({ ...s, setIndex: i + 1 }));
      return { ...prev, exercises: clone };
    });
  };

  const handleTemplateSetChange = (exIdx, setIdx, field, val) => {
    setTemplateForm(prev => {
      const clone = [...prev.exercises];
      clone[exIdx].sets[setIdx][field] = val;
      return { ...prev, exercises: clone };
    });
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) {
      addToast('Name Required', 'Please enter a template name.', 'warning');
      return;
    }
    if (templateForm.exercises.length === 0) {
      addToast('Exercises Required', 'Please add at least one exercise.', 'warning');
      return;
    }

    try {
      const url = editingTemplateId 
        ? `${API_BASE}/workouts/templates/${editingTemplateId}`
        : `${API_BASE}/workouts/templates`;
      
      const method = editingTemplateId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateForm)
      });

      if (!res.ok) throw new Error('Failed to save template');

      addToast('Template Saved', 'Successfully added to hub.', 'success');
      setIsTemplateModalOpen(false);
      fetchData();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  // ==========================================
  // ANALYTICS CALCULATIONS
  // ==========================================

  const getAnalytics = () => {
    const totalWorkouts = logs.length;
    const weeklyFreq = totalWorkouts > 0 ? (totalWorkouts / 4).toFixed(1) : 0; // rough freq over last month
    
    // Total volume of last 7 workouts
    const totalVolume = logs.reduce((sum, w) => sum + (w.trainingVolume || 0), 0);
    const caloriesBurned = logs.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    // Calculate streaks
    let streak = 0;
    const dates = logs.map(l => new Date(l.date).toDateString());
    const uniqueDates = [...new Set(dates)].map(d => new Date(d));
    uniqueDates.sort((a, b) => b - a); // descending

    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0,0,0,0);

      const latestWorkoutDate = uniqueDates[0];
      latestWorkoutDate.setHours(0,0,0,0);

      // If last workout was today or yesterday, streak is active
      if (latestWorkoutDate.getTime() === today.getTime() || latestWorkoutDate.getTime() === yesterday.getTime()) {
        streak = 1;
        let lastDate = latestWorkoutDate;
        for (let i = 1; i < uniqueDates.length; i++) {
          const checkDate = uniqueDates[i];
          checkDate.setHours(0,0,0,0);
          
          const diffDays = Math.floor((lastDate - checkDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
            lastDate = checkDate;
          } else {
            break;
          }
        }
      }
    }

    // Muscle groups trained frequencies
    const musclesCount = {};
    logs.forEach(log => {
      if (log.primaryMuscleGroups) {
        log.primaryMuscleGroups.forEach(m => {
          musclesCount[m] = (musclesCount[m] || 0) + 1;
        });
      }
    });

    const musclesTrained = Object.entries(musclesCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Consistency score (0-100) based on training frequency
    const consistencyScore = Math.min(100, Math.round((totalWorkouts / 12) * 100)); // target 12 workouts per month

    return {
      streak,
      totalVolume,
      caloriesBurned,
      musclesTrained,
      weeklyFreq,
      consistencyScore
    };
  };

  const analytics = getAnalytics();

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Workout Tracker</h1>
          <p className="page-subtitle">Personalized fitness plans & dynamic macro synchronization.</p>
        </div>
        {!activeSession ? (
          <Button onClick={startCustomWorkout} style={{ background: 'var(--primary)', color: 'white' }}>
            <Play size={16} style={{ marginRight: 8 }} /> Start Empty Session
          </Button>
        ) : (
          <Button onClick={() => setActiveTab('active')} variant="outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Clock size={16} style={{ marginRight: 8 }} /> Workout In Progress ({formatTime(sessionTime)})
          </Button>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="workout-tabs">
        <button className={`workout-tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          <Play size={16} /> Routine Templates
        </button>
        {activeSession && (
          <button className={`workout-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            <Clock size={16} /> Log Active Session
          </button>
        )}
        <button className={`workout-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Calendar size={16} /> Completed Logs
        </button>
        <button className={`workout-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart2 size={16} /> Analytics & Volume
        </button>
      </div>

      {/* RENDER TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div>
          <div className="card-header-flex" style={{ marginBottom: '16px' }}>
            <h3 className="card-title">My Workout Templates</h3>
            <Button variant="ghost" size="sm" onClick={openNewTemplateModal}>
              <Plus size={16} style={{ marginRight: 6 }} /> Create Template
            </Button>
          </div>

          {templates.length > 0 ? (
            <div className="templates-grid">
              {templates.map(t => (
                <Card key={t._id} className="template-card">
                  <div className="template-header">
                    <span className="template-title">{t.name}</span>
                    <div className="template-actions">
                      <button className="template-btn" onClick={() => duplicateTemplate(t._id)} title="Duplicate"><Copy size={14} /></button>
                      <button className="template-btn" onClick={() => openEditTemplateModal(t)} title="Edit"><Edit3 size={14} /></button>
                      <button className="template-btn" onClick={() => deleteTemplate(t._id)} title="Delete"><Trash2 size={14} style={{ color: 'var(--destructive)' }} /></button>
                    </div>
                  </div>
                  <div className="template-exercises-list">
                    {t.exercises.map((ex, i) => (
                      <div key={i}>{ex.sets.length} sets × {ex.name}</div>
                    ))}
                  </div>
                  <div className="template-footer">
                    <span>Used {t.timesUsed} times</span>
                    <Button size="sm" onClick={() => startTemplateWorkout(t)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                      <Play size={12} style={{ marginRight: 4 }} /> Start
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: '32px' }}>
              <EmptyState 
                icon={Dumbbell} 
                title="No Custom Templates Yet" 
                description="Click the button to create a template, or choose from these starter split templates below:" 
              />
              
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '24px auto 0' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quick Starter Splits:</strong>
                {TEMPLATE_CHOICES.map((choice, i) => (
                  <Card key={i} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{choice.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{choice.exercises.length} exercises configured</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => createDefaultTemplate(choice)}>
                      Add to Hub
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER ACTIVE SESSION TAB */}
      {activeTab === 'active' && activeSession && (
        <Card className="active-workout-card" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <div className="active-workout-header">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{activeSession.name}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Log sets, reps, and RPE inside the checkboxes.</span>
            </div>
            <div className="active-timer">
              <Clock size={16} />
              {formatTime(sessionTime)}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Workout Notes</label>
            <Input 
              type="text" 
              placeholder="E.g. Feeling strong, increased bench press weight today!" 
              value={activeSession.notes} 
              onChange={e => updateSession({ ...activeSession, notes: e.target.value })}
            />
          </div>

          {activeSession.exercises.map((ex, exIdx) => (
            <Card key={exIdx} className="active-exercise-card">
              <div className="exercise-header">
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>{ex.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{ex.muscleGroup}</span>
                </div>
                <button 
                  onClick={() => removeExerciseFromActive(exIdx)}
                  style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <table className="sets-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Weight (kg)</th>
                    <th>Reps</th>
                    <th>Rest (sec)</th>
                    <th>RPE (1-10)</th>
                    <th>Done</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, setIdx) => (
                    <tr key={setIdx} className={`set-row ${set.isCompleted ? 'completed' : ''}`}>
                      <td>{set.setIndex}</td>
                      <td>
                        <input 
                          type="number" 
                          className="set-input" 
                          value={set.weight} 
                          onChange={e => handleActiveSetChange(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="set-input" 
                          value={set.reps} 
                          onChange={e => handleActiveSetChange(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="set-input" 
                          value={set.restTime} 
                          onChange={e => handleActiveSetChange(exIdx, setIdx, 'restTime', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="set-input" 
                          min="1" 
                          max="10" 
                          placeholder="RPE"
                          value={set.rpe || ''} 
                          onChange={e => handleActiveSetChange(exIdx, setIdx, 'rpe', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <button 
                          className={`checkbox-btn ${set.isCompleted ? 'completed' : ''}`}
                          onClick={() => toggleSetCompletion(exIdx, setIdx)}
                        >
                          <Check size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <Button size="sm" variant="secondary" onClick={() => addSetToActive(exIdx)}>+ Add Set</Button>
                {ex.sets.length > 1 && (
                  <Button size="sm" variant="outline-destructive" onClick={() => removeSetFromActive(exIdx, ex.sets.length - 1)}>- Remove Set</Button>
                )}
              </div>
            </Card>
          ))}

          {/* Add exercise selector */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Add Exercise</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EXERCISE_OPTIONS.map((choice, i) => (
                <button
                  key={i}
                  className="muscle-chip"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => addExerciseToActive(choice)}
                >
                  <Plus size={12} /> {choice.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => {
              if (window.confirm('Cancel this active session? Your logged data will be discarded.')) {
                updateSession(null);
                setActiveTab('templates');
              }
            }}>Discard</Button>
            
            <Button onClick={finishWorkout} style={{ background: 'var(--primary)', color: 'white' }}>
              Finish Workout
            </Button>
          </div>
        </Card>
      )}

      {/* RENDER HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Workout Logs & History</h3>
          
          {logs.length > 0 ? (
            <div className="logs-grid">
              {logs.map(log => (
                <Card key={log._id} className="log-card">
                  <div className="log-header">
                    <h4 style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>{log.type}</h4>
                    <span className="log-date">{new Date(log.date).toLocaleDateString()}</span>
                  </div>

                  <div className="log-stats" style={{ display: 'flex', gap: '16px', background: 'var(--surface-variant)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                    <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Duration</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{log.duration}m</span>
                    </div>
                    <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Burned</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--destructive)' }}><Flame size={12} style={{ display: 'inline', marginRight: 4 }} />{log.caloriesBurned} kcal</span>
                    </div>
                    <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Volume</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{log.trainingVolume || 0} kg</span>
                    </div>
                  </div>

                  <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {log.exercises.map((ex, i) => (
                      <div key={i} className="history-exercise-item">
                        <strong>{ex.name}</strong>: {ex.sets.length} sets ({ex.sets.map(s => `${s.weight}kg × ${s.reps}`).join(', ')})
                      </div>
                    ))}
                  </div>

                  {log.notes && <p className="log-notes" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Note: {log.notes}</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px' }}>
                    <Button variant="outline-destructive" size="sm" onClick={() => deleteWorkoutLog(log._id)}>
                      <Trash2 size={12} />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => startTemplateWorkout(log)}>
                      <RotateCcw size={12} style={{ marginRight: 4 }} /> Repeat Workout
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No workouts logged" description="Complete a session from a template or log a custom session to start tracking!" />
          )}
        </div>
      )}

      {/* RENDER ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Training Analytics & Insights</h3>
          
          <div className="analytics-grid">
            <Card className="analytic-card">
              <span className="analytic-desc">Workout Streak</span>
              <div className="analytic-value" style={{ color: 'var(--primary)' }}>
                <Award size={28} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
                {analytics.streak} Days
              </div>
              <span className="analytic-desc">Consecutive workout days</span>
            </Card>

            <Card className="analytic-card">
              <span className="analytic-desc">Consistency Score</span>
              <div className="analytic-value" style={{ color: '#10b981' }}>{analytics.consistencyScore}%</div>
              <span className="analytic-desc">Target 12 workouts / month</span>
            </Card>

            <Card className="analytic-card">
              <span className="analytic-desc">Total Lifted Volume</span>
              <div className="analytic-value">{analytics.totalVolume} kg</div>
              <span className="analytic-desc">Cumulative training volume</span>
            </Card>

            <Card className="analytic-card">
              <span className="analytic-desc">Burned Calorie Output</span>
              <div className="analytic-value" style={{ color: 'var(--destructive)' }}>{analytics.caloriesBurned} kcal</div>
              <span className="analytic-desc">Sum of energy expended</span>
            </Card>
          </div>

          <Card style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
            <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '12px', textAlign: 'center' }}>Muscles Neglected Analytics</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '16px' }}>
              Based on your history, here are the target zones you have trained recently, ordered by frequency:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analytics.musclesTrained.length > 0 ? (
                analytics.musclesTrained.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '6px 12px', background: 'var(--surface-variant)', borderRadius: 'var(--radius-sm)' }}>
                    <span>{m}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Trained</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--muted)', textAlign: 'center' }}>No workouts tracked to calculate muscle splits.</p>
              )}
            </div>
            
            <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '20px' }}>
              <strong>AI Coach Advice:</strong> Make sure you balance your training cycles to prevent muscle asymmetry. If you've been doing plenty of Push exercises (Chest/Shoulders), schedule a Pull Day to focus on your Back and rear delts!
            </div>
          </Card>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title={editingTemplateId ? "Edit Workout Template" : "Create Workout Template"}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Template Name</label>
              <Input 
                type="text" 
                placeholder="E.g. Upper Body Focus, Leg Day B" 
                value={templateForm.name} 
                onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label>Template Notes / Goals</label>
              <Input 
                type="text" 
                placeholder="E.g. Focus on progressive overload, rest 90s between sets" 
                value={templateForm.notes} 
                onChange={e => setTemplateForm({ ...templateForm, notes: e.target.value })} 
              />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {templateForm.exercises.map((ex, exIdx) => (
                <Card key={exIdx} style={{ padding: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{ex.name} ({ex.muscleGroup})</strong>
                    <button 
                      onClick={() => removeExerciseFromTemplateForm(exIdx)}
                      style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <table className="sets-table">
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Reps</th>
                        <th>Weight (kg)</th>
                        <th>Rest (s)</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set, setIdx) => (
                        <tr key={setIdx}>
                          <td>{set.setIndex}</td>
                          <td>
                            <input 
                              type="number" 
                              className="set-input" 
                              value={set.reps} 
                              onChange={e => handleTemplateSetChange(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="set-input" 
                              value={set.weight} 
                              onChange={e => handleTemplateSetChange(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="set-input" 
                              value={set.restTime} 
                              onChange={e => handleTemplateSetChange(exIdx, setIdx, 'restTime', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            {ex.sets.length > 1 && (
                              <button 
                                onClick={() => removeSetFromTemplateForm(exIdx, setIdx)}
                                style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Button size="sm" variant="secondary" onClick={() => addSetToTemplateForm(exIdx)} style={{ marginTop: '8px' }}>+ Add Set</Button>
                </Card>
              ))}
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Add Exercise to Template</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EXERCISE_OPTIONS.map((choice, i) => (
                  <button
                    key={i}
                    className="muscle-chip"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.75rem' }}
                    onClick={() => addExerciseToTemplateForm(choice)}
                  >
                    + {choice.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
              <Button onClick={saveTemplate}>Save Template</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
