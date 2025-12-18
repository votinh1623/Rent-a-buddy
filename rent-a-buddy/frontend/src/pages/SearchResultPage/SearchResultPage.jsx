// src/pages/SearchResultPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BuddyCard from '../../components/BuddyCard/BuddyCard';
import './SearchResultPage.scss';

const SearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    destination: null,
    activities: []
  });

  useEffect(() => {
    const destination = queryParams.get('destination');
    const activities = queryParams.get('activities');
    
    const params = {
      destination: destination || null,
      activities: activities ? activities.split(',') : []
    };
    
    setSearchParams(params);
    fetchSearchResults(params);
  }, [location.search]);

  const fetchSearchResults = async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = new URLSearchParams();
      if (params.destination) {
        queryString.append('destination', params.destination);
      }
      if (params.activities.length > 0) {
        queryString.append('activities', params.activities.join(','));
      }
      
      const response = await fetch(`/api/buddies/search?${queryString.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch buddies: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBuddies(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch buddies');
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError(err.message);
      setBuddies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/home/homepage#select-preferences');
  };

  const handleBuddyClick = (buddyId) => {
    // Handle buddy click - could navigate to buddy detail page
    console.log('Buddy clicked:', buddyId);
    // navigate(`/home/buddy-detail/${buddyId}`);
  };

  if (loading) {
    return (
      <div className="search-result-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding perfect buddies for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-result-page error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Search Error</h3>
          <p>{error}</p>
          <button onClick={handleBack} className="back-btn">
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-result-page">
      <div className="search-header">
        <button onClick={handleBack} className="back-btn">
          ← Back to Search
        </button>
        <div className="search-summary">
          <h2>Search Results</h2>
          <div className="results-stats">
            <span className="result-count">
              Found <strong>{buddies.length}</strong> buddy{buddies.length !== 1 ? 's' : ''}
            </span>
            {buddies.length > 0 && (
              <span className="available-count">
                <span className="online-dot"></span>
                {buddies.filter(b => b.isAvailableNow).length} available now
              </span>
            )}
          </div>
        </div>
      </div>

      {buddies.length > 0 ? (
        <div className="search-results">
          <div className="filters-section">
            <div className="search-filters">
              <span className="filter-label">Filters:</span>
              {searchParams.destination && (
                <span className="filter-chip">
                  📍 Destination: {searchParams.destination}
                </span>
              )}
              {searchParams.activities.length > 0 && (
                <span className="filter-chip">
                  🎯 Activities: {searchParams.activities.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="buddies-grid">
            {buddies.map(buddy => (
              <BuddyCard 
                key={buddy._id}
                buddy={buddy}
                onSelect={() => handleBuddyClick(buddy._id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">
          <div className="no-results-content">
            <div className="no-results-icon">👥</div>
            <h3>No Buddies Found</h3>
            <p>We couldn't find any buddies matching your search criteria.</p>
            <button onClick={handleBack} className="try-again-btn">
              ← Try Different Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultPage;