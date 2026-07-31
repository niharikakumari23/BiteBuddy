import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import './Onboarding.css';

export const Onboarding = ({ API_BASE, token, onComplete }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'male', height: '', currentWeight: '', targetWeight: '',
    primaryGoal: 'Lose Fat', dietType: 'balanced', allergies: '', foodsToAvoid: '',
    cuisinePreference: 'Any', monthlyFoodBudget: '', dailyActivityLevel: 'moderate',
    workoutStatus: 'active', workoutType: 'Gym', workoutFrequency: '3',
    workoutDuration: '45', workoutTime: 'Morning', waterGoal: '2.5', sleepHours: '8',
    country: 'India'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const submitProfile = async () => {
    setLoading(true);
    try {
      const payload = { ...formData };
      // Convert arrays
      payload.allergies = payload.allergies.split(',').map(s => s.trim()).filter(s => s);
      payload.foodsToAvoid = payload.foodsToAvoid.split(',').map(s => s.trim()).filter(s => s);
      
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save profile');
      
      addToast('Profile Created!', 'Formulating your first personalized AI meal plan...', 'info');
      try {
        await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (genErr) {
        console.error("Auto plan generation failed during onboarding", genErr);
      }

      addToast('Setup Finished!', 'Welcome to BiteBuddy.', 'success');
      onComplete();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <Card className="onboarding-card">
        <h2>Welcome to BiteBuddy 🍏</h2>
        <p>Let's personalize your AI experience.</p>
        
        {step === 1 && (
          <div className="onboarding-step">
            <h3>Basic Info</h3>
            <label>Name: <Input name="name" value={formData.name} onChange={handleChange} /></label>
            <label>Age: <Input type="number" name="age" value={formData.age} onChange={handleChange} /></label>
            <label>Gender: 
              <select name="gender" value={formData.gender} onChange={handleChange} className="ui-input">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </label>
            <label>Height (cm): <Input type="number" name="height" value={formData.height} onChange={handleChange} /></label>
            <label>Country: 
              <select name="country" value={formData.country} onChange={handleChange} className="ui-input">
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="Mexico">Mexico</option>
                <option value="UK">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h3>Goals & Diet</h3>
            <label>Current Weight (kg): <Input type="number" name="currentWeight" value={formData.currentWeight} onChange={handleChange} /></label>
            <label>Target Weight (kg): <Input type="number" name="targetWeight" value={formData.targetWeight} onChange={handleChange} /></label>
            <label>Primary Goal:
              <select name="primaryGoal" value={formData.primaryGoal} onChange={handleChange} className="ui-input">
                <option>Lose Fat</option><option>Gain Muscle</option><option>Maintain</option><option>Improve Health</option>
              </select>
            </label>
            <label>Diet Type:
              <select name="dietType" value={formData.dietType} onChange={handleChange} className="ui-input">
                <option value="balanced">Balanced</option><option value="keto">Keto</option><option value="vegan">Vegan</option><option value="high-protein">High Protein</option>
              </select>
            </label>
            <div className="btn-group">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h3>Preferences</h3>
            <label>Allergies (comma separated): <Input name="allergies" value={formData.allergies} onChange={handleChange} /></label>
            <label>Foods to Avoid: <Input name="foodsToAvoid" value={formData.foodsToAvoid} onChange={handleChange} /></label>
            <label>Cuisine Preference: <Input name="cuisinePreference" value={formData.cuisinePreference} onChange={handleChange} /></label>
            <label>Monthly Budget (₹): <Input type="number" name="monthlyFoodBudget" value={formData.monthlyFoodBudget} onChange={handleChange} /></label>
            <div className="btn-group">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step">
            <h3>Lifestyle & Workout</h3>
            <label>Daily Activity Level:
              <select name="dailyActivityLevel" value={formData.dailyActivityLevel} onChange={handleChange} className="ui-input">
                <option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="very_active">Very Active</option>
              </select>
            </label>
            <label>Workout Status:
              <select name="workoutStatus" value={formData.workoutStatus} onChange={handleChange} className="ui-input">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </label>
            <label>Workout Type: <Input name="workoutType" value={formData.workoutType} onChange={handleChange} /></label>
            <label>Frequency (days/week): <Input type="number" name="workoutFrequency" value={formData.workoutFrequency} onChange={handleChange} /></label>
            <label>Duration (mins): <Input type="number" name="workoutDuration" value={formData.workoutDuration} onChange={handleChange} /></label>
            <label>Time: <Input name="workoutTime" value={formData.workoutTime} onChange={handleChange} /></label>
            <label>Water Goal (L): <Input type="number" name="waterGoal" value={formData.waterGoal} onChange={handleChange} /></label>
            <label>Sleep (hours): <Input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} /></label>
            <div className="btn-group">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={submitProfile} disabled={loading}>{loading ? 'Saving...' : 'Finish Setup'}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
