import React, { useState } from 'react';
import { Target, Save, Sparkles, Dumbbell } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import '../pages/Settings.css';

export const Goals = ({ profile, setProfile, setActivePlan, setShoppingItems, API_BASE, token, navigateTo }) => {
  const { addToast } = useToast();
  const [savingGoals, setSavingGoals] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedPlanDetails, setGeneratedPlanDetails] = useState(null);

  const [formData, setFormData] = useState({
    primaryGoal: profile?.primaryGoal || 'Lose Fat',
    dietType: profile?.dietType || 'balanced',
    targetWeight: profile?.targetWeight || '',
    waterGoal: profile?.waterGoal || '2.5',
    sleepHours: profile?.sleepHours || '8',
    trainingExperience: profile?.trainingExperience || 'Beginner',
    preferredSplit: profile?.preferredSplit || 'Full Body',
    gymOrHome: profile?.gymOrHome || 'Gym',
    equipmentAvailable: profile?.equipmentAvailable ? profile.equipmentAvailable.join(', ') : '',
    workoutFrequency: profile?.workoutFrequency || '3',
    country: profile?.country || 'India',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const generatePlan = async (silent = false) => {
    setGeneratingPlan(true);
    if (!silent) {
      addToast('Generating Plan 🤖', 'BiteBuddy AI is formulating your new weekly meal plan...', 'info');
    }
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to generate plan.');
      
      const newPlan = await res.json();
      setActivePlan(newPlan);
      if (setShoppingItems) {
        setShoppingItems(newPlan.shoppingList || []);
      }
      setGeneratedPlanDetails(newPlan);
      setShowGeneratedModal(true);
      addToast('Plan Formulated! ✨', 'New AI weekly meal plan is ready.', 'success');
    } catch (err) {
      addToast('Generation Failed', err.message, 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const saveGoals = async () => {
    setSavingGoals(true);
    try {
      const parsedEquipment = typeof formData.equipmentAvailable === 'string'
        ? formData.equipmentAvailable.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const updatedProfile = { 
        ...profile, 
        ...formData,
        equipmentAvailable: parsedEquipment
      };

      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile),
      });
      if (!res.ok) throw new Error('Failed to save');
      
      setProfile(updatedProfile);
      addToast('Goals Saved', 'Your goals and location details have been updated.', 'success');
      
      // Chain automatic meal plan generation gracefully in background
      try {
        await generatePlan(true);
      } catch (genErr) {
        console.error("Auto plan generation failed after save:", genErr);
        addToast('AI Plan Delayed', 'Goals saved successfully! AI plan generation is currently rate-limited. You can trigger it manually in a minute.', 'warning');
      }
    } catch (err) {
      addToast('Save Failed', err.message || 'Could not save goals.', 'error');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleDietChange = (newDiet) => {
    setFormData({ ...formData, dietType: newDiet });
  };

  const handleGoalChange = (newGoal) => {
    setFormData({ ...formData, primaryGoal: newGoal });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header settings-header">
        <div>
          <h1 className="page-title">Goals & Diet</h1>
          <p className="page-subtitle">Configure your targets to generate accurate meal plans.</p>
        </div>
        <Button onClick={saveGoals} disabled={savingGoals || generatingPlan}>
          <Save size={18} style={{ marginRight: 8 }} />
          {savingGoals ? 'Saving...' : 'Save Goals'}
        </Button>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <Card className="settings-section">
            <h3 className="settings-section-title">
              <Target size={20} style={{ marginRight: 8, display: 'inline' }} />
              Goals & Diet Settings
            </h3>
            
            <div className="settings-form" style={{ maxWidth: '100%' }}>
              
              <div className="form-group">
                <label>Primary Goal</label>
                <div className="diet-chips">
                  {[['Lose Fat', 'Lose Fat'], ['Maintain', 'Maintain'], ['Gain Muscle', 'Gain Muscle'], ['Improve Health', 'Improve Health']].map(([val, lbl]) => (
                    <button 
                      type="button"
                      key={val} 
                      className={`diet-chip ${formData.primaryGoal === val ? 'active' : ''}`} 
                      onClick={() => handleGoalChange(val)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Diet Type</label>
                <div className="diet-chips">
                  {[['balanced', 'Balanced'], ['keto', 'Keto'], ['vegan', 'Vegan'], ['high-protein', 'High-Protein']].map(([val, lbl]) => (
                    <button
                      type="button"
                      key={val}
                      className={`diet-chip ${formData.dietType === val ? 'active' : ''}`}
                      onClick={() => handleDietChange(val)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="form-group">
                  <label>Target Weight (kg)</label>
                  <Input 
                    type="number" 
                    name="targetWeight"
                    value={formData.targetWeight} 
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Water Goal (Liters)</label>
                  <Input 
                    type="number" 
                    name="waterGoal"
                    value={formData.waterGoal} 
                    step="0.5"
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Sleep Goal (Hours)</label>
                  <Input 
                    type="number" 
                    name="sleepHours"
                    value={formData.sleepHours} 
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="bb-input"
                    style={{ width: '100%', height: '40px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 8px', color: 'var(--foreground)' }}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="Mexico">Mexico</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="settings-section" style={{ marginTop: '24px' }}>
            <h3 className="settings-section-title">
              <Dumbbell size={20} style={{ marginRight: 8, display: 'inline', color: 'var(--primary)' }} />
              Workout Profile Settings
            </h3>
            
            <div className="settings-form" style={{ maxWidth: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Training Experience</label>
                  <select
                    name="trainingExperience"
                    value={formData.trainingExperience}
                    onChange={handleChange}
                    className="bb-input"
                    style={{ width: '100%', height: '40px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 8px', color: 'var(--foreground)' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preferred Split</label>
                  <select
                    name="preferredSplit"
                    value={formData.preferredSplit}
                    onChange={handleChange}
                    className="bb-input"
                    style={{ width: '100%', height: '40px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 8px', color: 'var(--foreground)' }}
                  >
                    <option value="Full Body">Full Body</option>
                    <option value="Push/Pull/Legs">Push/Pull/Legs</option>
                    <option value="Upper/Lower">Upper/Lower</option>
                    <option value="Bro Split">Bro Split</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label>Workout Frequency (days/week)</label>
                  <Input 
                    type="number" 
                    name="workoutFrequency"
                    value={formData.workoutFrequency} 
                    min="0"
                    max="7"
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Gym or Home</label>
                  <div className="diet-chips" style={{ marginTop: '4px' }}>
                    {[['Gym', 'Gym'], ['Home', 'Home']].map(([val, lbl]) => (
                      <button
                        type="button"
                        key={val}
                        className={`diet-chip ${formData.gymOrHome === val ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, gymOrHome: val })}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Equipment Available (comma separated)</label>
                <Input 
                  type="text" 
                  name="equipmentAvailable"
                  value={formData.equipmentAvailable} 
                  onChange={handleChange}
                  placeholder="E.g. Dumbbells, Barbell, Pull-up Bar, Kettlebell"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="settings-sidebar">
          <Card className="settings-links-card">
            <h3 className="settings-section-title">
              <Sparkles size={18} style={{ marginRight: 8, display: 'inline', color: 'var(--primary)' }} />
              Generate AI Meal Plan
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Based on your selected diet and targets, BiteBuddy AI will formulate a complete weekly breakfast, lunch, dinner, and snack meal plan with macro-nutrients and a shopping list.
            </p>
            <Button 
              className="full-width" 
              onClick={() => generatePlan(false)} 
              disabled={generatingPlan || savingGoals}
            >
              {generatingPlan ? 'Generating Plan...' : 'Generate Meal Plan'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Generated Success Modal Popup */}
      {showGeneratedModal && (
        <Modal
          isOpen={showGeneratedModal}
          onClose={() => {
            setShowGeneratedModal(false);
            navigateTo('planner');
          }}
          title="✨ AI Meal Plan Generated!"
          size="md"
        >
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍏</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--foreground)' }}>Your Weekly Meal Plan is Ready!</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              BiteBuddy AI has formulated a custom weekly menu of nutritionally balanced meals tailored to your goal of <strong>{profile?.primaryGoal || 'Healthy Eating'}</strong> and diet type <strong>{profile?.dietType || 'Balanced'}</strong>.
            </p>
            
            <div style={{ background: 'var(--surface-variant)', padding: '16px', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Daily Calorie Target</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{generatedPlanDetails?.calorieTarget || 2000} kcal</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Daily Protein</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-protein)' }}>{generatedPlanDetails?.macroTargets?.protein || 150}g</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Carbohydrates</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-carbs)' }}>{generatedPlanDetails?.macroTargets?.carbs || 200}g</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Dietary Fats</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-fat)' }}>{generatedPlanDetails?.macroTargets?.fat || 65}g</span>
              </div>
            </div>

            <Button 
              className="full-width" 
              onClick={() => {
                setShowGeneratedModal(false);
                navigateTo('planner');
              }}
            >
              Go to Meal Planner
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
