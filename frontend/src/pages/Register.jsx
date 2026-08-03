import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlus, User, Key, Mail, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './Register.css';

export const Register = ({ API_BASE, onRegisterSuccess, navigateToLogin }) => {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name || !email || !password || !confirmPassword) {
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
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Automatically log user in: save token to sessionStorage (session-only by default)
      sessionStorage.setItem('token', data.token);

      addToast('Account Created!', 'Welcome to BiteBuddy.', 'success');
      onRegisterSuccess(data.token, data.user);
    } catch (err) {
      console.error('Registration Fetch Error:', err);
      const msg = err.message === 'Failed to fetch'
        ? `Network Error (Failed to fetch). Target URL: ${API_BASE}/auth/register`
        : err.message;
      setError(msg);
      addToast('Registration Failed', msg, 'error');
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
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join BiteBuddy to get customized diet and recovery plans.</p>

        {error && (
          <div className="auth-error-banner animate-shake">
            <ShieldAlert size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="name">Full Name</label>
            <div className="auth-input-icon-wrapper">
              <User size={18} className="auth-input-icon" />
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Niharika"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

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
            <label htmlFor="password">Password</label>
            <div className="auth-input-icon-wrapper">
              <Key size={18} className="auth-input-icon" />
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-input-icon-wrapper">
              <Key size={18} className="auth-input-icon" />
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <Button type="submit" className="auth-submit-btn" disabled={loading}>
            <UserPlus size={18} style={{ marginRight: 8 }} />
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="auth-footer-text">
          <span>Already have an account? </span>
          <button className="auth-link-btn" onClick={navigateToLogin} disabled={loading}>
            Sign In
          </button>
        </div>
      </Card>
    </div>
  );
};
