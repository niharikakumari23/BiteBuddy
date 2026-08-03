import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogIn, Key, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './Login.css';

export const Login = ({ API_BASE, onLoginSuccess, navigateToRegister }) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return false;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    setError('');
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Save token depending on user selection
      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }

      addToast('Welcome Back!', 'Login successful.', 'success');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      console.error('Login Fetch Error:', err);
      const msg = err.message === 'Failed to fetch'
        ? `Network Error (Failed to fetch). Target URL: ${API_BASE}/auth/login`
        : err.message;
      setError(msg);
      addToast('Login Failed', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container animate-fade-in">
      <div className="auth-header-logo">
        <div className="logo-sparkle-box">
          <Sparkles size={24} color="var(--primary)" />
        </div>
        <h1>BiteBuddy</h1>
        <p>AI-Powered Personal Nutritionist</p>
      </div>

      <Card className="auth-card animate-zoom-out-right">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Log in to track your meals, workouts, and AI plans.</p>

        {error && (
          <div className="auth-error-banner animate-shake">
            <ShieldAlert size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="email">Email Address</label>
            <div className="auth-input-icon-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-password-label-row">
              <label htmlFor="password">Password</label>
              <a href="#" className="auth-link-small" onClick={(e) => { e.preventDefault(); addToast('Info', 'Password reset coming soon!', 'info'); }}>
                Forgot Password?
              </a>
            </div>
            <div className="auth-input-icon-wrapper">
              <Key size={18} className="auth-input-icon" />
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="auth-form-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember Me</span>
            </label>
          </div>

          <Button type="submit" className="auth-submit-btn" disabled={loading}>
            <LogIn size={18} style={{ marginRight: 8 }} />
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer-text">
          <span>New to BiteBuddy? </span>
          <button className="auth-link-btn" onClick={navigateToRegister} disabled={loading}>
            Create an Account
          </button>
        </div>
      </Card>
    </div>
  );
};
