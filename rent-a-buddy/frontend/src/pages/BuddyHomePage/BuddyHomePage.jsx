// src/pages/BuddyHomePage/BuddyHomePage.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaComments,
  FaMoneyBillWave,
  FaStar,
  FaUsers,
  FaChartLine,
  FaBell,
  FaBolt,
  FaSearch,
  FaFilter,
  FaRedo,
  FaExclamationCircle,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaEdit,
  FaWallet,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard,
  FaShieldAlt,
  FaLightbulb,
  FaTrophy,
  FaHeart,
  FaSync,
  FaChevronRight,
  FaCalendarDay,
  FaEnvelope
} from 'react-icons/fa';
// import { FaUser } from 'react-icons/fa';
import './BuddyHomePage.scss';

// API service
import api from '../../api.js';

// // Components
import BookingDetailCard from '../../components/BookingDetailCard/BookingDetailCard.jsx';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import ErrorRetry from '../../components/ErrorRetry/ErrorRetry';
import StatsCard from '../../components/StatsCard/StatsCard';
import BookingCard from '../../components/BookingCard/BookingCard';
import MessageItem from '../../components/MessageItem/MessageItem';

function BuddyHomePage() {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState({
    profile: true,
    stats: true,
    bookings: true,
    messages: true
  });
  // Thêm ref ở trên cùng các state
  const isInitialMount = useRef(true);


  const [errors, setErrors] = useState({
    profile: null,
    stats: null,
    bookings: null,
    messages: null
  });
  // Thêm state và hàm handler trong BuddyHomePage
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);

  // 2. Fetch buddy statistics - SỬA ENDPOINT
  const fetchBuddyStats = useCallback(async () => {
    try {
      setLoadingSections(prev => ({ ...prev, stats: true }));
      setErrors(prev => ({ ...prev, stats: null }));

      console.log('Fetching buddy stats...');
      // Sử dụng endpoint mới: /api/buddies/my/stats
      const response = await api.get('/buddies/my/stats');
      console.log('Stats response:', response.data);

      if (response.data.success) {
        const statsData = response.data.data;
        setStats({
          totalEarnings: statsData.totalEarnings || 0,
          completedTours: statsData.completedTours || 0,
          averageRating: statsData.averageRating || 0,
          responseRate: statsData.responseRate || 0,
          pendingBookings: statsData.pendingBookings || 0,
          cancellationRate: statsData.cancellationRate || 0,
          totalBookings: statsData.totalBookings || 0,
          monthlyEarnings: statsData.monthlyEarnings || 0,
          ranking: statsData.ranking,
          weeklyEarnings: statsData.weeklyEarnings || 0,
          todayBookings: statsData.todayBookings || 0
        });

        // Cập nhật verification status
        if (statsData.buddyInfo) {
          setBuddyProfile(prev => ({
            ...prev,
            isAvailableNow: statsData.buddyInfo.isAvailableNow,
            isVerified: statsData.buddyInfo.isVerified,
            verificationStatus: statsData.buddyInfo.verificationStatus
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load statistics';
      setErrors(prev => ({ ...prev, stats: message }));

      if (error.response?.status === 401) {
        toast.error('Please login again');
      } else {
        toast.error('Failed to load statistics');
      }
    } finally {
      setLoadingSections(prev => ({ ...prev, stats: false }));
    }
  }, []);
  // Thêm hàm xử lý khi click vào booking
  const handleBookingClick = useCallback((booking) => {
    // Fetch full booking details từ API
    const fetchBookingDetails = async () => {
      try {
        const response = await api.get(`/bookings/${booking.id}`);
        if (response.data.success) {
          setSelectedBooking(response.data.data);
          setShowBookingDetail(true);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        // Fallback: sử dụng data đã có
        setSelectedBooking(booking);
        setShowBookingDetail(true);
      }
    };

    fetchBookingDetails();
  }, []);

  const [buddyProfile, setBuddyProfile] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedTours: 0,
    averageRating: 0,
    responseRate: 0,
    pendingBookings: 0,
    cancellationRate: 0,
    totalBookings: 0,
    monthlyEarnings: 0,
    ranking: null
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const dropdownRef = useRef(null);
  // Format time ago helper
  const formatTimeAgo = useCallback((date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);
  // Format last refreshed time
  const formatLastRefreshed = useCallback(() => {
    return lastRefreshed.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastRefreshed]);
  // Memoized calculations
  const performanceMetrics = useMemo(() => ({
    bookingRate: stats.totalBookings > 0
      ? Math.round((stats.completedTours / stats.totalBookings) * 100)
      : 0,
    satisfactionRate: Math.round((stats.averageRating / 5) * 100),
    cancellationRate: Math.min(100, Math.round(stats.cancellationRate || 0))
  }), [stats]);

  const verificationStatus = useMemo(() => {
    if (!buddyProfile) return { completed: 0, total: 4 };

    const steps = [
      buddyProfile.emailVerified,
      buddyProfile.phoneVerified,
      buddyProfile.idVerified,
      buddyProfile.backgroundCheckVerified
    ];

    return {
      completed: steps.filter(Boolean).length,
      total: steps.length,
      steps: [
        { name: 'Email', completed: buddyProfile.emailVerified, icon: <FaEnvelope /> },
        { name: 'Phone', completed: buddyProfile.phoneVerified, icon: <FaPhone /> },
        { name: 'ID', completed: buddyProfile.idVerified, icon: <FaIdCard /> },
        { name: 'Background', completed: buddyProfile.backgroundCheckVerified, icon: <FaShieldAlt /> }
      ]
    };
  }, [buddyProfile]);
  // 4. Fetch recent messages - THÊM TRY-CATCH
  const fetchRecentMessages = useCallback(async () => {
    try {
      setLoadingSections(prev => ({ ...prev, messages: true }));
      setErrors(prev => ({ ...prev, messages: null }));

      console.log('Fetching recent messages...');
      let response;

      try {
        // Thử endpoint conversations/recent trước
        response = await api.get('/conversations/recent?limit=3');
      } catch (err) {
        // Fallback về endpoint conversations
        response = await api.get('/conversations?limit=3');
      }

      console.log('Messages response:', response.data);

      if (response.data.success) {
        const conversations = response.data.data || response.data.conversations || [];
        const messages = conversations.slice(0, 3).map(conversation => {
          console.log('Processing conversation:', conversation); // DEBUG

          return {
            id: conversation._id || conversation.id,
            // CHỈNH SỬA: conversation trực tiếp, không transform
            ...conversation,
            sender: conversation.otherParticipant?.name || 'User',
            senderAvatar: conversation.otherParticipant?.avatar || conversation.otherParticipant?.pfp,
            message: conversation.lastMessage?.text || conversation.lastMessage?.content || 'New conversation',
            time: formatTimeAgo(new Date(conversation.lastActivity || conversation.createdAt)),
            unread: conversation.unreadCount > 0,
            conversationId: conversation._id || conversation.id
          };
        });

        setRecentMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load messages';
      setErrors(prev => ({ ...prev, messages: message }));
      // Không toast để tránh spam
    } finally {
      setLoadingSections(prev => ({ ...prev, messages: false }));
    }
  }, [formatTimeAgo]);
  const fetchBuddyProfile = useCallback(async () => {
    try {
      setLoadingSections(prev => ({ ...prev, profile: true }));
      setErrors(prev => ({ ...prev, profile: null }));

      console.log('Fetching buddy profile...');
      const response = await api.get('/buddies/my/profile/me');
      console.log('Profile response:', response.data);

      if (response.data.success) {
        const profileData = response.data.data;

        // ĐẢM BẢO CÓ FIELD isAvailableNow
        if (profileData.isAvailableNow === undefined) {
          console.warn('isAvailableNow field missing in response, setting default to true');
          profileData.isAvailableNow = true;
        }

        setBuddyProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching buddy profile:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load profile';
      setErrors(prev => ({ ...prev, profile: message }));

      if (error.response?.status === 401) {
        toast.error('Please login again');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Only buddies can access this page');
        navigate('/');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoadingSections(prev => ({ ...prev, profile: false }));
    }
  }, [navigate]);

  // 3. Fetch upcoming bookings - SỬA LẠI ĐỂ TRÁNH INFINITE LOOP
  const fetchUpcomingBookings = useCallback(async () => {
    try {
      setLoadingSections(prev => ({ ...prev, bookings: true }));
      setErrors(prev => ({ ...prev, bookings: null }));

      console.log('Fetching upcoming bookings...');

      // Lấy userId từ currentUser trong localStorage
      const userId = currentUser?._id;

      if (!userId) {
        console.log('No user ID available for fetching bookings');
        setErrors(prev => ({ ...prev, bookings: 'User ID not found' }));
        return;
      }

      console.log('Fetching bookings for user ID:', userId);

      let response;
      try {
        // Sử dụng endpoint đúng với userId và role=tour-guide
        response = await api.get(`/bookings/user/${userId}?role=tour-guide&limit=10`);
      } catch (err) {
        console.log('Primary endpoint failed:', err.message);

        // Fallback: thử endpoint alternative
        try {
          response = await api.get('/bookings/my-bookings?limit=10');
        } catch (err2) {
          console.log('Fallback endpoint failed:', err2.message);
          throw new Error('No booking endpoints available');
        }
      }

      console.log('Bookings API response:', response.data);

      if (response.data.success) {
        const now = new Date();
        const bookingsData = response.data.data || response.data.bookings || [];

        console.log('Raw bookings data:', bookingsData);

        const upcoming = bookingsData
          .filter(booking => {
            if (!booking.startDate) return false;
            const bookingDate = new Date(booking.startDate);
            // Lọc bookings trong tương lai
            return bookingDate > now;
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3)
          .map(booking => ({
            id: booking._id || booking.id,
            guestName: booking.traveller?.name || 'Guest',
            guestAvatar: booking.traveller?.pfp || booking.traveller?.avatar,
            date: new Date(booking.startDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            time: booking.startTime || new Date(booking.startDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            duration: `${booking.duration || 4}h`,
            tourType: booking.destination?.name || 'Tour',
            location: booking.destination?.city || booking.destination?.location || 'City Tour',
            status: booking.status || 'confirmed',
            price: booking.totalPrice || 0,
            specialRequests: booking.specialRequests,
            bookingDate: booking.startDate,
            destinationImage: booking.destination?.coverImg,
            guestCount: booking.numberOfPeople || 1
          }));

        console.log('Processed upcoming bookings:', upcoming);
        setUpcomingBookings(upcoming);

        if (upcoming.length === 0) {
          console.log('No upcoming bookings found');
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load bookings';
      setErrors(prev => ({ ...prev, bookings: message }));
      toast.error('Failed to load bookings');
    } finally {
      setLoadingSections(prev => ({ ...prev, bookings: false }));
    }
  }, [currentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all data with retry logic

  // Fetch buddy profile
  // 1. Fetch buddy profile
  // 1. Fetch buddy profile - SỬA ENDPOINT




  // Thêm hàm xử lý booking actions
  const handleBookingAction = useCallback(async (action, bookingId, data) => {
    setIsProcessingBooking(true);
    try {
      let endpoint = '';
      let method = 'PATCH';

      switch (action) {
        case 'confirm':
          endpoint = `/bookings/${bookingId}/confirm`;
          break;
        case 'reject':
          endpoint = `/bookings/${bookingId}/reject`;
          break;
        case 'complete':
          endpoint = `/bookings/${bookingId}/complete`;
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api[method.toLowerCase()](endpoint, data);

      if (response.data.success) {
        toast.success(response.data.message);

        // Refresh bookings data
        await fetchUpcomingBookings();
        await fetchBuddyStats();

        // Close detail modal
        setShowBookingDetail(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error(`Error ${action} booking:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setIsProcessingBooking(false);
    }
  }, [fetchUpcomingBookings, fetchBuddyStats]);



  // Fetch recent messages
  // const fetchRecentMessages = useCallback(async () => {
  //   try {
  //     setLoadingSections(prev => ({ ...prev, messages: true }));
  //     setErrors(prev => ({ ...prev, messages: null }));

  //     const response = await api.get('/messages/recent?limit=3');
  //     if (response.data.success) {
  //       setRecentMessages(response.data.data.map(message => ({
  //         id: message._id,
  //         sender: message.sender?.name || 'User',
  //         senderAvatar: message.sender?.avatar,
  //         message: message.content,
  //         time: formatTimeAgo(new Date(message.createdAt)),
  //         unread: message.unread,
  //         conversationId: message.conversationId
  //       })));
  //     }
  //   } catch (error) {
  //     console.error('Error fetching messages:', error);
  //     const message = error.response?.data?.message || error.message || 'Failed to load messages';
  //     setErrors(prev => ({ ...prev, messages: message }));
  //     toast.error('Failed to load messages');
  //   } finally {
  //     setLoadingSections(prev => ({ ...prev, messages: false }));
  //   }
  // }, []);



  const fetchAllData = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchBuddyProfile(),
        fetchBuddyStats(),
        fetchUpcomingBookings(),
        fetchRecentMessages()
      ]);

      setLastRefreshed(new Date());
      if (showToast) {
        toast.success('Dashboard updated successfully!');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);
  // Load all data on mount
  // Sửa useEffect chính:
  useEffect(() => {
    // Chỉ gọi khi component mount lần đầu
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchAllData();
    }
  }, [fetchAllData]);
  // Auto-refresh every 2 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData(false);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  // Handlers
  const handleToggleAvailability = useCallback(async () => {
    if (!buddyProfile?._id) return;

    const newAvailability = !buddyProfile.isAvailableNow;

    try {
      const response = await api.patch(`/buddies/${buddyProfile._id}/availability`, {
        isAvailableNow: newAvailability
      });

      if (response.data.success) {
        // Option 1: Cập nhật state từ response
        setBuddyProfile(prev => ({
          ...prev,
          isAvailableNow: response.data.data.isAvailableNow
        }));

        // Option 2: Fetch lại từ server để đảm bảo đồng bộ
        await fetchBuddyProfile();

        toast.success(`You are now ${newAvailability ? 'available' : 'unavailable'}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        'Failed to update availability';
      toast.error(errorMessage);
    }
  }, [buddyProfile, fetchBuddyProfile]);

  const toggleProfileDropdown = useCallback(() => {
    setShowProfileDropdown(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
    toast.info('Logged out successfully');
  }, [navigate]);

  const handleRetry = useCallback((section) => {
    const fetchFunctions = {
      profile: fetchBuddyProfile,
      stats: fetchBuddyStats,
      bookings: fetchUpcomingBookings,
      messages: fetchRecentMessages
    };

    if (fetchFunctions[section]) {
      fetchFunctions[section]();
    }
  }, [fetchBuddyProfile, fetchBuddyStats, fetchUpcomingBookings, fetchRecentMessages]);

  const handleRefreshData = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const handleViewAll = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'createTour':
        navigate('/buddy/tours/create');
        break;
      case 'manageSchedule':
        navigate('/buddy/schedule');
        break;
      case 'viewEarnings':
        navigate('/buddy/earnings');
        break;
      case 'editProfile':
        navigate('/buddy/profile/edit');
        break;
      case 'viewCalendar':
        navigate('/buddy/calendar');
        break;
      default:
        break;
    }
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return <SkeletonLoader type="buddyDashboard" />;
  }

  return (
    <div className="buddy-home-page">
      {/* Header */}
      <header className="buddy-header">
        <div className="header-left">
          <div className="welcome-section">
            <h1>
              <FaUser className="header-icon" />
              Welcome back, {buddyProfile?.name || 'Buddy'}!
            </h1>
            <p className="welcome-subtitle">
              {buddyProfile?.isAvailableNow
                ? 'You are currently available for bookings'
                : 'You are currently offline'}
            </p>
            <div className="last-updated">
              <FaSync /> Last updated: {formatLastRefreshed()}
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
            <button
              className={`availability-toggle ${buddyProfile?.isAvailableNow ? 'available' : 'unavailable'}`}
              onClick={handleToggleAvailability}
              disabled={loadingSections.profile}
            >
              <div className="toggle-indicator"></div>
              <span>{buddyProfile?.isAvailableNow ? 'Available' : 'Unavailable'}</span>
            </button>

            <button
              className="refresh-btn"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              title="Refresh dashboard"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaSync
                className={isRefreshing ? 'spinning' : ''}
                style={{
                  fontSize: '20px', // Cố định kích thước
                  width: '20px',
                  height: '20px'
                }}
              />
            </button>

            <button
              className="notification-btn"
              onClick={() => handleViewAll('/buddy/notifications')}
              title="Notifications"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <FaBell
                style={{
                  fontSize: '20px', // Cố định kích thước
                  width: '20px',
                  height: '20px'
                }}
              />
              <span className="notification-badge">3</span>
            </button>

            {/* Profile Dropdown */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button className="profile-btn" onClick={toggleProfileDropdown}>
                {buddyProfile?.pfp ? (
                  <img
                    src={buddyProfile.pfp}
                    alt={buddyProfile.name}
                    className="profile-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(buddyProfile.name)}&background=667eea&color=fff&bold=true`;
                    }}
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    <FaUserCircle />
                  </div>
                )}
                <div className="profile-info">
                  <span className="profile-name">{buddyProfile?.name?.split(' ')[0] || 'User'}</span>
                  <span className="profile-rating">
                    <FaStar /> {stats.averageRating.toFixed(1)}
                  </span>
                </div>
                <FaChevronRight className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="user-profile-summary">
                      {buddyProfile?.pfp ? (
                        <img
                          src={buddyProfile.pfp}
                          alt={buddyProfile.name}
                          className="dropdown-avatar"
                        />
                      ) : (
                        <div className="dropdown-avatar-fallback">
                          <FaUserCircle />
                        </div>
                      )}
                      <div className="user-details">
                        <h4>{buddyProfile?.name}</h4>
                        <p className="user-email">{buddyProfile?.email}</p>
                        <div className="user-stats">
                          <span className="stat">
                            <FaStar /> {stats.averageRating.toFixed(1)}
                          </span>
                          <span className="stat">
                            <FaUsers /> {stats.completedTours}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => handleViewAll('/buddy/profile')}>
                      <FaUserCircle />
                      <span>My Profile</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleQuickAction('editProfile')}>
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleQuickAction('viewEarnings')}>
                      <FaWallet />
                      <span>Earnings & Payouts</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleViewAll('/buddy/bookings')}>
                      <FaCalendarDay />
                      <span>My Bookings</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleViewAll('/buddy/tours')}>
                      <FaUser />
                      <span>My Tours</span>
                    </button>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item" onClick={() => handleViewAll('/settings')}>
                      <FaCog />
                      <span>Settings</span>
                    </button>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-overview">
        <StatsCard
          title="Total Earnings"
          value={`$${stats.totalEarnings.toLocaleString()}`}
          icon={<FaMoneyBillWave />}
          trend={`+$${stats.monthlyEarnings} this month`}
          color="earning"
          loading={loadingSections.stats}
          error={errors.stats}
          onRetry={() => handleRetry('stats')}
        />

        <StatsCard
          title="Completed Tours"
          value={stats.completedTours}
          icon={<FaUsers />}
          trend={`${stats.pendingBookings} pending`}
          color="tours"
          loading={loadingSections.stats}
          error={errors.stats}
          onRetry={() => handleRetry('stats')}
        />

        <StatsCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          icon={<FaStar />}
          trend={stats.averageRating >= 4.5 ? 'Excellent!' : 'Good work'}
          color="rating"
          loading={loadingSections.stats}
          error={errors.stats}
          onRetry={() => handleRetry('stats')}
        />

        <StatsCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={<FaComments />}
          trend={`${stats.totalBookings} total bookings`}
          color="response"
          loading={loadingSections.stats}
          error={errors.stats}
          onRetry={() => handleRetry('stats')}
        />
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column */}
        <div className="left-column">
          {/* Quick Actions */}
          <section className="quick-actions-section">
            <div className="section-header">
              <h2><FaBolt /> Quick Actions</h2>
            </div>
            <div className="quick-actions-grid">
              <button
                className="quick-action-card"
                onClick={() => handleQuickAction('createTour')}
              >
                <div className="action-icon create-tour">
                  <FaUser />
                </div>
                <h4>Create Tour</h4>
                <p>Design a new tour experience</p>
              </button>

              <button
                className="quick-action-card"
                onClick={() => handleQuickAction('manageSchedule')}
              >
                <div className="action-icon schedule">
                  <FaCalendarAlt />
                </div>
                <h4>Manage Schedule</h4>
                <p>Set your availability</p>
              </button>

              <button
                className="quick-action-card"
                onClick={() => handleQuickAction('viewEarnings')}
              >
                <div className="action-icon earnings">
                  <FaChartLine />
                </div>
                <h4>View Earnings</h4>
                <p>Check your income</p>
              </button>

              <button
                className="quick-action-card"
                onClick={() => handleQuickAction('editProfile')}
              >
                <div className="action-icon profile">
                  <FaUser />
                </div>
                <h4>Edit Profile</h4>
                <p>Update your information</p>
              </button>
            </div>
          </section>

          {/* Upcoming Bookings */}
          <section className="bookings-section">
            <div className="section-header">
              <h2><FaCalendarAlt /> Upcoming Bookings</h2>
              <button
                className="view-all-btn"
                onClick={() => handleViewAll('/buddy/bookings')}
              >
                View All <FaChevronRight />
              </button>
            </div>

            {errors.bookings ? (
              <ErrorRetry
                message={errors.bookings}
                onRetry={() => handleRetry('bookings')}
              />
            ) : loadingSections.bookings ? (
              <div className="bookings-skeleton">
                {[1, 2, 3].map(i => (
                  <div key={i} className="booking-skeleton-card">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="empty-state">
                <FaCalendarAlt className="empty-icon" />
                <h4>No upcoming bookings</h4>
                <p>When you get bookings, they'll appear here</p>
                <button
                  className="action-btn primary"
                  onClick={() => handleQuickAction('createTour')}
                >
                  Create a Tour
                </button>
              </div>
            ) : (
              <div className="bookings-list">
                {upcomingBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => handleBookingClick(booking)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Verification Status */}
          {/* {buddyProfile && verificationStatus.completed < verificationStatus.total && (
            <section className="verification-section">
              <div className="section-header">
                <h2><FaShieldAlt /> Verification Status</h2>
                <span className="verification-progress">
                  {verificationStatus.completed}/{verificationStatus.total}
                </span>
              </div>

              <div className="verification-steps">
                {verificationStatus.steps.map((step, index) => (
                  <div key={index} className={`verification-step ${step.completed ? 'completed' : 'pending'}`}>
                    <div className="step-icon">
                      {step.completed ? <FaCheckCircle /> : step.icon}
                    </div>
                    <div className="step-info">
                      <h5>{step.name} Verification</h5>
                      <p>{step.completed ? 'Completed' : 'Pending'}</p>
                    </div>
                    {!step.completed && (
                      <button
                        className="complete-btn"
                        onClick={() => navigate('/buddy/verification')}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="verify-all-btn"
                onClick={() => navigate('/buddy/verification')}
              >
                Complete All Verifications
              </button>
            </section>
          )} */}

          {/* Recent Messages */}
          {recentMessages.length === 0 ? (
            <div className="empty-state">
              <FaComments className="empty-icon" />
              <h4>No messages yet</h4>
              <p>Your conversations will appear here</p>
            </div>
          ) : (
            <div className="messages-list">
              {recentMessages.map((conversation, index) => (
                <MessageItem
                  key={conversation._id || `conv-${index}`}
                  conversation={conversation}  // Truyền thẳng object từ API
                  currentUserId={currentUser?._id}
                  onClick={() => handleViewAll(`/messages/${conversation._id}`)}
                />
              ))}
            </div>
          )}

          {/* Performance Insights */}
          <section className="performance-section">
            <div className="section-header">
              <h2><FaTrophy /> Performance Insights</h2>
            </div>

            <div className="performance-metrics">
              <div className="performance-metric">
                <div className="metric-header">
                  <span className="metric-label">Booking Rate</span>
                  <span className="metric-value">{performanceMetrics.bookingRate}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill booking-rate"
                    style={{ width: `${performanceMetrics.bookingRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="performance-metric">
                <div className="metric-header">
                  <span className="metric-label">Guest Satisfaction</span>
                  <span className="metric-value">{performanceMetrics.satisfactionRate}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill satisfaction"
                    style={{ width: `${performanceMetrics.satisfactionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="performance-metric">
                <div className="metric-header">
                  <span className="metric-label">Cancellation Rate</span>
                  <span className="metric-value">{performanceMetrics.cancellationRate}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill cancellation"
                    style={{ width: `${performanceMetrics.cancellationRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {stats.ranking && (
              <div className="ranking-badge">
                <FaTrophy />
                <span>Top {stats.ranking}% of buddies in your city</span>
              </div>
            )}
          </section>

          {/* Tips & Resources */}
          <section className="tips-section">
            <div className="section-header">
              <h2><FaLightbulb /> Tips for Success</h2>
            </div>

            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon photo">
                  <FaUser />
                </div>
                <h4>Professional Photos</h4>
                <p>High-quality photos increase bookings by 3x</p>
              </div>

              <div className="tip-card">
                <div className="tip-icon response">
                  <FaClock />
                </div>
                <h4>Quick Responses</h4>
                <p>Respond within 1 hour for better conversion</p>
              </div>

              <div className="tip-card">
                <div className="tip-icon reviews">
                  <FaHeart />
                </div>
                <h4>Collect Reviews</h4>
                <p>5-star reviews boost your visibility</p>
              </div>
            </div>
          </section>
          {/* Modal for Booking Details - THÊM VÀO CUỐI */}
          {showBookingDetail && (
            <div className="modal-overlay" onClick={() => setShowBookingDetail(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <BookingDetailCard
                  booking={selectedBooking}
                  onClose={() => {
                    setShowBookingDetail(false);
                    setSelectedBooking(null);
                  }}
                  onConfirm={(bookingId) => handleBookingAction('confirm', bookingId)}
                  onReject={(bookingId, reason) => handleBookingAction('reject', bookingId, { reason })}
                  onComplete={(bookingId, notes) => handleBookingAction('complete', bookingId, { notes })}
                  isLoading={isProcessingBooking}
                  userRole="tour-guide"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuddyHomePage;