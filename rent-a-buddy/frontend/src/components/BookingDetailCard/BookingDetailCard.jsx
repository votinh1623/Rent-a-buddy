// src/components/BookingDetailCard/BookingDetailCard.jsx
import React, { useState } from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaUsers,
  FaMoneyBillWave,
  FaComment,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import './BookingDetailCard.scss';

const BookingDetailCard = ({
  booking,
  onClose,
  onConfirm,
  onReject,
  onComplete,
  isLoading = false,
  userRole = 'tour-guide' // 'tour-guide' or 'traveller'
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState({
    confirm: false,
    reject: false,
    complete: false
  });

  if (!booking) {
    return (
      <div className="booking-detail-card no-data">
        <div className="empty-state">
          <FaInfoCircle size={48} />
          <h3>No Booking Details</h3>
          <p>No booking information available</p>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'pending':
        return 'pending';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const statusColor = getStatusColor(booking.status);
  const isTourGuide = userRole === 'tour-guide';

  // Check if booking can be confirmed (only for pending bookings)
  const canConfirm = booking.status === 'pending' && isTourGuide;
  
  // Check if booking can be rejected (only for pending bookings)
  const canReject = booking.status === 'pending' && isTourGuide;
  
  // Check if booking can be marked as completed (only for confirmed bookings that have started)
  const canComplete = booking.status === 'confirmed' && isTourGuide;
  const isUpcoming = new Date(booking.startDate) > new Date();
  const isPast = new Date(booking.endDate) < new Date();

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setActionLoading(prev => ({ ...prev, confirm: true }));
    try {
      await onConfirm(booking._id);
    } finally {
      setActionLoading(prev => ({ ...prev, confirm: false }));
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(prev => ({ ...prev, reject: true }));
    try {
      await onReject(booking._id, rejectReason);
      setShowRejectForm(false);
      setRejectReason('');
    } finally {
      setActionLoading(prev => ({ ...prev, reject: false }));
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      alert('Please add completion notes');
      return;
    }

    setActionLoading(prev => ({ ...prev, complete: true }));
    try {
      await onComplete(booking._id, completionNotes);
      setShowCompleteForm(false);
      setCompletionNotes('');
    } finally {
      setActionLoading(prev => ({ ...prev, complete: false }));
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTimeRemaining = () => {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const diffMs = startDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffMs < 0) return 'Started';
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  };

  return (
    <div className="booking-detail-card">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <h3>Booking Details</h3>
          <div className={`status-badge large ${statusColor}`}>
            {booking.status?.toUpperCase()}
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      {/* Booking Information */}
      <div className="detail-content">
        {/* Guest Information */}
        <div className="info-section">
          <h4 className="section-title">
            <FaUser /> Guest Information
          </h4>
          <div className="guest-info">
            <div className="guest-avatar">
              {booking.traveller?.pfp ? (
                <img 
                  src={booking.traveller.pfp} 
                  alt={booking.traveller.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.traveller?.name || 'Guest')}&background=667eea&color=fff`;
                  }}
                />
              ) : (
                <div className="avatar-fallback">
                  {booking.traveller?.name?.charAt(0) || 'G'}
                </div>
              )}
            </div>
            <div className="guest-details">
              <h5>{booking.traveller?.name || 'Guest'}</h5>
              {booking.traveller?.email && (
                <div className="contact-info">
                  <FaEnvelope />
                  <span>{booking.traveller.email}</span>
                </div>
              )}
              {booking.traveller?.phoneNumber && (
                <div className="contact-info">
                  <FaPhone />
                  <span>{booking.traveller.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="info-section">
          <h4 className="section-title">
            <FaCalendarAlt /> Booking Details
          </h4>
          <div className="detail-grid">
            <div className="detail-item">
              <FaCalendarAlt className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Start Date & Time</span>
                <span className="detail-value">{formatDateTime(booking.startDate)}</span>
              </div>
            </div>

            <div className="detail-item">
              <FaClock className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Duration</span>
                <span className="detail-value">{booking.duration || 4} hours</span>
              </div>
            </div>

            {booking.startTime && (
              <div className="detail-item">
                <FaClock className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Start Time</span>
                  <span className="detail-value">{booking.startTime}</span>
                </div>
              </div>
            )}

            <div className="detail-item">
              <FaUsers className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Number of People</span>
                <span className="detail-value">{booking.numberOfPeople || 1} person(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination Information */}
        <div className="info-section">
          <h4 className="section-title">
            <FaMapMarkerAlt /> Destination
          </h4>
          <div className="destination-info">
            {booking.destination?.coverImg && (
              <div className="destination-image">
                <img 
                  src={booking.destination.coverImg} 
                  alt={booking.destination.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="destination-details">
              <h5>{booking.destination?.name || 'Tour Destination'}</h5>
              {booking.destination?.address && (
                <p className="destination-address">{booking.destination.address}</p>
              )}
              {booking.destination?.city && (
                <p className="destination-city">{booking.destination.city}</p>
              )}
            </div>
          </div>
        </div>

        {/* Activities */}
        {booking.activities && booking.activities.length > 0 && (
          <div className="info-section">
            <h4 className="section-title">Selected Activities</h4>
            <div className="activities-list">
              {booking.activities.map((activity, index) => (
                <div key={activity._id || index} className="activity-item">
                  <div className="activity-name">{activity.name}</div>
                  {activity.description && (
                    <div className="activity-description">{activity.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="info-section">
            <h4 className="section-title">
              <FaComment /> Special Requests
            </h4>
            <div className="special-requests-content">
              <p>{booking.specialRequests}</p>
            </div>
          </div>
        )}

        {/* Payment Information */}
        <div className="info-section">
          <h4 className="section-title">
            <FaMoneyBillWave /> Payment Information
          </h4>
          <div className="payment-info">
            <div className="payment-row">
              <span className="payment-label">Total Price:</span>
              <span className="payment-value">{formatCurrency(booking.totalPrice || booking.price || 0)}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Payment Method:</span>
              <span className="payment-value">
                {booking.paymentMethod === 'cash' ? 'Cash (Pay at location)' : 
                 booking.paymentMethod === 'credit_card' ? 'Credit Card' :
                 booking.paymentMethod === 'paypal' ? 'PayPal' :
                 booking.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                 booking.paymentMethod}
              </span>
            </div>
            {booking.paymentStatus && (
              <div className="payment-row">
                <span className="payment-label">Payment Status:</span>
                <span className={`payment-status ${booking.paymentStatus}`}>
                  {booking.paymentStatus.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time Status */}
        {isTourGuide && (
          <div className="info-section time-status">
            <h4 className="section-title">
              <FaClock /> Time Status
            </h4>
            <div className="time-info">
              {booking.status === 'pending' && isUpcoming && (
                <div className="time-item upcoming">
                  <FaExclamationTriangle />
                  <div>
                    <strong>Time Remaining:</strong> {calculateTimeRemaining()} until start
                  </div>
                </div>
              )}
              {booking.status === 'confirmed' && isPast && (
                <div className="time-item past">
                  <FaInfoCircle />
                  <div>
                    <strong>Tour Completed:</strong> This tour has ended
                  </div>
                </div>
              )}
              {booking.status === 'confirmed' && isUpcoming && (
                <div className="time-item upcoming">
                  <FaClock />
                  <div>
                    <strong>Starts in:</strong> {calculateTimeRemaining()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Only for tour guide */}
      {isTourGuide && (
        <div className="detail-actions">
          {/* Confirm Button - Only for pending bookings */}
          {canConfirm && (
            <button
              className={`action-btn confirm-btn ${actionLoading.confirm ? 'loading' : ''}`}
              onClick={handleConfirm}
              disabled={actionLoading.confirm || isLoading}
            >
              {actionLoading.confirm ? (
                <>
                  <FaSpinner className="spinner" />
                  Confirming...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Confirm Booking
                </>
              )}
            </button>
          )}

          {/* Reject Button - Only for pending bookings */}
          {canReject && (
            <>
              {showRejectForm ? (
                <form className="reject-form" onSubmit={handleRejectSubmit}>
                  <div className="form-group">
                    <label htmlFor="rejectReason">
                      <FaTimesCircle /> Reason for Rejection *
                    </label>
                    <textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please provide a detailed reason for rejecting this booking..."
                      rows="3"
                      required
                    />
                    <small>This will be shared with the traveller.</small>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      disabled={actionLoading.reject}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-reject-btn"
                      disabled={actionLoading.reject || !rejectReason.trim()}
                    >
                      {actionLoading.reject ? (
                        <>
                          <FaSpinner className="spinner" />
                          Rejecting...
                        </>
                      ) : (
                        'Submit Rejection'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="action-btn reject-btn"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading}
                >
                  <FaTimesCircle />
                  Reject Booking
                </button>
              )}
            </>
          )}

          {/* Complete Button - Only for confirmed past bookings */}
          {canComplete && isPast && (
            <>
              {showCompleteForm ? (
                <form className="complete-form" onSubmit={handleCompleteSubmit}>
                  <div className="form-group">
                    <label htmlFor="completionNotes">
                      <FaCheckCircle /> Completion Notes *
                    </label>
                    <textarea
                      id="completionNotes"
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="Add notes about the completed tour..."
                      rows="3"
                      required
                    />
                    <small>These notes will be saved for your records.</small>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowCompleteForm(false);
                        setCompletionNotes('');
                      }}
                      disabled={actionLoading.complete}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-complete-btn"
                      disabled={actionLoading.complete || !completionNotes.trim()}
                    >
                      {actionLoading.complete ? (
                        <>
                          <FaSpinner className="spinner" />
                          Completing...
                        </>
                      ) : (
                        'Mark as Completed'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="action-btn complete-btn"
                  onClick={() => setShowCompleteForm(true)}
                  disabled={isLoading}
                >
                  <FaCheckCircle />
                  Mark as Completed
                </button>
              )}
            </>
          )}

          {/* View Tour Details Button - For completed bookings */}
          {booking.status === 'completed' && (
            <button className="action-btn view-details-btn">
              <FaInfoCircle />
              View Tour Details
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingDetailCard;