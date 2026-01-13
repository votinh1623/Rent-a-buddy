// src/components/SkeletonLoader/SkeletonLoader.jsx
import React from 'react';
import './SkeletonLoader.scss';

const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch(type) {
      case 'buddyDashboard':
        return (
          <div className="skeleton-loader buddy-dashboard">
            {/* Header */}
            <div className="skeleton-header">
              <div className="skeleton-line large"></div>
              <div className="skeleton-line medium"></div>
            </div>
            
            {/* Stats */}
            <div className="skeleton-stats-grid">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton-stat">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line small"></div>
                    <div className="skeleton-line xsmall"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Content */}
            <div className="skeleton-main-content">
              {/* Left Column */}
              <div className="skeleton-left-column">
                {/* Quick Actions */}
                <div className="skeleton-section">
                  <div className="skeleton-line medium mb-2"></div>
                  <div className="skeleton-actions">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="skeleton-action"></div>
                    ))}
                  </div>
                </div>
                
                {/* Bookings */}
                <div className="skeleton-section">
                  <div className="skeleton-line medium mb-2"></div>
                  <div className="skeleton-bookings">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="skeleton-booking"></div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="skeleton-right-column">
                {/* Verification */}
                <div className="skeleton-section">
                  <div className="skeleton-line medium mb-2"></div>
                  <div className="skeleton-verification">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="skeleton-step"></div>
                    ))}
                  </div>
                </div>
                
                {/* Messages */}
                <div className="skeleton-section">
                  <div className="skeleton-line medium mb-2"></div>
                  <div className="skeleton-messages">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="skeleton-message"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'stats':
        return (
          <div className="skeleton-loader stats">
            {Array(count).fill(0).map((_, i) => (
              <div key={i} className="skeleton-stat-card">
                <div className="skeleton-stat-icon"></div>
                <div className="skeleton-stat-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line xshort"></div>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'booking':
        return (
          <div className="skeleton-loader bookings">
            {Array(count).fill(0).map((_, i) => (
              <div key={i} className="skeleton-booking-card">
                <div className="skeleton-booking-header">
                  <div className="skeleton-line xsmall"></div>
                  <div className="skeleton-line xsmall"></div>
                </div>
                <div className="skeleton-booking-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line xshort"></div>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'message':
        return (
          <div className="skeleton-loader messages">
            {Array(count).fill(0).map((_, i) => (
              <div key={i} className="skeleton-message-item">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-message-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <div className="skeleton-loader default">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;