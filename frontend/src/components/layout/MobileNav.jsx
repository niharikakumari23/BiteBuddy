import React from 'react';
import { Home, Camera, Calendar, PieChart, MessageSquare } from 'lucide-react';
import './MobileNav.css';

export const MobileNav = ({ currentPage, navigateTo }) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'planner', label: 'Plan', icon: Calendar },
    { id: 'scanner', label: 'Scan', icon: Camera, isPrimary: true },
    { id: 'nutrition', label: 'Stats', icon: PieChart },
    { id: 'coach', label: 'Coach', icon: MessageSquare },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-container">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                className="mobile-nav-primary-btn"
                onClick={() => navigateTo(item.id)}
              >
                <div className="mobile-nav-primary-icon">
                  <Icon size={24} color="white" />
                </div>
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigateTo(item.id)}
            >
              <Icon size={22} className="mobile-nav-icon" />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
