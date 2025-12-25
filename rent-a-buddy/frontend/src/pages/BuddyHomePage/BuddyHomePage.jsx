// src/pages/BuddyHomePage/BuddyHomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaComments, FaMoneyBillWave, FaStar, FaUsers, FaChartLine, FaBell, FaSearch, FaFilter } from 'react-icons/fa';
import './BuddyHomePage.scss';

function BuddyHomePage() {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 1250,
    completedTours: 18,
    averageRating: 4.8,
    responseRate: 95
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // Mock data - thay thế bằng API calls thực tế
  useEffect(() => {
    // Mock upcoming bookings
    setUpcomingBookings([
      {
        id: 1,
        guestName: "John Smith",
        date: "2024-12-20",
        time: "09:00 AM",
        duration: "4 hours",
        tourType: "Food Tour",
        status: "confirmed",
        price: 100
      },
      {
        id: 2,
        guestName: "Emma Wilson",
        date: "2024-12-22",
        time: "02:00 PM",
        duration: "3 hours",
        tourType: "Historical Tour",
        status: "pending",
        price: 75
      },
      {
        id: 3,
        guestName: "Carlos Gomez",
        date: "2024-12-25",
        time: "10:00 AM",
        duration: "5 hours",
        tourType: "Photography Tour",
        status: "confirmed",
        price: 125
      }
    ]);

    // Mock recent messages
    setRecentMessages([
      {
        id: 1,
        sender: "Sarah Johnson",
        message: "Hi! I'm interested in your food tour next week...",
        time: "2 hours ago",
        unread: true
      },
      {
        id: 2,
        sender: "Michael Brown",
        message: "Thanks for the amazing tour yesterday!",
        time: "1 day ago",
        unread: false
      },
      {
        id: 3,
        sender: "Traveler #1245",
        message: "Can you customize a tour for a family of 4?",
        time: "3 days ago",
        unread: false
      }
    ]);
  }, []);

  const handleToggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast.success(`You are now ${!isAvailable ? 'available' : 'unavailable'} for bookings`);
  };

  const handleViewAllBookings = () => {
    navigate('/buddy/bookings');
  };

  const handleViewAllMessages = () => {
    navigate('/buddy/messages');
  };

  const handleCompleteVerification = () => {
    // API call to complete verification
    setIsVerified(true);
    toast.success("Verification submitted successfully!");
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleEditProfile = () => {
    navigate('/buddy/edit-profile');
  };

  const handleViewEarnings = () => {
    navigate('/buddy/earnings');
  };

  const handleManageSchedule = () => {
    navigate('/buddy/schedule');
  };

  return (
    <div className="buddy-home-page">
      {/* Header */}
      <header className="buddy-header">
        <div className="header-left">
          <h1>Buddy Dashboard</h1>
          <p className="welcome-text">Welcome back! Ready for new adventures?</p>
        </div>
        <div className="header-right">
          <div className="availability-toggle">
            <span className="availability-status">
              Status: <span className={isAvailable ? 'available' : 'unavailable'}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </span>
            <button 
              className={`toggle-btn ${isAvailable ? 'active' : ''}`}
              onClick={handleToggleAvailability}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
          <button className="notification-btn">
            <FaBell />
            <span className="badge">3</span>
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon earnings">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <h3>${stats.totalEarnings}</h3>
            <p>Total Earnings</p>
            <span className="trend positive">+12% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tours">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.completedTours}</h3>
            <p>Completed Tours</p>
            <span className="trend positive">+3 this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">
            <FaStar />
          </div>
          <div className="stat-content">
            <h3>{stats.averageRating}</h3>
            <p>Average Rating</p>
            <span className="trend positive">From 24 reviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon response">
            <FaComments />
          </div>
          <div className="stat-content">
            <h3>{stats.responseRate}%</h3>
            <p>Response Rate</p>
            <span className="trend positive">Excellent</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column */}
        <div className="left-column">
          {/* Quick Actions */}
          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn" onClick={handleEditProfile}>
                <span className="btn-icon">✏️</span>
                Edit Profile
              </button>
              <button className="action-btn" onClick={handleManageSchedule}>
                <span className="btn-icon"><FaCalendarAlt /></span>
                Manage Schedule
              </button>
              <button className="action-btn" onClick={handleViewEarnings}>
                <span className="btn-icon"><FaChartLine /></span>
                View Earnings
              </button>
              <button className="action-btn" onClick={handleViewProfile}>
                <span className="btn-icon">👤</span>
                View Public Profile
              </button>
            </div>
          </section>

          {/* Upcoming Bookings */}
          <section className="upcoming-bookings">
            <div className="section-header">
              <h2>Upcoming Bookings</h2>
              <button className="view-all-btn" onClick={handleViewAllBookings}>
                View All
              </button>
            </div>
            <div className="bookings-list">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                    <span className="booking-date">{booking.date}</span>
                  </div>
                  <div className="booking-details">
                    <h4>{booking.guestName}</h4>
                    <p>{booking.tourType} · {booking.duration}</p>
                    <div className="booking-footer">
                      <span className="booking-time">{booking.time}</span>
                      <span className="booking-price">${booking.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Verification Status */}
          {!isVerified && (
            <section className="verification-banner">
              <h3>Complete Your Verification</h3>
              <p>Verify your identity to get more bookings and increase trust</p>
              <div className="verification-steps">
                <span className="step completed">✓ Phone Verified</span>
                <span className="step pending">ID Verification</span>
                <span className="step pending">Background Check</span>
              </div>
              <button className="verify-btn" onClick={handleCompleteVerification}>
                Complete Verification
              </button>
            </section>
          )}

          {/* Recent Messages */}
          <section className="recent-messages">
            <div className="section-header">
              <h2>Recent Messages</h2>
              <button className="view-all-btn" onClick={handleViewAllMessages}>
                View All
              </button>
            </div>
            <div className="messages-list">
              {recentMessages.map(message => (
                <div key={message.id} className="message-item">
                  <div className="message-header">
                    <span className={`sender-name ${message.unread ? 'unread' : ''}`}>
                      {message.sender}
                    </span>
                    <span className="message-time">{message.time}</span>
                  </div>
                  <p className="message-preview">{message.message}</p>
                  {message.unread && <span className="unread-dot"></span>}
                </div>
              ))}
            </div>
          </section>

          {/* Tips & Resources */}
          <section className="tips-section">
            <h2>Tips for Success</h2>
            <div className="tip-card">
              <h4>📸 Update Your Photos</h4>
              <p>Guests are 3x more likely to book with guides who have quality photos.</p>
            </div>
            <div className="tip-card">
              <h4>⏰ Quick Responses</h4>
              <p>Respond within 2 hours to increase your booking chances by 50%.</p>
            </div>
            <div className="tip-card">
              <h4>⭐ Collect Reviews</h4>
              <p>Ask satisfied guests to leave reviews after each tour.</p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section */}
      <section className="bottom-section">
        <div className="search-guests">
          <h2>Find New Guests</h2>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by tour type, location, or date..."
            />
            <button className="search-btn">
              <FaFilter /> Filter
            </button>
          </div>
        </div>

        <div className="performance-metrics">
          <h2>Your Performance</h2>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Booking Rate</span>
              <span className="metric-value">68%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div className="metric">
              <span className="metric-label">Guest Satisfaction</span>
              <span className="metric-value">92%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="metric">
              <span className="metric-label">Repeat Guests</span>
              <span className="metric-value">24%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BuddyHomePage;