// App.jsx
import { useState, useEffect } from 'react'
import './Homepage.scss'
import { useNavigate, NavLink } from "react-router-dom";
import { logout } from '../../service/authService';
import { toast } from 'react-toastify';

function HomePage() {
  const [currentBuddy, setCurrentBuddy] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      // Kiểm tra token trong cookie hoặc localStorage
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='));
      
      // Hoặc kiểm localStorage nếu bạn lưu ở đó
      // const token = localStorage.getItem('accessToken');
      
      setIsLoggedIn(!!accessToken);
    };

    checkLoginStatus();
    
    // Có thể thêm event listener để theo dõi thay đổi
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Do you want to log out?")) {
      try {
        await logout();
        // Xóa cookies
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Xóa localStorage nếu có
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Cập nhật trạng thái
        setIsLoggedIn(false);
        
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
          <NavLink to="/find" className="nav-link">Find Buddy</NavLink>
          <NavLink to="/become-buddy" className="nav-link">Become Buddy</NavLink>
          <NavLink to="/how-it-works" className="nav-link">How it works</NavLink>
          
          {/* Hiển thị nút theo trạng thái đăng nhập */}
          {!isLoggedIn ? (
            <button className="login-btn" onClick={handleLogin}>
              Sign In
            </button>
          ) : (
            <>
              <button className="profile-btn" onClick={() => navigate("/profile")}>
                My Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="main">
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Travel with a
              <span className="highlight"> local friend</span>
            </h1>
            <p className="hero-subtitle">
              Connect with verified locals who show you their city beyond tourist spots
            </p>

            <div className="search-bar">
              <div className="search-input">
                <input
                  type="text"
                  placeholder="Where do you want to explore?"
                  className="destination-input"
                />
                <button className="search-btn">
                  <span>Find Buddy</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

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

        {/* How it works */}
        <section className="steps-section">
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

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Rent a buddy</div>
          <p className="footer-tagline">Authentic travel experiences through local connections</p>
          <div className="footer-links">
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/safety">Safety</NavLink>
            <NavLink to="/help">Help Center</NavLink>
            <NavLink to="/terms">Terms</NavLink>
            <NavLink to="/privacy">Privacy</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage