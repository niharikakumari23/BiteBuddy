import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Image as ImageIcon, Utensils, Check, X, Sparkles, Scale } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import './FoodLog.css';

export const FoodLog = ({
  API_BASE,
  navigateTo,
  token,
  logs = [],
  setLogs,
  activePlan,
  setActivePlan,
  setShoppingItems,
  refreshData
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [replaceFoodText, setReplaceFoodText] = useState('');
  const [recalcLoading, setRecalcLoading] = useState(false);

  const deleteLog = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/meallog/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(logs.filter(l => l._id !== id));
        if (data.mealPlan) {
          setActivePlan(data.mealPlan);
          setShoppingItems(data.mealPlan.shoppingList || []);
        }
        addToast('Deleted', 'Meal removed from log', 'success');
        if (refreshData) {
          refreshData();
        }
      }
    } catch (err) {
      addToast('Error', 'Failed to delete meal', 'error');
    }
  };

  const duplicateLog = async (log) => {
    try {
      const { _id, createdAt, updatedAt, ...copyData } = log;
      const res = await fetch(`${API_BASE}/meallog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(copyData)
      });
      if (res.ok) {
        const data = await res.json();
        setLogs([data.mealLog, ...logs]);
        if (data.mealPlan) {
          setActivePlan(data.mealPlan);
          setShoppingItems(data.mealPlan.shoppingList || []);
        }
        addToast('Duplicated', 'Meal duplicated successfully', 'success');
        if (refreshData) {
          refreshData();
        }
      }
    } catch (err) {
      addToast('Error', 'Failed to duplicate meal', 'error');
    }
  };

  const handleAIRecalculate = async () => {
    const queryText = replaceFoodText.trim() || editingLog.foodName;
    if (!queryText) {
      addToast('Input Required', 'Please enter a food description to analyze.', 'warning');
      return;
    }

    setRecalcLoading(true);
    try {
      const res = await fetch(`${API_BASE}/food/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          food: queryText,
          persist: false
        })
      });

      if (!res.ok) {
        throw new Error('AI Recalculation failed');
      }

      const data = await res.json();
      setEditingLog({
        ...editingLog,
        foodName: data.nutrition.food_name,
        calories: data.nutrition.calories,
        protein: data.nutrition.protein,
        carbs: data.nutrition.carbs,
        fats: data.nutrition.fat, // Map fat to fats
        fiber: data.nutrition.fiber,
        servingSize: data.nutrition.serving_size
      });
      setReplaceFoodText(data.nutrition.food_name);
      addToast('AI Updated ✨', 'Macros successfully calculated and loaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('AI Error', 'Could not recalculate macros.', 'error');
    } finally {
      setRecalcLoading(false);
    }
  };

  const updateLog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/meallog/${editingLog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          foodName: editingLog.foodName,
          mealType: editingLog.mealType || 'Snacks',
          calories: editingLog.calories,
          protein: editingLog.protein,
          carbs: editingLog.carbs,
          fats: editingLog.fats,
          fiber: editingLog.fiber,
          servingSize: editingLog.servingSize
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(logs.map(l => l._id === data.mealLog._id ? data.mealLog : l));
        if (data.mealPlan) {
          setActivePlan(data.mealPlan);
          setShoppingItems(data.mealPlan.shoppingList || []);
        }
        addToast('Success', 'Meal log updated successfully', 'success');
        setEditingLog(null);
        setReplaceFoodText('');
        if (refreshData) {
          refreshData();
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update log');
      }
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const groupedLogs = {
    Breakfast: logs.filter(l => l.mealType === 'Breakfast'),
    Lunch: logs.filter(l => l.mealType === 'Lunch'),
    Dinner: logs.filter(l => l.mealType === 'Dinner'),
    Snacks: logs.filter(l => l.mealType === 'Snacks' || !l.mealType),
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setReplaceFoodText(log.foodName);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Today's Food Log</h1>
          <p className="page-subtitle">Track everything you eat and drink today.</p>
        </div>
        <Button onClick={() => navigateTo('scanner')} className="bb-btn--primary">
          <Plus size={18} style={{ marginRight: 8 }} /> Add Meal via Scanner
        </Button>
      </div>

      <div className="food-log-timeline">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading...</div>
        ) : (
          ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((mealType) => (
            <div key={mealType} className="food-log-section">
              <h2 className="food-log-section-title">
                <Utensils size={18} /> {mealType}
                <span className="food-log-section-cals">
                  {groupedLogs[mealType].reduce((acc, l) => acc + (l.calories || 0), 0)} kcal
                </span>
              </h2>
              
              <div className="food-log-cards">
                {groupedLogs[mealType].length === 0 ? (
                  <div className="food-log-empty">
                    <p>No {mealType.toLowerCase()} logged yet.</p>
                  </div>
                ) : (
                  groupedLogs[mealType].map(log => (
                    <Card key={log._id} className="food-log-card">
                      <div className="food-log-card-left">
                        {log.imageUrl ? (
                          <img src={log.imageUrl} alt={log.foodName} className="food-log-image" />
                        ) : (
                          <div className="food-log-image-placeholder">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="food-log-info">
                          <h3 className="food-log-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {log.foodName}
                            {log.source === 'AI Food Search' && (
                              <span className="ai-estimated-badge" title="AI Estimated Nutrition">
                                ✨ AI Estimated
                              </span>
                            )}
                          </h3>
                          <p className="food-log-time" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{log.time || new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {log.servingSize && <span>• Serves: {log.servingSize}</span>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="food-log-card-right">
                        <div className="food-log-macros-inline">
                          <div className="macro-badge calories">{log.calories} kcal</div>
                          <div className="macro-badge protein">{log.protein}g P</div>
                          <div className="macro-badge carbs">{log.carbs}g C</div>
                          <div className="macro-badge fat">{log.fats || log.fat || 0}g F</div>
                        </div>
                        <div className="food-log-actions">
                          <button className="action-btn" onClick={() => duplicateLog(log)} title="Duplicate">
                            <Copy size={16} />
                          </button>
                          <button className="action-btn" onClick={() => openEditModal(log)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn destructive" onClick={() => deleteLog(log._id)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Meal Modal */}
      {editingLog && (
        <div className="modal-overlay" onClick={() => { setEditingLog(null); setReplaceFoodText(''); }}>
          <Card className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Meal Log</h2>
              <button onClick={() => { setEditingLog(null); setReplaceFoodText(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={updateLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>Replace Food / serving (AI Estimate)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="bb-input"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)' }}
                    placeholder="E.g., 2 slices of Pizza, or Chicken Salad"
                    value={replaceFoodText}
                    onChange={e => setReplaceFoodText(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={handleAIRecalculate} disabled={recalcLoading}>
                    <Sparkles size={14} style={{ marginRight: 4 }} />
                    {recalcLoading ? '...' : 'Estimate'}
                  </Button>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '8px 0' }} />

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>Food Name</label>
                <input
                  type="text"
                  className="bb-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)' }}
                  value={editingLog.foodName || ''}
                  onChange={e => setEditingLog({ ...editingLog, foodName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>Serving Size Description</label>
                <input
                  type="text"
                  className="bb-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)' }}
                  placeholder="E.g. 1 plate, 250g, 2 pieces"
                  value={editingLog.servingSize || ''}
                  onChange={e => setEditingLog({ ...editingLog, servingSize: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>Meal Type</label>
                <select
                  className="bb-input"
                  value={editingLog.mealType || 'Snacks'}
                  onChange={e => setEditingLog({ ...editingLog, mealType: e.target.value })}
                  style={{ width: '100%', height: '40px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 8px', color: 'var(--foreground)' }}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>Calories (kcal)</label>
                <input
                  type="number"
                  className="bb-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)' }}
                  value={editingLog.calories || 0}
                  onChange={e => setEditingLog({ ...editingLog, calories: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Protein (g)</label>
                  <input
                    type="number"
                    className="bb-input"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
                    value={editingLog.protein || 0}
                    onChange={e => setEditingLog({ ...editingLog, protein: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Carbs (g)</label>
                  <input
                    type="number"
                    className="bb-input"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
                    value={editingLog.carbs || 0}
                    onChange={e => setEditingLog({ ...editingLog, carbs: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Fats (g)</label>
                  <input
                    type="number"
                    className="bb-input"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
                    value={editingLog.fats || editingLog.fat || 0}
                    onChange={e => setEditingLog({ ...editingLog, fats: parseFloat(e.target.value) || 0, fat: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Fiber (g)</label>
                  <input
                    type="number"
                    className="bb-input"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.85rem' }}
                    value={editingLog.fiber || 0}
                    onChange={e => setEditingLog({ ...editingLog, fiber: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button type="button" variant="ghost" className="full-width" onClick={() => { setEditingLog(null); setReplaceFoodText(''); }}>Cancel</Button>
                <Button type="submit" className="full-width">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
