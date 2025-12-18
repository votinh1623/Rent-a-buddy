import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectByPreference.scss';

const SelectByPreference = ({ shouldHighlight }) => {
  const navigate = useNavigate();
  
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [highlightSection, setHighlightSection] = useState(null); // 'destination' hoặc 'activities'
  
  // Refs để scroll
  const destinationSectionRef = useRef(null);
  const activitiesSectionRef = useRef(null);

  // Kích hoạt highlight khi được yêu cầu từ parent
  useEffect(() => {
    if (shouldHighlight) {
      setHighlightSection('destination');
      
      // Tự động scroll đến destination section
      setTimeout(() => {
        if (destinationSectionRef.current) {
          destinationSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 200);
      
      // Xóa highlight sau 3 giây
      const timer = setTimeout(() => {
        setHighlightSection(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight]);

  // Tự động scroll xuống activities khi destination được chọn
  useEffect(() => {
    if (selectedDestination && activitiesSectionRef.current) {
      setTimeout(() => {
        activitiesSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [selectedDestination]);

  // Fetch destinations và activities từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch destinations
        const destinationsRes = await fetch('/api/destinations');
        if (!destinationsRes.ok) throw new Error('Failed to fetch destinations');
        const destinationsData = await destinationsRes.json();
        
        // Fetch all activities
        const activitiesRes = await fetch('/api/activities');
        if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
        const activitiesData = await activitiesRes.json();
        
        setDestinations(destinationsData.data || []);
        setAllActivities(activitiesData.data || []);
        setFilteredActivities(activitiesData.data || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch activities khi destination thay đổi
  useEffect(() => {
    const fetchActivitiesForDestination = async () => {
      if (selectedDestination) {
        setLoadingActivities(true);
        try {
          const response = await fetch(`/api/destinations/${selectedDestination._id}/activities`);
          if (response.ok) {
            const data = await response.json();
            setFilteredActivities(data.data || []);
          } else {
            // Fallback: filter từ allActivities
            const destActivityIds = selectedDestination.activities?.map(id => 
              typeof id === 'object' ? id._id : id
            ) || [];
            
            const filtered = allActivities.filter(activity => 
              destActivityIds.some(id => 
                String(id) === String(activity._id)
              )
            );
            setFilteredActivities(filtered);
          }
        } catch (error) {
          console.error('Error fetching destination activities:', error);
          // Fallback logic
          const destActivityIds = selectedDestination.activities?.map(id => 
            typeof id === 'object' ? id._id : id
          ) || [];
          
          const filtered = allActivities.filter(activity => 
            destActivityIds.some(id => 
              String(id) === String(activity._id)
            )
          );
          setFilteredActivities(filtered);
        } finally {
          setLoadingActivities(false);
          setShowAllActivities(false);
        }
      } else {
        setFilteredActivities(allActivities);
      }
    };

    fetchActivitiesForDestination();
  }, [selectedDestination, allActivities]);

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleDestinationSelect = (destination) => {
    if (selectedDestination?._id === destination._id) {
      setSelectedDestination(null);
    } else {
      setSelectedDestination(destination);
      // Tự động scroll xuống activities section
      setTimeout(() => {
        if (activitiesSectionRef.current) {
          activitiesSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  };

  const handleFindBuddies = () => {
    if (!selectedDestination && selectedActivities.length === 0) {
      alert('Please select at least one destination or activity');
      return;
    }

    const queryParams = new URLSearchParams();
    if (selectedDestination) {
      queryParams.append('destination', selectedDestination._id);
    }
    if (selectedActivities.length > 0) {
      queryParams.append('activities', selectedActivities.join(','));
    }

    navigate(`/home/search-result?${queryParams.toString()}`);
  };

  const handleClearAll = () => {
    setSelectedActivities([]);
    setSelectedDestination(null);
  };

  // Get popular destinations
  const popularDestinations = destinations
    .filter(dest => dest.isPopular)
    .slice(0, 5);

  const visibleDestinations = showAllDestinations ? destinations : popularDestinations;
  const visibleActivities = showAllActivities ? filteredActivities : filteredActivities.slice(0, 20);

  if (loading) {
    return (
      <div className="select-by-preference loading">
        <div className="loading-spinner"></div>
        <p>Loading destinations and activities...</p>
      </div>
    );
  }

  return (
    <div className="select-by-preference">
      <div className="preference-header">
        <h2>Find Your Perfect Buddy in Da Nang</h2>
        <p className="subtitle">
          Select a destination and preferred activities to find local buddies
        </p>
      </div>

      {/* Destination Selection */}
      <div 
        ref={destinationSectionRef}
        className={`preference-section destination-section ${highlightSection === 'destination' ? 'highlight-section' : ''}`}
      >
        <div className="section-header">
          <h3>
            Choose a Destination
            {selectedDestination && (
              <span className="selection-hint">
                Selected: {selectedDestination.name}
              </span>
            )}
          </h3>
          <p>Popular spots in Da Nang</p>
        </div>
        
        <div className={`destinations-grid ${showAllDestinations ? 'expanded' : ''}`}>
          {visibleDestinations.map(destination => (
            <div
              key={destination._id}
              className={`destination-card ${selectedDestination?._id === destination._id ? 'selected' : ''}`}
              onClick={() => handleDestinationSelect(destination)}
            >
              <div className="destination-image">
                {destination.coverImg ? (
                  <img 
                    src={destination.coverImg}
                    alt={destination.name}
                    className="destination-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/150/667eea/ffffff?text=${destination.name.charAt(0)}`;
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    {destination.name.charAt(0)}
                  </div>
                )}
                {destination.isPopular && (
                  <div className="popular-badge">
                    <span className="star">★</span> Popular
                  </div>
                )}
              </div>
              <div className="destination-content">
                <h4>{destination.name}</h4>
                <p className="destination-desc">{destination.description}</p>
                <div className="destination-tags">
                  <span className="tag">
                    {destination.activities?.length || 0} activities
                  </span>
                </div>
              </div>
              <div className="destination-check">
                {selectedDestination?._id === destination._id && (
                  <div className="check-circle">
                    <span className="check-icon">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {destinations.length > 5 && (
          <div className="show-more-container">
            <button
              className="show-more-btn"
              onClick={() => setShowAllDestinations(!showAllDestinations)}
            >
              {showAllDestinations 
                ? 'Show Less Destinations'
                : `Show All ${destinations.length} Destinations`
              }
              <span className={`arrow ${showAllDestinations ? 'up' : 'down'}`}>
                {showAllDestinations ? '↑' : '↓'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Activities Selection */}
      <div 
        ref={activitiesSectionRef}
        className={`preference-section activities-section ${highlightSection === 'activities' ? 'highlight-section' : ''}`}
      >
        <div className="section-header">
          <h3>
            Select Activities
            {selectedDestination && (
              <span className="selection-hint">
                Available at {selectedDestination.name}
              </span>
            )}
          </h3>
          <p>
            {selectedDestination
              ? `Activities available at ${selectedDestination.name}`
              : 'All available activities in Da Nang'
            }
          </p>
        </div>
        
        <div className={`activities-grid ${showAllActivities ? 'expanded' : ''}`}>
          {visibleActivities.map(activity => (
            <button
              key={activity._id}
              className={`activity-card ${selectedActivities.includes(activity._id) ? 'selected' : ''}`}
              onClick={() => toggleActivity(activity._id)}
              style={{
                '--activity-color': activity.color || '#2563eb'
              }}
            >
              <div className="activity-icon" style={{ backgroundColor: activity.color || '#2563eb' }}>
                {activity.icon || '🌟'}
              </div>
              <span className="activity-name">{activity.name}</span>
              {selectedActivities.includes(activity._id) && (
                <div className="activity-check">
                  <span className="check-icon">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary & Actions */}
      <div className="selection-actions">
        {(selectedDestination || selectedActivities.length > 0) && (
          <div className="selected-summary">
            <h4>Your Selection</h4>
            <div className="summary-items">
              {selectedDestination && (
                <div className="summary-item">
                  <span className="item-label">📍 Destination:</span>
                  <span className="item-value">
                    {selectedDestination.name}
                  </span>
                  <button 
                    className="remove-btn"
                    onClick={() => setSelectedDestination(null)}
                    aria-label="Remove destination"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {selectedActivities.length > 0 && (
                <div className="summary-item">
                  <span className="item-label">🎯 Activities:</span>
                  <div className="activity-chips">
                    {selectedActivities.map(id => {
                      const activity = allActivities.find(a => a._id === id);
                      return (
                        <span key={id} className="activity-chip">
                          {activity?.icon} {activity?.name}
                          <button 
                            className="chip-remove"
                            onClick={() => toggleActivity(id)}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => setSelectedActivities([])}
                    aria-label="Clear all activities"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="clear-btn"
            onClick={handleClearAll}
            disabled={!selectedDestination && selectedActivities.length === 0}
          >
            Clear All
          </button>
          
          <button 
            className="find-buddies-btn"
            onClick={handleFindBuddies}
          >
            <span className="btn-text">
              Find Matching Buddies
              {(selectedDestination || selectedActivities.length > 0) && (
                <span className="match-count">
                  {selectedActivities.length} activit{selectedActivities.length !== 1 ? 'ies' : 'y'}
                  {selectedDestination ? ` at ${selectedDestination.name}` : ' selected'}
                </span>
              )}
            </span>
            <span className="arrow">→</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-number">{destinations.length}</div>
            <div className="stat-label">Destinations in Da Nang</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{allActivities.length}</div>
            <div className="stat-label">Activities Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">50+</div>
            <div className="stat-label">Local Buddies</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectByPreference;