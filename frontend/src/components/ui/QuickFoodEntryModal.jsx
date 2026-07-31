import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Sparkles, AlertTriangle, CheckCircle, Scale, Brain } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useToast } from '../../hooks/useToast';
import './QuickFoodEntryModal.css';

export const QuickFoodEntryModal = ({
  isOpen,
  onClose,
  logs,
  setLogs,
  activePlan,
  setActivePlan,
  setShoppingItems,
  API_BASE,
  token,
  refreshData
}) => {
  const { addToast } = useToast();
  const [foodText, setFoodText] = useState('');
  const [mealType, setMealType] = useState('Lunch');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Set default meal type based on current local hour
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      setMealType('Breakfast');
    } else if (hour >= 11 && hour < 16) {
      setMealType('Lunch');
    } else if (hour >= 16 && hour < 22) {
      setMealType('Dinner');
    } else {
      setMealType('Snacks');
    }
  }, []);

  if (!isOpen) return null;

  const handleAction = async (persist) => {
    if (!foodText.trim()) {
      addToast('Input Required', 'Please enter a food description first.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/food/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          food: foodText,
          persist,
          mealType
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze food. Make sure backend is running.');
      }

      const data = await res.json();

      if (persist) {
        // Automatically save returned details into states
        if (data.todayLogs) {
          setLogs(data.todayLogs);
        }
        if (data.mealPlan) {
          setActivePlan(data.mealPlan);
          setShoppingItems(data.mealPlan.shoppingList || []);
        }

        addToast(
          'Logged successfully! 🍽️',
          `Added ${data.mealLog.foodName} (${data.mealLog.calories} kcal) to ${data.mealLog.mealType}.`,
          'success'
        );

        if (data.adjusted) {
          setTimeout(() => {
            addToast('AI Coach Update ✨', data.adjustmentNotification, 'info');
          }, 800);
        }

        if (refreshData) {
          refreshData();
        }
        onClose();
      } else {
        // Just previewing the nutrition
        setPreviewData(data.nutrition);
        addToast('Analysis Complete', `Estimated nutrition for ${data.nutrition.food_name}.`, 'success');
      }

    } catch (err) {
      console.error(err);
      addToast('AI Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const logPreviewMeal = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      // Re-call API with persist=true using the exact estimated food name (or text)
      const res = await fetch(`${API_BASE}/food/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          food: previewData.food_name + " (" + previewData.serving_size + ")",
          persist: true,
          mealType
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save log.');
      }

      const data = await res.json();
      if (data.todayLogs) setLogs(data.todayLogs);
      if (data.mealPlan) {
        setActivePlan(data.mealPlan);
        setShoppingItems(data.mealPlan.shoppingList || []);
      }

      addToast(
        'Logged successfully! 🍽️',
        `Added ${data.mealLog.foodName} to ${data.mealLog.mealType}.`,
        'success'
      );

      if (data.adjusted) {
        setTimeout(() => {
          addToast('AI Coach Update ✨', data.adjustmentNotification, 'info');
        }, 800);
      }

      if (refreshData) {
        refreshData();
      }
      onClose();
    } catch (err) {
      addToast('AI Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qfe-overlay animate-fade-in" onClick={onClose}>
      <Card className="qfe-content glassmorphism" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="qfe-header">
          <div className="qfe-header-title">
            <Sparkles size={20} color="var(--primary)" className="qfe-sparkle-icon" />
            <h2>Quick Food Entry</h2>
          </div>
          <button className="qfe-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form elements */}
        <div className="qfe-body">
          <div className="qfe-form-group">
            <label className="qfe-label">What did you eat?</label>
            <textarea
              className="qfe-textarea"
              placeholder="Enter a food (e.g. Chicken Biryani, 2 Rotis + Dal, Paneer Butter Masala, Apple, Protein Shake...)"
              value={foodText}
              onChange={e => setFoodText(e.target.value)}
              disabled={loading}
              rows={3}
            />
            {foodText.trim() && (
              <div className="qfe-typing-status">
                <div className="qfe-typing-pill">
                  <div className="qfe-typing-indicator-dot"></div>
                  <span>
                    Parsing: <strong>{foodText}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="qfe-form-row">
            <div className="qfe-form-group flex-1">
              <label className="qfe-label">Meal Period</label>
              <select
                className="qfe-select"
                value={mealType}
                onChange={e => setMealType(e.target.value)}
                disabled={loading}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="qfe-actions">
            <Button
              variant="outline"
              onClick={() => handleAction(false)}
              disabled={loading || !foodText.trim()}
              className="qfe-btn flex-1"
            >
              <Search size={16} style={{ marginRight: 6 }} />
              Search Food
            </Button>
            <Button
              onClick={() => handleAction(true)}
              disabled={loading || !foodText.trim()}
              className="qfe-btn primary flex-1"
            >
              <Plus size={16} style={{ marginRight: 6 }} />
              {loading ? 'Analyzing...' : 'Add to Meal Log'}
            </Button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="qfe-loading-wrapper">
              <div className="qfe-loading-spinner" />
              <p>AI nutrition coach is estimating nutritional facts...</p>
            </div>
          )}

          {/* Preview Panel */}
          {previewData && !loading && (
            <div className="qfe-preview animate-fade-in">
              <div className="qfe-preview-header">
                <div>
                  <h3 className="qfe-preview-foodname">{previewData.food_name}</h3>
                  <span className="qfe-preview-serving"><Scale size={12} style={{ marginRight: 4 }} /> Serving: {previewData.serving_size}</span>
                </div>
                {previewData.confidence_score && (
                  <div className="qfe-confidence-badge" title="AI Confidence Score">
                    <Brain size={14} style={{ marginRight: 4 }} />
                    <span>{Math.round(previewData.confidence_score * 100)}% Match</span>
                  </div>
                )}
              </div>

              {/* Nutrition Grid */}
              <div className="qfe-nutrition-grid">
                <div className="qfe-nut-card calorie">
                  <span className="qfe-nut-val">{previewData.calories}</span>
                  <span className="qfe-nut-lbl">Calories (kcal)</span>
                  {previewData.minCalories !== undefined && (
                    <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px', display: 'block' }}>
                      ({previewData.minCalories} - {previewData.maxCalories})
                    </span>
                  )}
                </div>
                <div className="qfe-nut-card protein">
                  <span className="qfe-nut-val">{previewData.protein}g</span>
                  <span className="qfe-nut-lbl">Protein</span>
                  {previewData.minProtein !== undefined && (
                    <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px', display: 'block' }}>
                      ({previewData.minProtein} - {previewData.maxProtein}g)
                    </span>
                  )}
                </div>
                <div className="qfe-nut-card carbs">
                  <span className="qfe-nut-val">{previewData.carbs}g</span>
                  <span className="qfe-nut-lbl">Carbs</span>
                  {previewData.minCarbs !== undefined && (
                    <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px', display: 'block' }}>
                      ({previewData.minCarbs} - {previewData.maxCarbs}g)
                    </span>
                  )}
                </div>
                <div className="qfe-nut-card fat">
                  <span className="qfe-nut-val">{previewData.fat}g</span>
                  <span className="qfe-nut-lbl">Fat</span>
                  {previewData.minFat !== undefined && (
                    <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px', display: 'block' }}>
                      ({previewData.minFat} - {previewData.maxFat}g)
                    </span>
                  )}
                </div>
              </div>

              {/* Extra details (Fiber, Sugar, Sodium, Cholesterol) */}
              <div className="qfe-extra-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="qfe-extra-item">
                  <span className="qfe-extra-lbl">Fiber:</span>
                  <span className="qfe-extra-val">
                    {previewData.fiber || 0}g
                    {previewData.minFiber !== undefined && ` (${previewData.minFiber}-${previewData.maxFiber}g)`}
                  </span>
                </div>
                <div className="qfe-extra-item">
                  <span className="qfe-extra-lbl">Sugar:</span>
                  <span className="qfe-extra-val">
                    {previewData.sugar || 0}g
                    {previewData.minSugar !== undefined && ` (${previewData.minSugar}-${previewData.maxSugar}g)`}
                  </span>
                </div>
                <div className="qfe-extra-item">
                  <span className="qfe-extra-lbl">Sodium:</span>
                  <span className="qfe-extra-val">
                    {previewData.sodium || 0}mg
                    {previewData.minSodium !== undefined && ` (${previewData.minSodium}-${previewData.maxSodium}mg)`}
                  </span>
                </div>
                <div className="qfe-extra-item">
                  <span className="qfe-extra-lbl">Cholesterol:</span>
                  <span className="qfe-extra-val">
                    {previewData.minCholesterol !== undefined ? `${previewData.minCholesterol}-${previewData.maxCholesterol}mg` : '0mg'}
                  </span>
                </div>
              </div>


              <Button onClick={logPreviewMeal} className="qfe-log-preview-btn w-full">
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                Log This Estimated Meal
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
