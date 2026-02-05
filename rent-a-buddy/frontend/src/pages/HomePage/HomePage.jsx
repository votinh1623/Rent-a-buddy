// HomePage.jsx
import { useState, useEffect, useRef } from 'react'
import './Homepage.scss'
import { useNavigate, NavLink } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { logout } from '../../service/authService';
import { toast } from 'react-toastify';
import SelectByPreference from '../../components/SelectByPreference/SelectByPreference.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import {
  FaUserCircle,
  FaEdit,
  FaWallet,
  FaCalendarDay,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronRight,
  FaCommentDots,
  FaBell,
  FaSync
} from 'react-icons/fa';

function HomePage() {
  const [currentBuddy, setCurrentBuddy] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shouldHighlightPreference, setShouldHighlightPreference] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const preferenceSectionRef = useRef(null);
  const stepsSectionRef = useRef(null);
  const dropdownRef = useRef(null);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      // Kiểm token trong cookie hoặc localStorage
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='));

      // Kiểm user data trong localStorage
      const userData = localStorage.getItem('user');
      
      setIsLoggedIn(!!accessToken);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role);
          setUserData(user);
          
          // Nếu user là tour-guide, redirect đến buddy home
          if (user.role === 'tour-guide' && location.pathname === '/home/homepage') {
            navigate('/home/buddy-home');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, [navigate, location]);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!isLoggedIn || !userData?._id) return;
      
      try {
        // Gọi API để lấy tổng số unread messages
        const response = await fetch(`/api/conversations/unread-count?userId=${userData._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTotalUnreadMessages(data.totalUnread || 0);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
    
    fetchUnreadMessages();
    
    // Refresh mỗi 30 giây
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userData]);

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

  useEffect(() => {
    // Kiểm tra nếu URL có hash '#select-preferences'
    if (location.hash === '#select-preferences') {
      setTimeout(() => {
        if (preferenceSectionRef.current) {
          preferenceSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 100);
    }
  }, [location]);

  // Xóa highlight sau 5 giây
  useEffect(() => {
    if (shouldHighlightPreference) {
      const timer = setTimeout(() => {
        setShouldHighlightPreference(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldHighlightPreference]);

  const handleLogout = async () => {
    if (window.confirm("Do you want to log out?")) {
      try {
        await logout();
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserData(null);
        setShowProfileDropdown(false);
        toast.success("Logged out successfully!");
        navigate("/homepage");
      } catch (err) {
        console.error("Logout error:", err);
        toast.error("Cannot logout, please try again!");
      }
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(prev => !prev);
  };

  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Logic refresh data ở đây
      toast.info("Refreshing data...");
      
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Data refreshed!");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Refresh failed!");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigation handlers
  const handleViewAll = (path) => {
    navigate(path);
    setShowProfileDropdown(false);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'editProfile':
        if (userRole === 'tour-guide') {
          navigate('/buddy/profile/edit');
        } else {
          navigate('/profile/edit');
        }
        break;
      case 'viewEarnings':
        if (userRole === 'tour-guide') {
          navigate('/buddy/earnings');
        }
        break;
      default:
        break;
    }
    setShowProfileDropdown(false);
  };

  // Nếu là buddy, hiển thị link đến buddy home
  const getHomeLink = () => {
    if (userRole === 'tour-guide') {
      return '/home/buddy-home';
    } else if (userRole === 'traveller') {
      return '/home/traveller-home';
    }
    return '/home/homepage';
  };

  const handleFindBuddyClick = () => {
    setShouldHighlightPreference(true);
    
    setTimeout(() => {
      if (preferenceSectionRef.current) {
        preferenceSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Hàm xử lý click nút "How it works"
  const handleHowItWorksClick = () => {
    if (stepsSectionRef.current) {
      stepsSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const buddies = [
    {
      id: 1,
      name: "Minh Nguyen",
      city: "Hanoi",
      specialty: "Food & History Expert",
      rating: 4.9,
      price: "$25/day",
      img: "/images/male-buddy-1.jpg",
      description: "Discover hidden alleys and authentic street food"
    },
    {
      id: 2,
      name: "Linh Tran",
      city: "Da Nang",
      specialty: "Beach & Photography",
      rating: 4.8,
      price: "$22/day",
      img: "/images/female-buddy-1.jpg",
      description: "Best beaches and instagram spots"
    },
    {
      id: 3,
      name: "Alex Chen",
      city: "Ho Chi Minh City",
      specialty: "Nightlife & Culture",
      rating: 4.7,
      price: "$28/day",
      img: "/images/male-buddy-2.jpg",
      description: "Vibrant city life and local experiences"
    },
    {
      id: 4,
      name: "Yuki Sato",
      city: "Hoi An",
      specialty: "Heritage & Crafts",
      rating: 5.0,
      price: "$30/day",
      img: "/images/female-buddy-2.jpg",
      description: "Ancient town stories and traditional workshops"
    },
  ]

  // Auto rotate featured buddy
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBuddy(prev => (prev + 1) % buddies.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-primary">Rent a buddy</span>
        </div>
        <nav className="nav">
          <NavLink to={getHomeLink()} className="nav-link">
            {userRole === 'tour-guide' ? 'Dashboard' : 'Home'}
          </NavLink>
          
          {userRole === 'tour-guide' && (
            <NavLink to="/home/buddy-home" className="nav-link">
              My Dashboard
            </NavLink>
          )}
          
          {userRole === 'traveller' && (
            <>
              <NavLink to="/home/select-preferences" className="nav-link">
                Find Buddy
              </NavLink>
              <NavLink to="/home/search-result" className="nav-link">
                Browse Buddies
              </NavLink>
            </>
          )}
          
          <NavLink to="/become-buddy" className="nav-link">Become Buddy</NavLink>
          
          {/* Sửa NavLink thành button */}
          <button 
            className="nav-link how-it-works-btn"
            onClick={handleHowItWorksClick}
          >
            How it works
          </button>

          {/* Hiển thị nút theo trạng thái đăng nhập */}
          {!isLoggedIn ? (
            <button className="login-btn" onClick={handleLogin}>
              Sign In
            </button>
          ) : (
            <>
              {/* Action Buttons - Chỉ hiển thị khi đã login */}
              <div className="header-actions">
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
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#667eea',
                    marginRight: '10px'
                  }}
                >
                  <FaSync
                    className={isRefreshing ? 'spinning' : ''}
                    style={{
                      fontSize: '20px',
                      width: '20px',
                      height: '20px',
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                </button>
                
                <button
                  className={`chat-btn ${totalUnreadMessages > 0 ? 'has-unread' : ''}`}
                  onClick={() => handleViewAll('/home/chat')}
                  title="Messages"
                  style={{
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#667eea',
                    marginRight: '10px',
                    position: 'relative'
                  }}
                >
                  <FaCommentDots
                    style={{
                      fontSize: '20px',
                      width: '20px',
                      height: '20px'
                    }}
                  />
                  {totalUnreadMessages > 0 && (
                    <span className="chat-badge"
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ff4757',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </span>
                  )}
                </button>
                
                <button
                  className="notification-btn"
                  onClick={() => handleViewAll('/notifications')}
                  title="Notifications"
                  style={{
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#667eea',
                    marginRight: '15px',
                    position: 'relative'
                  }}
                >
                  <FaBell
                    style={{
                      fontSize: '20px',
                      width: '20px',
                      height: '20px'
                    }}
                  />
                  <span className="notification-badge"
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    3
                  </span>
                </button>
              </div>

              <div className="profile-dropdown-container" ref={dropdownRef}>
                <button className="profile-btn-header" onClick={toggleProfileDropdown}>
                  {userData?.pfp ? (
                    <img
                      src={userData.pfp}
                      alt={userData.name}
                      className="profile-avatar-small"
                    />
                  ) : (
                    <div className="profile-avatar-fallback">
                      <FaUserCircle />
                    </div>
                  )}
                  <span className="profile-name-header">{userData?.name?.split(' ')[0] || 'User'}</span>
                  <FaChevronRight className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`} />
                </button>

                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <div className="user-profile-summary">
                        {userData?.pfp ? (
                          <img
                            src={userData.pfp}
                            alt={userData.name}
                            className="dropdown-avatar"
                          />
                        ) : (
                          <div className="dropdown-avatar-fallback">
                            <FaUserCircle />
                          </div>
                        )}
                        <div className="user-details">
                          <h4>{userData?.name}</h4>
                          <p className="user-email">{userData?.email}</p>
                          <div className="user-role">
                            <span className={`role-badge ${userRole}`}>
                              {userRole === 'tour-guide' ? 'Tour Guide' : 'Traveller'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={() => handleViewAll('/profile')}>
                        <FaUserCircle />
                        <span>My Profile</span>
                      </button>
                      
                      {userRole === 'tour-guide' && (
                        <>
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
                        </>
                      )}
                      
                      {userRole === 'traveller' && (
                        <>
                          <button className="dropdown-item" onClick={() => handleViewAll('/my-bookings')}>
                            <FaCalendarDay />
                            <span>My Bookings</span>
                          </button>
                          <button className="dropdown-item" onClick={() => handleViewAll('/my-trips')}>
                            <FaUser />
                            <span>My Trips</span>
                          </button>
                        </>
                      )}

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
            </>
          )}
        </nav>
      </header>

      {/* ... rest of the HomePage content remains the same ... */}
      <main className="main">
        {/* Hero Section */}
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Travel with a
              <span className="highlight"> local friend</span>
            </h1>
            <p className="hero-subtitle">
              Connect with verified locals who show you their city beyond tourist spots
            </p>
          </div>
        </div>
        
        {/* Section SelectByPreference với id và ref */}
        <section id="select-preferences" ref={preferenceSectionRef}>
          <SelectByPreference />
        </section>
        
        {/* Featured Buddy */}
        <section className="featured-section">
          <div className="section-header">
            <h2>Featured Local Guides</h2>
            <p>Trusted by travelers worldwide</p>
          </div>

          <div className="featured-buddy">
            <div className="buddy-image-container">
              <img
                src={buddies[currentBuddy].img}
                alt={buddies[currentBuddy].name}
                className="buddy-image"
              />
              <div className="buddy-badge">
                <span className="rating-star">★</span>
                {buddies[currentBuddy].rating}
              </div>
            </div>

            <div className="buddy-info">
              <div className="buddy-header">
                <h3>{buddies[currentBuddy].name}</h3>
                <span className="buddy-price">{buddies[currentBuddy].price}</span>
              </div>
              <p className="buddy-city">{buddies[currentBuddy].city}</p>
              <p className="buddy-specialty">{buddies[currentBuddy].specialty}</p>
              <p className="buddy-description">{buddies[currentBuddy].description}</p>

              <div className="buddy-actions">
                <button className="book-btn">Book Now</button>
                <button className="profile-btn">View Profile</button>
              </div>
            </div>
          </div>

          {/* Buddy Indicators */}
          <div className="indicators">
            {buddies.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentBuddy ? 'active' : ''}`}
                onClick={() => setCurrentBuddy(index)}
              />
            ))}
          </div>
        </section>
        
        {/* How it works - Thêm ref */}
        <section className="steps-section" ref={stepsSectionRef}>
          <div className="section-header">
            <h2>How Rent a buddy Works</h2>
            <p>Three simple steps to your perfect trip</p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Search & Connect</h3>
              <p>Find local buddies based on your destination and interests</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Plan Together</h3>
              <p>Chat directly to customize your itinerary</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Explore & Enjoy</h3>
              <p>Meet up and experience the city like a local</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default HomePage