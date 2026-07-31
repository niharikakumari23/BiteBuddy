import { 
  Home, 
  Camera, 
  Calendar, 
  PieChart, 
  ShoppingCart, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
  Clipboard,
  Dumbbell
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar = ({ isCollapsed, toggleCollapse, currentPage, navigateTo }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'workouts', label: 'Workout Tracker', icon: Dumbbell },
    { id: 'foodlog', label: 'Food Log', icon: Clipboard },
    { id: 'scanner', label: 'Food Scanner', icon: Camera },
    { id: 'planner', label: 'Meal Planner', icon: Calendar },
    { id: 'nutrition', label: 'Nutrition', icon: PieChart },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">B</div>
          {!isCollapsed && <span className="sidebar-logo-text">BiteBuddy</span>}
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigateTo(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="sidebar-nav-icon" size={20} />
              {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {isActive && !isCollapsed && <div className="sidebar-nav-active-indicator" />}
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button
          className={`sidebar-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => navigateTo('settings')}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="sidebar-nav-icon" size={20} />
          {!isCollapsed && <span className="sidebar-nav-label">Settings</span>}
        </button>
        
        {!isCollapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">N</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Niharika K.</span>
              <span className="sidebar-user-plan">Premium Plan</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
