// src/components/SelectByPreference.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SelectByPreference.scss';

const SelectByPreference = () => {
  const { t } = useTranslation(['common', 'preferences']);
  const navigate = useNavigate();

  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch destinations và activities từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch destinations (chỉ lấy ở Đà Nẵng)
        const destinationsRes = await fetch('/api/destinations?city=Da%20Nang&isPopular=true');
        if (!destinationsRes.ok) throw new Error('Failed to fetch destinations');
        const destinationsData = await destinationsRes.json();

        // Fetch all activities
        const activitiesRes = await fetch('/api/activities');
        if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
        const activitiesData = await activitiesRes.json();

        setDestinations(destinationsData.data || []);
        setActivities(activitiesData.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);

        // Fallback data nếu API fail
        // setDestinations([
        //   { _id: 'my-khe-beach', name: 'My Khe Beach', description: 'Famous white sand beach' },
        //   { _id: 'marble-mountains', name: 'Marble Mountains', description: 'Buddhist sanctuaries and caves' },
        //   { _id: 'dragon-bridge', name: 'Dragon Bridge', description: 'Iconic fire-breathing bridge' },
        //   { _id: 'ba-na-hills', name: 'Ba Na Hills', description: 'French village and Golden Bridge' },
        // ]);

        // setActivities([
        //   { _id: 'food', name: 'Food Tour', icon: '🍜' },
        //   { _id: 'history', name: 'History', icon: '🏛️' },
        //   { _id: 'beach', name: 'Beach', icon: '🏖️' },
        //   { _id: 'nightlife', name: 'Nightlife', icon: '🌃' },
        //   { _id: 'photography', name: 'Photography', icon: '📸' },
        //   { _id: 'shopping', name: 'Shopping', icon: '🛍️' },
        // ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleDestinationChange = (e) => {
    setSelectedDestination(e.target.value);
  };

  const handleFindBuddies = () => {
    if (!selectedDestination && selectedActivities.length === 0) {
      alert(t('preferences:select_required', 'Please select at least one destination or activity'));
      return;
    }

    // Tạo query parameters
    const queryParams = new URLSearchParams();
    if (selectedDestination) {
      queryParams.append('destinationId', selectedDestination);
    }
    if (selectedActivities.length > 0) {
      queryParams.append('activities', selectedActivities.join(','));
    }

    // Navigate đến find buddies page với filters
    navigate(`/find-buddies?${queryParams.toString()}`);
  };

  const handleClearAll = () => {
    setSelectedActivities([]);
    setSelectedDestination('');
  };

  if (loading) {
    return (
      <div className="select-by-preference loading">
        <div className="loading-spinner"></div>
        <p>{t('preferences:loading', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="select-by-preference">
      <div className="preference-header">
        <h2>{t('preferences:title', 'Find Your Perfect Buddy')}</h2>
        <p className="subtitle">
          {t('preferences:subtitle', 'Select your preferences in Da Nang and find the perfect local buddy for your adventure')}
        </p>
      </div>

      {error && (
        <div className="error-message">
          <p>{t('preferences:api_error', 'Using sample data. API connection failed.')}</p>
        </div>
      )}

      <div className="preference-sections">
        {/* Destination Selection - Hiển thị trước */}
        <div className="preference-section destination-section">
          <div className="section-header">
            <h3>{t('preferences:choose_destination', 'Choose a Destination')}</h3>
            <p>{t('preferences:destination_hint', 'Select a popular spot in Da Nang')}</p>
          </div>

          <div className="destination-options">
            {destinations.map(destination => (
              <div
                key={destination._id}
                className={`destination-option ${selectedDestination === destination._id ? 'selected' : ''}`}
                onClick={() => setSelectedDestination(destination._id)}
              >
                <div className="destination-image">
                  {destination.coverImg ? (
                    <img
                      src={destination.coverImg}
                      alt={destination.name}
                      className="destination-img"
                    />
                  ) : (
                    <div className="image-placeholder">
                      {destination.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="destination-info">
                  <h4>{destination.name}</h4>
                  <p className="destination-desc">{destination.description}</p>
                  {destination.isPopular && (
                    <span className="popular-badge">Popular</span>
                  )}
                </div>
                <div className="destination-check">
                  {selectedDestination === destination._id && (
                    <div className="check-mark">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Selection */}
        <div className="preference-section activities-section">
          <div className="section-header">
            <h3>{t('preferences:choose_activities', 'Select Activities')}</h3>
            <p>{t('preferences:activities_hint', 'Choose activities you\'re interested in (multiple selections)')}</p>
          </div>

          <div className="activities-grid">
            {activities.map(activity => (
              <button
                key={activity._id}
                className={`activity-option ${selectedActivities.includes(activity._id) ? 'selected' : ''}`}
                onClick={() => toggleActivity(activity._id)}
                style={{
                  '--activity-color': activity.color || '#2563eb'
                }}
              >
                <div className="activity-icon">{activity.icon || '🌟'}</div>
                <span className="activity-name">{activity.name}</span>
                {selectedActivities.includes(activity._id) && (
                  <div className="activity-check">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Summary */}
      {(selectedDestination || selectedActivities.length > 0) && (
        <div className="selected-summary">
          <h4>{t('preferences:selected_summary', 'Your Selection:')}</h4>
          <div className="summary-items">
            {selectedDestination && (
              <div className="summary-item">
                <span className="item-label">Destination:</span>
                <span className="item-value">
                  {destinations.find(d => d._id === selectedDestination)?.name || selectedDestination}
                </span>
                <button
                  className="remove-item"
                  onClick={() => setSelectedDestination('')}
                >
                  ×
                </button>
              </div>
            )}

            {selectedActivities.length > 0 && (
              <div className="summary-item">
                <span className="item-label">Activities:</span>
                <span className="item-value">
                  {selectedActivities.map(id =>
                    activities.find(a => a._id === id)?.name || id
                  ).join(', ')}
                </span>
                <button
                  className="remove-item"
                  onClick={() => setSelectedActivities([])}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="clear-btn"
          onClick={handleClearAll}
          disabled={!selectedDestination && selectedActivities.length === 0}
        >
          {t('preferences:clear_all', 'Clear All')}
        </button>

        <button
          className="find-buddies-btn"
          onClick={handleFindBuddies}
        >
          {t('preferences:find_buddies', 'Find Matching Buddies')}
          <span className="arrow">→</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-number">{destinations.length}+</div>
          <div className="stat-label">{t('preferences:destinations_available', 'Destinations in Da Nang')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{activities.length}+</div>
          <div className="stat-label">{t('preferences:activities_available', 'Activities Available')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">50+</div>
          <div className="stat-label">{t('preferences:local_buddies', 'Local Buddies')}</div>
        </div>
      </div>
    </div>
  );
};

export default SelectByPreference;