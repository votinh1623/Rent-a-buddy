import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Star,
    Calendar,
    Users,
    Globe,
    Navigation,
    Camera,
    Utensils,
    Clock,
    Award,
    Heart
} from 'lucide-react';
import './DestinationDetail.scss';
import MapComponent from '../MapComponent/MapComponent'; // Thêm import này

const DestinationDetail = ({ destination, buddyName }) => {
    const [loading, setLoading] = useState(false);
    const [destinationDetails, setDestinationDetails] = useState(destination);

    useEffect(() => {
        const fetchDestinationDetails = async () => {
            if (!destination._id || destination.description) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/destinations/by-ids/${destination._id}`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setDestinationDetails(data.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching destination details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDestinationDetails();
    }, [destination]);

    const getImageUrl = () => {
        const coverImg = destinationDetails.coverImg ||
            destinationDetails.image ||
            destinationDetails.coverImage ||
            destinationDetails.img ||
            destinationDetails.thumbnail;

        if (coverImg && typeof coverImg === 'string' && coverImg.trim() !== '') {
            return coverImg;
        }

        const searchQuery = encodeURIComponent(
            `${destinationDetails.name} ${destinationDetails.city || ''} ${destinationDetails.country || 'Vietnam'}`
        );
        return `https://source.unsplash.com/featured/1200x800/?${searchQuery},tourism,landscape`;
    };

    const renderHighlights = () => {
        const highlights = [
            {
                icon: <Camera />,
                title: 'Photo Spots',
                desc: 'Perfect locations for memorable photos'
            },
            {
                icon: <Utensils />,
                title: 'Local Cuisine',
                desc: 'Authentic food experiences'
            },
            {
                icon: <Heart />,
                title: 'Cultural Experience',
                desc: 'Immerse in local traditions'
            },
            {
                icon: <Clock />,
                title: 'Flexible Timing',
                desc: 'Tour duration based on your preference'
            }
        ];

        return (
            <div className="highlight-grid">
                {highlights.map((highlight, index) => (
                    <div key={index} className="highlight-card">
                        <div className="highlight-icon">{highlight.icon}</div>
                        <div className="highlight-title">{highlight.title}</div>
                        <div className="highlight-desc">{highlight.desc}</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderActivities = () => {
        if (!destinationDetails.activities || destinationDetails.activities.length === 0) {
            return (
                <div className="activity-tags">
                    <div className="activity-tag">
                        <Camera size={16} />
                        Photography
                    </div>
                    <div className="activity-tag">
                        <Utensils size={16} />
                        Food Tour
                    </div>
                    <div className="activity-tag">
                        <Globe size={16} />
                        Cultural Tour
                    </div>
                    <div className="activity-tag">
                        <Navigation size={16} />
                        Sightseeing
                    </div>
                </div>
            );
        }

        return (
            <div className="activity-tags">
                {destinationDetails.activities.map((activity, index) => (
                    <div key={index} className="activity-tag">
                        {typeof activity === 'object' ? (
                            <>
                                {activity.icon || <Camera size={16} />}
                                {activity.name}
                            </>
                        ) : (
                            <>
                                <Camera size={16} />
                                Activity
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderStats = () => {
        return (
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-value">4.8</div>
                    <div className="stat-label">Rating</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">500+</div>
                    <div className="stat-label">Visitors</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">5h</div>
                    <div className="stat-label">Avg Tour</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">$25</div>
                    <div className="stat-label">Start From</div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="destination-detail loading">
                <div className="loading-spinner"></div>
                <h3>Loading Destination Details</h3>
                <p>Please wait while we fetch the information...</p>
            </div>
        );
    }

    return (
        <div className="destination-detail">
            {/* Hero Section */}
            <div className="destination-hero">
                <img
                    src={getImageUrl()}
                    alt={destinationDetails.name}
                    className="destination-hero-image"
                    onError={(e) => {
                        e.target.src = `https://source.unsplash.com/featured/1200x800/?${encodeURIComponent(destinationDetails.name)},tourism`;
                    }}
                />
                <div className="destination-hero-overlay">
                    <h1 className="destination-title">{destinationDetails.name}</h1>
                    <div className="destination-location">
                        <MapPin size={20} />
                        <span>
                            {destinationDetails.city || 'Da Nang'}
                            {destinationDetails.city && destinationDetails.country ? ', ' : ''}
                            {destinationDetails.country || 'Vietnam'}
                        </span>
                    </div>
                </div>
                <div className="destination-badges">
                    {destinationDetails.isPopular && (
                        <div className="popular-badge">
                            <Star size={14} /> Popular Destination
                        </div>
                    )}
                    {buddyName && (
                        <div className="guide-badge">
                            Available with {buddyName}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="destination-content">
                <div className="content-grid">
                    {/* Main Content */}
                    <div className="main-content">
                        {/* Description */}
                        <div className="section">
                            <h2 className="section-title">
                                <Globe size={20} />
                                About This Destination
                            </h2>
                            <div className="description">
                                {destinationDetails.description ||
                                    `${destinationDetails.name} is a beautiful destination in ${destinationDetails.city || 'Da Nang'} that offers unique experiences for travelers. With ${buddyName} as your guide, you'll discover hidden gems, local culture, and create unforgettable memories.`}
                            </div>
                        </div>

                        {/* Highlights */}
                        <div className="section highlights">
                            <h2 className="section-title">
                                <Award size={20} />
                                Tour Highlights
                            </h2>
                            {renderHighlights()}
                        </div>

                        {/* Activities */}
                        <div className="section activities">
                            <h2 className="section-title">
                                <Calendar size={20} />
                                Popular Activities
                            </h2>
                            {renderActivities()}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="sidebar">
                        {/* Quick Info */}
                        <div className="info-card">
                            <h3 className="info-title">
                                <MapPin size={18} />
                                Quick Info
                            </h3>
                            <div className="info-list">
                                <div className="info-item">
                                    <span className="info-label">City</span>
                                    <span className="info-value">
                                        {destinationDetails.city || 'Da Nang'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Country</span>
                                    <span className="info-value">{destinationDetails.country || 'Vietnam'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Best Time</span>
                                    <span className="info-value">Year Round</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Tour Type</span>
                                    <span className="info-value">Private Guide</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="info-card">
                            <h3 className="info-title">
                                <Star size={18} />
                                Destination Stats
                            </h3>
                            {renderStats()}
                        </div>

                        {/* Coordinates */}
                        {destinationDetails.location && (
                            <div className="info-card">
                                <h3 className="info-title">
                                    <Navigation size={18} />
                                    Coordinates
                                </h3>
                                <div className="coordinates-info">
                                    <div className="coordinate-item">
                                        <span className="coord-label">Latitude:</span>
                                        <span className="coord-value">{destinationDetails.location.latitude?.toFixed(6) || 'N/A'}</span>
                                    </div>
                                    <div className="coordinate-item">
                                        <span className="coord-label">Longitude:</span>
                                        <span className="coord-value">{destinationDetails.location.longitude?.toFixed(6) || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Card */}
                        <div className="booking-card">
                            <h3 className="booking-title">Book This Tour</h3>
                            <p>Experience this destination with {buddyName}</p>
                            <div className="booking-price">
                                $25<span className="price-unit">/hour</span>
                            </div>
                            <button className="booking-btn">
                                Book Now with {buddyName}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="destination-map">
                <MapComponent
                    destination={destinationDetails}
                    height="400px"
                    interactive={true}
                    showControls={true}
                />
            </div>

            {/* Tips Section */}
            <div className="tips-section">
                <h2 className="section-title">
                    <Award size={20} />
                    Travel Tips
                </h2>
                <div className="tips-grid">
                    <div className="tip-card">
                        <div className="tip-icon">👟</div>
                        <div className="tip-content">
                            <h4>Comfortable Shoes</h4>
                            <p>Wear comfortable walking shoes as there might be a lot of walking involved.</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <div className="tip-icon">🌞</div>
                        <div className="tip-content">
                            <h4>Sun Protection</h4>
                            <p>Bring sunscreen, hat, and sunglasses to protect from the sun.</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <div className="tip-icon">💧</div>
                        <div className="tip-content">
                            <h4>Stay Hydrated</h4>
                            <p>Carry water with you to stay hydrated throughout the tour.</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <div className="tip-icon">📸</div>
                        <div className="tip-content">
                            <h4>Camera Ready</h4>
                            <p>Don't forget your camera to capture beautiful moments.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinationDetail;