import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import './Toast.css';

const icons = {
  success: <CheckCircle className="toast-icon" size={20} />,
  error: <XCircle className="toast-icon" size={20} />,
  warning: <AlertTriangle className="toast-icon" size={20} />,
  info: <Info className="toast-icon" size={20} />
};

export const Toast = ({ id, title, message, type = 'info', onClose }) => {
  return (
    <div className={`toast toast-${type} animate-slide-in-right`}>
      <div className="toast-icon-wrapper">
        {icons[type]}
      </div>
      <div className="toast-content">
        {title && <h4 className="toast-title">{title}</h4>}
        {message && <p className="toast-message">{message}</p>}
      </div>
      <button className="toast-close" onClick={() => onClose(id)} aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
};
