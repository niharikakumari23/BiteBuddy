import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Moon, Sun, Save, Bell, Shield, HelpCircle, LogOut, Trash2, Key } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import './Settings.css';

export const Settings = ({ profile, API_BASE, token, user, onLogout, navigateTo, setActivePlan, setShoppingItems }) => {
  const { addToast } = useToast();
  const [theme, setTheme] = useState('system'); // 'light', 'dark', 'system'
  const [activeModal, setActiveModal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedPlanDetails, setGeneratedPlanDetails] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize theme from document body
  useEffect(() => {
    if (document.body.classList.contains('dark-theme')) {
      setTheme('dark');
    } else if (document.body.classList.contains('light-theme')) {
      setTheme('light');
    } else {
      setTheme('system');
    }
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    document.body.classList.remove('dark-theme', 'light-theme');
    if (newTheme !== 'system') {
      document.body.classList.add(`${newTheme}-theme`);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    addToast('Generating Plan 🤖', 'This might take a minute...', 'info');
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Generation failed');
      const newPlan = await res.json();
      setActivePlan(newPlan);
      if (setShoppingItems) {
        setShoppingItems(newPlan.shoppingList || []);
      }
      setGeneratedPlanDetails(newPlan);
      setShowGeneratedModal(true);
      addToast('Success!', 'Your personalized plan is ready.', 'success');
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Validation Error', 'Please fill in all password fields.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Validation Error', 'New password must be at least 6 characters.', 'warning');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');

      addToast('Success', 'Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (err) {
      addToast('Error', err.message, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete your account? This will permanently delete your profile, workout history, meal logs, and all AI plans. This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account.');

      onLogout('Your account has been deleted successfully.');
    } catch (err) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header settings-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, preferences, and goals.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          {/* Profile Section */}
          <Card className="settings-section">
            <h3 className="settings-section-title">Profile Information</h3>
            <div className="profile-edit-area">
              <div className="profile-avatar-large">
                <User size={40} color="var(--primary)" />
              </div>
              <div className="profile-fields">
                <div className="form-group">
                  <label>Full Name</label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <Input value={user?.email || ''} disabled />
                </div>
              </div>
            </div>
          </Card>

          {/* Account Security & Actions Section */}
          <Card className="settings-section">
            <h3 className="settings-section-title">Account Settings</h3>
            
            <div className="preference-item">
              <div className="preference-info">
                <div className="preference-label">Change Password</div>
                <div className="preference-desc">Update your login password</div>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal('password')}>
                <Key size={16} style={{ marginRight: 8 }} /> Password
              </Button>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <div className="preference-label">Sign Out</div>
                <div className="preference-desc">Fully terminate your active session</div>
              </div>
              <Button variant="outline" onClick={() => onLogout('Logged out successfully.')}>
                <LogOut size={16} style={{ marginRight: 8 }} /> Logout
              </Button>
            </div>
          </Card>

          {/* App Preferences */}
          <Card className="settings-section">
            <h3 className="settings-section-title">App Preferences</h3>
            
            <div className="preference-item">
              <div className="preference-info">
                <div className="preference-label">Theme</div>
                <div className="preference-desc">Choose your preferred appearance</div>
              </div>
              <div className="theme-toggle">
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('light')}
                  title="Light mode"
                >
                  <Sun size={18} />
                </button>
                <button 
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => toggleTheme('system')}
                  title="System default"
                >
                  <SettingsIcon size={18} />
                </button>
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                  title="Dark mode"
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <div className="preference-label">Push Notifications</div>
                <div className="preference-desc">Receive reminders for meals and water</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </Card>
        </div>

        <div className="settings-sidebar">
          {/* AI Plan Generation */}
          <Card className="settings-links-card" style={{marginBottom: '1.5rem'}}>
            <h3 className="settings-section-title">AI Personalization</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>
              Generate a completely personalized meal and macro plan based on your latest profile and workout data.
            </p>
            <Button className="full-width" onClick={generatePlan} disabled={generating}>
              {generating ? 'Generating...' : 'Generate AI Plan'}
            </Button>
          </Card>

          {/* Quick Links */}
          <Card className="settings-links-card">
            <ul className="settings-links-list">
              <li>
                <button className="settings-link-item" onClick={() => setActiveModal('notifications')}>
                  <Bell size={18} /> Notifications
                </button>
              </li>
              <li>
                <button className="settings-link-item" onClick={() => setActiveModal('privacy')}>
                  <Shield size={18} /> Privacy & Security
                </button>
              </li>
              <li>
                <button className="settings-link-item" onClick={() => setActiveModal('help')}>
                  <HelpCircle size={18} /> Help & Support
                </button>
              </li>
            </ul>
          </Card>

          {/* Danger Zone */}
          <Card className="danger-zone-card">
            <h3 className="danger-zone-title">Danger Zone</h3>
            <p className="danger-zone-desc">Permanently delete your BiteBuddy account and purge all associated metrics.</p>
            <Button variant="outline" className="danger-btn full-width" onClick={handleDeleteAccount}>
              <Trash2 size={16} style={{ marginRight: 8 }} /> Delete Account
            </Button>
          </Card>
        </div>
      </div>
      
      {/* Modals */}
      {activeModal === 'password' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', maxWidth: '400px', width: '90%'}}>
            <h2 style={{marginBottom: '16px'}}>Update Password</h2>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Current Password</label>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>New Password</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" className="full-width" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit" className="full-width" disabled={passwordLoading}>
                  {passwordLoading ? 'Saving...' : 'Save Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'notifications' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', maxWidth: '400px'}}>
            <h2 style={{marginBottom: '16px'}}>Notifications Settings</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <label style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Meal Reminders</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Hydration Reminders</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Weekly Progress Reports</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
            <Button className="full-width" style={{marginTop: '24px'}} onClick={() => setActiveModal(null)}>Save Settings</Button>
          </div>
        </div>
      )}
      
      {activeModal === 'privacy' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', maxWidth: '400px'}}>
            <h2 style={{marginBottom: '16px'}}>Privacy & Security</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <Button variant="secondary" className="full-width" onClick={() => { setActiveModal('password'); }}>Change Password</Button>
              <Button variant="secondary" className="full-width">Manage Two-Factor Auth</Button>
              <Button variant="secondary" className="full-width">Download My Data</Button>
            </div>
            <Button className="full-width" style={{marginTop: '24px'}} onClick={() => setActiveModal(null)}>Close</Button>
          </div>
        </div>
      )}

      {activeModal === 'help' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', maxWidth: '400px'}}>
            <h2 style={{marginBottom: '16px'}}>Help & Support</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <p style={{color: 'var(--muted)'}}>Having trouble? We're here to help.</p>
              <Button variant="secondary" className="full-width">View FAQ</Button>
              <Button variant="secondary" className="full-width">Contact Support</Button>
            </div>
            <Button className="full-width" style={{marginTop: '24px'}} onClick={() => setActiveModal(null)}>Close</Button>
          </div>
        </div>
      )}

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
