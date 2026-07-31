import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, radius = 'md', className = '' }) => {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: `var(--radius-${radius})`
  };

  return (
    <div className={`skeleton ${className}`} style={style} />
  );
};
