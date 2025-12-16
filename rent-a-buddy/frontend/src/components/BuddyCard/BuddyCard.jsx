// src/components/BuddyCard.jsx
import React from 'react';
import './BuddyCard.scss';

const BuddyCard = ({ buddy, onSelect }) => {
  if (!buddy) return null;

  // Helper functions
  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
        <span className="rating-number">{rating?.toFixed(1) || 0.0}</span>
        <span className="rating-count">({buddy.rating?.count || 0})</span>
      </div>
    );
  };

  const getFirstDestination = () => {
    if (buddy.relatedDestination && buddy.relatedDestination.length > 0) {
      const dest = buddy.relatedDestination[0];
      return typeof dest === 'object' ? dest : { name: 'Destination' };
    }
    return { name: 'Not specified' };
  };

  const getFirstActivity = () => {
    if (buddy.relatedActivities && buddy.relatedActivities.length > 0) {
      const activity = buddy.relatedActivities[0];
      return typeof activity === 'object' ? activity : { name: 'Activity' };
    }
    return { name: 'Not specified' };
  };

  const destination = getFirstDestination();
  const activity = getFirstActivity();

  return (
    <div className="buddy-card" onClick={onSelect}>
      {/* Top section with image and badges */}
      <div className="buddy-image-section">
        <img 
          src={buddy.pfp || `https://ui-avatars.com/api/?name=${buddy.name}&background=667eea&color=fff`}
          alt={buddy.name}
          className="buddy-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${buddy.name}&background=667eea&color=fff`;
          }}
        />
        
        {/* Online indicator */}
        {buddy.isAvailableNow && (
          <div className="online-indicator" title="Available now">
            <div className="online-dot"></div>
          </div>
        )}
        
        {/* Verified badge */}
        {buddy.isVerified && (
          <div className="verified-badge" title="Verified guide">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="buddy-content">
        <div className="buddy-header">
          <h3 className="buddy-name">{buddy.name}</h3>
          <div className="buddy-price">
            ${buddy.hourlyRate || 0}<span className="price-unit">/hour</span>
          </div>
        </div>

        {/* Rating */}
        <div className="buddy-rating">
          {renderRatingStars(buddy.rating?.average)}
        </div>

        {/* Destination */}
        <div className="buddy-location">
          <span className="location-icon">📍</span>
          <span className="location-text">{destination.name}</span>
        </div>

        {/* Activity */}
        <div className="buddy-activity">
          <span className="activity-icon">🎯</span>
          <span className="activity-text">{activity.name}</span>
        </div>

        {/* Bio preview */}
        {buddy.bio && (
          <p className="buddy-bio">
            {buddy.bio.length > 100 ? `${buddy.bio.substring(0, 100)}...` : buddy.bio}
          </p>
        )}

        {/* Languages */}
        {buddy.languages && buddy.languages.length > 0 && (
          <div className="buddy-languages">
            <span className="language-icon">🗣️</span>
            <div className="language-tags">
              {buddy.languages.slice(0, 2).map((lang, index) => (
                <span key={index} className="language-tag">
                  {lang}
                </span>
              ))}
              {buddy.languages.length > 2 && (
                <span className="language-tag">+{buddy.languages.length - 2}</span>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {buddy.yearsOfExperience > 0 && (
          <div className="buddy-experience">
            <span className="experience-icon">📅</span>
            <span className="experience-text">
              {buddy.yearsOfExperience} year{buddy.yearsOfExperience !== 1 ? 's' : ''} experience
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="buddy-stats">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{buddy.completedBookings || 0}</span>
            <span className="stat-label">Bookings</span>
          </div>
          {buddy.rating?.count > 0 && (
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{buddy.rating?.count}</span>
              <span className="stat-label">Reviews</span>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="buddy-actions">
          <button className="view-profile-btn" onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}>
            View Profile
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuddyCard;