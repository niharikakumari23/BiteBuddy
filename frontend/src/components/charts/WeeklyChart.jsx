import React from 'react';
import './WeeklyChart.css';

export const WeeklyChart = ({ data = [], height = 150 }) => {
  // data format: [{ day: 'Mon', value: 1800, target: 2000 }, ...]
  
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.value, d.target || 0)), 
    2500 // default min max
  );
  
  return (
    <div className="weekly-chart" style={{ height }}>
      <div className="weekly-chart-bars">
        {data.map((item, index) => {
          const heightPercent = Math.min((item.value / maxValue) * 100, 100);
          const isOver = item.target && item.value > item.target;
          
          return (
            <div key={index} className="weekly-chart-col">
              <div className="weekly-chart-bar-container">
                <div 
                  className={`weekly-chart-bar ${isOver ? 'weekly-chart-bar-over' : ''}`}
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="weekly-chart-tooltip">
                    {item.value} kcal
                  </div>
                </div>
                {item.target && (
                  <div 
                    className="weekly-chart-target-line"
                    style={{ bottom: `${(item.target / maxValue) * 100}%` }}
                  />
                )}
              </div>
              <span className="weekly-chart-label">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
