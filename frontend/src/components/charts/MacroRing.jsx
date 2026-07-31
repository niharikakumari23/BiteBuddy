import React from 'react';
import './MacroRing.css';

export const MacroRing = ({ 
  calories = { current: 0, target: 2000 },
  protein = { current: 0, target: 150 },
  carbs = { current: 0, target: 200 },
  fat = { current: 0, target: 65 },
  size = 200 
}) => {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth * 4) / 2;
  const center = size / 2;
  
  const calculateStrokeDasharray = (current, target, r) => {
    const circumference = 2 * Math.PI * r;
    const percentage = Math.min(current / (target || 1), 1);
    return `${percentage * circumference} ${circumference}`;
  };

  const macros = [
    { key: 'calories', data: calories, color: 'var(--color-calories)', r: radius + strokeWidth * 1.5 },
    { key: 'protein', data: protein, color: 'var(--color-protein)', r: radius },
    { key: 'carbs', data: carbs, color: 'var(--color-carbs)', r: radius - strokeWidth * 1.5 },
    { key: 'fat', data: fat, color: 'var(--color-fat)', r: radius - strokeWidth * 3 }
  ];

  return (
    <div className="macro-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Rings */}
        {macros.map((macro, i) => (
          <circle
            key={`bg-${macro.key}`}
            cx={center}
            cy={center}
            r={macro.r}
            stroke={macro.color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.2"
          />
        ))}
        
        {/* Progress Rings */}
        {macros.map((macro, i) => (
          <circle
            key={`progress-${macro.key}`}
            cx={center}
            cy={center}
            r={macro.r}
            stroke={macro.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={calculateStrokeDasharray(macro.data.current, macro.data.target, macro.r)}
            className="macro-ring-progress"
            style={{ 
              transformOrigin: 'center',
              transform: 'rotate(-90deg)'
            }}
          />
        ))}
      </svg>
      
      <div className="macro-ring-center">
        <span className="macro-ring-value">{calories.current}</span>
        <span className="macro-ring-label">/ {calories.target} kcal</span>
      </div>
    </div>
  );
};
