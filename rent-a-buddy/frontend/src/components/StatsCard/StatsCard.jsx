// src/components/StatsCard/StatsCard.jsx
import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './StatsCard.scss';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'up', // 'up', 'down', or 'neutral'
  color = 'primary',
  loading = false,
  error = null,
  onRetry 
}) => {
  const getColorClass = () => {
    switch(color) {
      case 'earning':
        return 'earning';
      case 'tours':
        return 'tours';
      case 'rating':
        return 'rating';
      case 'response':
        return 'response';
      default:
        return 'primary';
    }
  };

  const getTrendIcon = () => {
    switch(trendDirection) {
      case 'up':
        return <FaArrowUp className="trend-icon" />;
      case 'down':
        return <FaArrowDown className="trend-icon" />;
      case 'neutral':
        return <FaMinus className="trend-icon" />;
      default:
        return <FaArrowUp className="trend-icon" />;
    }
  };

  const colorClass = getColorClass();

  if (loading) {
    return (
      <div className="stats-card loading">
        <div className="skeleton-icon"></div>
        <div className="skeleton-content">
          <div className="skeleton-line large"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-card error">
        <div className="error-content">
          <div className="error-icon">!</div>
          <p className="error-text">Failed to load</p>
          {onRetry && (
            <button className="retry-btn" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`stats-card ${colorClass}`}>
      <div className="stat-decoration"></div>
      <div className="stat-icon-container">
        <div className="stat-icon">
          {icon}
        </div>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {trend && (
          <span className="stat-trend">
            {getTrendIcon()}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;