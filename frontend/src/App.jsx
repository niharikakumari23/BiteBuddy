import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Plus } from 'lucide-react';
import { QuickFoodEntryModal } from './components/ui/QuickFoodEntryModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { FoodScanner } from './pages/FoodScanner';
import { MealPlanner } from './pages/MealPlanner';
import { Nutrition } from './pages/Nutrition';
import { Shopping } from './pages/Shopping';
import { AICoach } from './pages/AICoach';
import { Goals } from './pages/Goals';
import { FoodLog } from './pages/FoodLog';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';
import { WorkoutLog } from './pages/WorkoutLog';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import './App.css';
import { useToast } from './hooks/useToast';

const getApiBase = () => {
  let url = (import.meta.env.VITE_API_URL || '/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const API_BASE = getApiBase();

function App() {
  const { addToast } = useToast();

  // Navigation and Authentication State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  const [token, setToken] = useState(
    localStorage.getItem('token') || sessionStorage.getItem('token') || null
  );
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Global App Data State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [logs, setLogs] = useState([]); // Today's meal logs
  const [allMeals, setAllMeals] = useState([]); // All historical meal logs
  const [workoutLogs, setWorkoutLogs] = useState([]); // All historical workout logs
  const [analyticsData, setAnalyticsData] = useState(null); // Calculated analytics from backend
  const [isQuickFoodOpen, setIsQuickFoodOpen] = useState(false);

  // Logout handler
  const handleLogout = (message = null) => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setActivePlan(null);
    setShoppingItems([]);
    setLogs([]);
    setAllMeals([]);
    setWorkoutLogs([]);
    setAnalyticsData(null);
    setCheckedItems(new Set());
    setCurrentPage('dashboard');
    setLoadingAuth(false);
    setLoadingProfile(false);
    if (message) {
      addToast('Session Ended', message, 'info');
    }
  };

  // Login success callback
  const handleLoginSuccess = (newToken, loggedInUser) => {
    setToken(newToken);
    setUser(loggedInUser);
  };

  // Verify token on mount/token change
  const verifyToken = async () => {
    if (!token) {
      setLoadingAuth(false);
      return;
    }
    setLoadingAuth(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Load associated user profile data records
        await loadData(token);
      } else {
        const data = await res.json();
        handleLogout(data.error || 'Session expired. Please log in again.');
      }
    } catch (e) {
      console.error('Auth verification failed', e);
      addToast('Connection Error', 'Failed to verify session.', 'error');
      setLoadingAuth(false);
    }
  };

  // Load user data once authenticated
  const loadData = async (activeToken) => {
    const currentToken = activeToken || token;
    if (!currentToken) return;

    setLoadingProfile(true);
    try {
      // 1. Fetch Profile
      const profRes = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);

        // 2. Fetch Active AI Plan
        const planRes = await fetch(`${API_BASE}/generate`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData && planData.plan) {
            setActivePlan(planData);
            setShoppingItems(planData.shoppingList || []);
          } else {
            setActivePlan(null);
            setShoppingItems([]);
          }
        }

        // 3. Fetch Today's Meal Logs
        const d = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
        const logsRes = await fetch(`${API_BASE}/meallog?date=${d}`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (logsRes.ok) {
          setLogs(await logsRes.json());
        }

        // 4. Fetch All Meals
        const allMealsRes = await fetch(`${API_BASE}/meallog`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (allMealsRes.ok) {
          setAllMeals(await allMealsRes.json());
        }

        // 5. Fetch Completed Workouts
        const workoutsRes = await fetch(`${API_BASE}/workouts`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (workoutsRes.ok) {
          setWorkoutLogs(await workoutsRes.json());
        }

        // 6. Fetch Analytics
        const analyticsRes = await fetch(`${API_BASE}/analytics`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (analyticsRes.ok) {
          setAnalyticsData(await analyticsRes.json());
        }
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Failed to load user data records", e);
    } finally {
      setLoadingProfile(false);
      setLoadingAuth(false);
    }
  };

  // Reusable refresh data helper
  const refreshData = async () => {
    if (token) {
      try {
        const d = new Date().toLocaleDateString('en-CA');
        const logsRes = await fetch(`${API_BASE}/meallog?date=${d}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logsRes.ok) setLogs(await logsRes.json());

        const allMealsRes = await fetch(`${API_BASE}/meallog`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (allMealsRes.ok) setAllMeals(await allMealsRes.json());

        const workoutsRes = await fetch(`${API_BASE}/workouts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (workoutsRes.ok) setWorkoutLogs(await workoutsRes.json());

        const analyticsRes = await fetch(`${API_BASE}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (analyticsRes.ok) setAnalyticsData(await analyticsRes.json());

        const planRes = await fetch(`${API_BASE}/generate`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData && planData.plan) {
            setActivePlan(planData);
            setShoppingItems(planData.shoppingList || []);
          }
        }
      } catch (err) {
        console.error("Failed to refresh app data:", err);
      }
    }
  };

  useEffect(() => {
    verifyToken();
  }, [token]);

  if (loadingAuth) {
    return <div className="app-loading">Loading BiteBuddy...</div>;
  }

  // Guest view: Force Login / Register
  if (!token || !user) {
    if (authView === 'login') {
      return (
        <Login
          API_BASE={API_BASE}
          onLoginSuccess={handleLoginSuccess}
          navigateToRegister={() => setAuthView('register')}
        />
      );
    } else {
      return (
        <Register
          API_BASE={API_BASE}
          onRegisterSuccess={handleLoginSuccess}
          navigateToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  // Authenticated but onboarding incomplete: force Onboarding page (no sidebar)
  if (!profile) {
    return (
      <Onboarding
        API_BASE={API_BASE}
        token={token}
        onComplete={() => verifyToken()}
      />
    );
  }

  // Standard Routing
  const renderPage = () => {
    const props = {
      profile,
      setProfile,
      activePlan,
      setActivePlan,
      plan: activePlan ? activePlan.plan : {},
      shopping: shoppingItems, setShoppingItems,
      checkedItems, setCheckedItems,
      logs,
      setLogs,
      allMeals,
      setAllMeals,
      workoutLogs,
      setWorkoutLogs,
      analyticsData,
      setAnalyticsData,
      refreshData,
      API_BASE,
      token,
      user,
      onLogout: handleLogout,
      navigateTo: setCurrentPage,
      openQuickFoodEntry: () => setIsQuickFoodOpen(true)
    };

    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'foodlog': return <FoodLog {...props} />;
      case 'scanner': return <FoodScanner {...props} />;
      case 'planner': return <MealPlanner {...props} />;
      case 'nutrition': return <Nutrition {...props} />;
      case 'shopping': return <Shopping {...props} />;
      case 'coach': return <AICoach {...props} />;
      case 'goals': return <Goals {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'workouts': return <WorkoutLog {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentPage={currentPage}
        navigateTo={setCurrentPage}
      />

      <main className="app-content">
        <div className="app-page-wrapper">
          {renderPage()}
        </div>
      </main>

      <MobileNav
        currentPage={currentPage}
        navigateTo={setCurrentPage}
      />

      <button className="floating-add-btn" onClick={() => setIsQuickFoodOpen(true)} title="Quick Food Entry">
        <Plus size={24} />
      </button>

      {isQuickFoodOpen && (
        <QuickFoodEntryModal
          isOpen={isQuickFoodOpen}
          onClose={() => setIsQuickFoodOpen(false)}
          logs={logs}
          setLogs={setLogs}
          activePlan={activePlan}
          setActivePlan={setActivePlan}
          setShoppingItems={setShoppingItems}
          API_BASE={API_BASE}
          token={token}
        />
      )}
    </div>
  );
}

export default App;
