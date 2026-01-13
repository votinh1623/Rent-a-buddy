// src/components/BookingCard/BookingCard.jsx
import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaChevronRight } from 'react-icons/fa';
import './BookingCard.scss';

const BookingCard = ({ 
  booking, 
  onClick,
  compact = false 
}) => {
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'pending':
        return 'pending';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const statusColor = getStatusColor(booking?.status);

  return (
    <div className={`booking-card ${compact ? 'compact' : ''}`} onClick={onClick}>
      <div className="booking-header">
        <div className="booking-status">
          <span className={`status-badge ${statusColor}`}>
            {booking?.status || 'Pending'}
          </span>
        </div>
        <div className="booking-date">
          <FaCalendarAlt className="date-icon" />
          <span>{booking?.date}</span>
        </div>
      </div>
      
      <div className="booking-content">
        <h4 className="guest-name">
          <FaUser className="guest-icon" />
          {booking?.guestName || 'Guest'}
        </h4>
        
        <div className="booking-details">
          <div className="detail-item">
            <FaMapMarkerAlt className="detail-icon" />
            <span className="detail-text">{booking?.tourType || 'Tour'}</span>
            {booking?.location && (
              <span className="location-text"> · {booking?.location}</span>
            )}
          </div>
          
          <div className="detail-item">
            <FaClock className="detail-icon" />
            <span className="detail-text">{booking?.time}</span>
            {booking?.duration && (
              <span className="duration-text"> · {booking?.duration}</span>
            )}
          </div>
          
          {booking?.specialRequests && !compact && (
            <div className="special-requests">
              <span className="requests-label">Special Requests:</span>
              <p className="requests-text">{booking.specialRequests}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="booking-footer">
        <div className="booking-price">
          ${booking?.price?.toLocaleString() || '0'}
        </div>
        <div className="booking-actions">
          <button className="view-details-btn">
            View Details
            <FaChevronRight className="arrow-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;