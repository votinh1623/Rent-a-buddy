// App.jsx
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [currentBuddy, setCurrentBuddy] = useState(0)
  
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
          {/* <span className="logo-secondary">Pal</span> */}
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">Find Buddy</a>
          <a href="#" className="nav-link">Become Buddy</a>
          <a href="#" className="nav-link">How it works</a>
          <button className="login-btn">Sign In</button>
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
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
            <a href="#">About us</a>
            <a href="#">Safety</a>
            <a href="#">Help Center</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App