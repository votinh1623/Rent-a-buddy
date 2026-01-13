// src/components/ErrorRetry/ErrorRetry.jsx
import React from 'react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';
import './ErrorRetry.scss';

const ErrorRetry = ({ 
  message = 'Something went wrong', 
  onRetry, 
  type = 'warning',
  retryLabel = 'Try Again'
}) => {
  const getTypeStyles = () => {
    switch(type) {
      case 'error':
        return {
          bgColor: 'error-bg',
          iconColor: '#f56565',
          icon: <FaExclamationTriangle />
        };
      case 'warning':
        return {
          bgColor: 'warning-bg',
          iconColor: '#ed8936',
          icon: <FaExclamationTriangle />
        };
      case 'info':
        return {
          bgColor: 'info-bg',
          iconColor: '#4299e1',
          icon: <FaExclamationTriangle />
        };
      default:
        return {
          bgColor: 'warning-bg',
          iconColor: '#ed8936',
          icon: <FaExclamationTriangle />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`error-retry-container ${styles.bgColor}`}>
      <div className="error-content">
        <div className="error-icon" style={{ color: styles.iconColor }}>
          {styles.icon}
        </div>
        <div className="error-details">
          <h4 className="error-title">Oops! Something went wrong</h4>
          <p className="error-message">{message}</p>
          {onRetry && (
            <button 
              className="retry-button"
              onClick={onRetry}
            >
              <FaSync className="retry-icon" />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorRetry;