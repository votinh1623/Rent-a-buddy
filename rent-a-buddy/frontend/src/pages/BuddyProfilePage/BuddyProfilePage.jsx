import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Star, Clock, Users, Globe, Award, CheckCircle } from 'lucide-react';
import './BuddyProfilePage.scss';

const BuddyProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [buddy, setBuddy] = useState(null);
    const [detailedDestinations, setDetailedDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingDuration, setBookingDuration] = useState(2);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Fetch buddy data
    useEffect(() => {
        const fetchBuddyProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch buddy info
                const response = await fetch(`/api/buddies/${id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch buddy: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setBuddy(data.data);
                    console.log('Buddy data received:', data.data);

                    // 2. Fetch detailed destination info for each destination
                    if (data.data.relatedDestination && data.data.relatedDestination.length > 0) {
                        const destinationDetails = await Promise.all(
                            data.data.relatedDestination.map(async (dest) => {
                                try {
                                    // Nếu dest đã có coverImg, không cần fetch lại
                                    if (dest.coverImg) {
                                        console.log(`Destination ${dest.name} already has coverImg:`, dest.coverImg);
                                        return dest;
                                    }

                                    // Fetch detailed destination info
                                    console.log(`Fetching details for destination: ${dest._id}`);
                                    const destResponse = await fetch(`/api/destinations/${dest._id}`);

                                    if (destResponse.ok) {
                                        const destData = await destResponse.json();
                                        if (destData.success) {
                                            console.log(`Got detailed destination:`, destData.data);
                                            return destData.data; // Return full destination object
                                        }
                                    }
                                } catch (err) {
                                    console.error(`Error fetching destination ${dest._id}:`, err);
                                }
                                return dest; // Fallback to original dest
                            })
                        );

                        console.log('Detailed destinations:', destinationDetails);
                        setDetailedDestinations(destinationDetails);
                    }
                } else {
                    throw new Error(data.message || 'Failed to fetch buddy');
                }
            } catch (err) {
                console.error('Error fetching buddy profile:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBuddyProfile();
        }
    }, [id]);

    // Render destinations - ưu tiên detailedDestinations
    const renderDestinations = () => {
        const destsToRender = detailedDestinations.length > 0 ? detailedDestinations :
            (buddy?.relatedDestination || []);

        if (!destsToRender || destsToRender.length === 0) {
            return (
                <div className="no-data-message">
                    <MapPin size={24} />
                    <p>No destinations available</p>
                </div>
            );
        }

        return destsToRender.map((dest, index) => {
            console.log(`Rendering destination ${index}:`, dest);

            // Tìm coverImg từ nhiều nguồn có thể
            const coverImg = dest.coverImg || dest.image || dest.coverImage || dest.img || dest.thumbnail;

            // Tạo fallback image URL
            let imageUrl = '';

            if (coverImg && typeof coverImg === 'string' && coverImg.trim() !== '') {
                imageUrl = coverImg;
                console.log(`Using coverImg for ${dest.name}:`, imageUrl);
            } else {
                // Fallback to Unsplash based on destination name/city
                const searchQuery = encodeURIComponent(`${dest.name} ${dest.city || ''}`.trim());
                imageUrl = `https://source.unsplash.com/featured/500x300/?${searchQuery},vietnam,tourism`;
                console.log(`Using Unsplash fallback for ${dest.name}:`, imageUrl);
            }

            return (
                <div key={dest._id || index} className="destination-card-small">
                    <div className="image-container">
                        <img
                            src={imageUrl}
                            alt={dest.name || 'Destination'}
                            className="destination-img"
                            loading="lazy"
                            onError={(e) => {
                                console.error(`Image error for ${dest.name}:`, imageUrl);
                                console.log('Destination object:', dest);

                                // Try Cloudinary fallback first
                                if (dest.name) {
                                    const cloudinaryUrl = `https://res.cloudinary.com/drmswobax/image/upload/v1765500672/${encodeURIComponent(dest.name.toLowerCase().replace(/\s+/g, '-'))}`;
                                    e.target.src = cloudinaryUrl;
                                    e.target.onerror = () => {
                                        // Ultimate fallback
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dest.name.charAt(0))}&background=667eea&color=fff&size=150`;
                                    };
                                }
                            }}
                            onLoad={() => console.log(`Image loaded for ${dest.name}`)}
                        />
                        {!coverImg && (
                            <div className="image-warning">
                                <ImageIcon size={14} />
                                <span>Default image</span>
                            </div>
                        )}
                    </div>

                    <div className="destination-info">
                        <div className="destination-header">
                            <div className="destination-name">{dest.name || 'Unknown Destination'}</div>
                            {dest.isPopular && (
                                <span className="popular-badge">Popular</span>
                            )}
                        </div>

                        <div className="destination-location">
                            <MapPin size={14} />
                            <span>{dest.city || ''}{dest.city && dest.country ? ', ' : ''}{dest.country || 'Vietnam'}</span>
                        </div>

                        {dest.description && (
                            <div className="destination-description">
                                {dest.description.length > 80
                                    ? `${dest.description.substring(0, 80)}...`
                                    : dest.description}
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    // Render rating stars
    const renderRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Star key={i} size={16} fill="#fbbf24" stroke="#fbbf24" />);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(<Star key={i} size={16} fill="#fbbf24" stroke="#fbbf24" />);
            } else {
                stars.push(<Star key={i} size={16} fill="none" stroke="#d1d5db" />);
            }
        }

        return stars;
    };
    // Generate time slots
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 20) slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };
    // Calculate total price
    const calculateTotalPrice = () => {
        if (!buddy) return 0;
        return buddy.hourlyRate * bookingDuration;
    };
    // Handle booking
    const handleBookNow = () => {
        if (!selectedDate || !selectedTime) {
            alert('Please select date and time');
            return;
        }

        setShowBookingModal(true);
    };


    // Render activities từ buddy.relatedActivities (đã được populate)
    const renderActivities = () => {
        if (!buddy || !buddy.relatedActivities || buddy.relatedActivities.length === 0) {
            return (
                <div className="no-data-message">
                    <span className="activity-icon">🎯</span>
                    <p>No activities available</p>
                </div>
            );
        }

        return buddy.relatedActivities.map((activity, index) => {
            // Nếu activity là string ID
            if (typeof activity === 'string') {
                return (
                    <div key={activity || index} className="activity-item">
                        <div className="activity-icon">🎯</div>
                        <div className="activity-info">
                            <div className="activity-name">Activity ID: {activity.substring(0, 8)}...</div>
                            <div className="activity-category">Loading...</div>
                        </div>
                    </div>
                );
            }

            // Nếu activity là object
            if (!activity || !activity.name) {
                return (
                    <div key={activity?._id || index} className="activity-item">
                        <div className="activity-icon">🎯</div>
                        <div className="activity-info">
                            <div className="activity-name">Unknown Activity</div>
                            <div className="activity-category">General</div>
                        </div>
                    </div>
                );
            }

            return (
                <div key={activity._id} className="activity-item">
                    <div
                        className="activity-icon"
                        style={{ backgroundColor: activity.color || '#2563eb' }}
                    >
                        {activity.icon || '🎯'}
                    </div>
                    <div className="activity-info">
                        <div className="activity-name">{activity.name}</div>
                        <div className="activity-category">{activity.category || 'General'}</div>
                    </div>
                </div>
            );
        });
    };


    // Render review
    const renderReview = (review, index) => (
        <div key={index} className="review-card">
            <div className="review-header">
                <div className="reviewer-info">
                    <div className="reviewer-avatar">
                        {review.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="reviewer-name">{review.user?.name || 'Anonymous'}</div>
                        <div className="review-date">{new Date(review.date).toLocaleDateString()}</div>
                    </div>
                </div>
                <div className="review-rating">
                    {renderRatingStars(review.rating)}
                </div>
            </div>
            <p className="review-comment">{review.comment}</p>
        </div>
    );

    if (loading) {
        return (
            <div className="buddy-profile-page loading">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading buddy profile...</p>
                </div>
            </div>
        );
    }

    if (error || !buddy) {
        return (
            <div className="buddy-profile-page error">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Profile Not Found</h3>
                    <p>{error || 'The buddy profile you are looking for does not exist.'}</p>
                    <button onClick={() => navigate('/buddies')} className="back-btn">
                        ← Browse All Buddies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="buddy-profile-page">
            {/* Header with Back Button */}
            <div className="profile-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Back
                </button>
                <h1 className="profile-title">{buddy.name}'s Profile</h1>
            </div>

            <div className="profile-container">
                {/* Left Column - Profile Info */}
                <div className="profile-left">
                    {/* Profile Card */}
                    <div className="profile-card">
                        <div className="profile-header-section">
                            <div className="avatar-section">
                                <img
                                    src={buddy.pfp || `https://ui-avatars.com/api/?name=${buddy.name}&background=667eea&color=fff`}
                                    alt={buddy.name}
                                    className="profile-avatar"
                                />
                                {buddy.isAvailableNow && (
                                    <div className="online-status">
                                        <div className="online-dot"></div>
                                        <span>Online</span>
                                    </div>
                                )}
                                {buddy.isVerified && (
                                    <div className="verified-badge">
                                        <CheckCircle size={16} />
                                        <span>Verified</span>
                                    </div>
                                )}
                            </div>

                            <div className="profile-basic-info">
                                <h2 className="profile-name">{buddy.name}</h2>
                                <div className="profile-rating">
                                    <div className="rating-stars">
                                        {renderRatingStars(buddy.rating?.average || 0)}
                                        <span className="rating-value">{buddy.rating?.average?.toFixed(1) || 0.0}</span>
                                        <span className="rating-count">({buddy.rating?.count || 0} reviews)</span>
                                    </div>
                                </div>

                                <div className="profile-price">
                                    <span className="price-amount">${buddy.hourlyRate}</span>
                                    <span className="price-unit">/hour</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="profile-stats">
                            <div className="stat-item">
                                <Users size={20} />
                                <div>
                                    <div className="stat-number">{buddy.completedBookings || 0}</div>
                                    <div className="stat-label">Bookings</div>
                                </div>
                            </div>
                            <div className="stat-item">
                                <Clock size={20} />
                                <div>
                                    <div className="stat-number">{buddy.yearsOfExperience || 0}</div>
                                    <div className="stat-label">Years Exp</div>
                                </div>
                            </div>
                            <div className="stat-item">
                                <Award size={20} />
                                <div>
                                    <div className="stat-number">{buddy.rating?.count || 0}</div>
                                    <div className="stat-label">Reviews</div>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        {buddy.bio && (
                            <div className="profile-bio">
                                <h3>About Me</h3>
                                <p>{buddy.bio}</p>
                            </div>
                        )}

                        {/* Languages */}
                        {buddy.languages && buddy.languages.length > 0 && (
                            <div className="profile-languages">
                                <h3>
                                    <Globe size={18} />
                                    Languages
                                </h3>
                                <div className="language-tags">
                                    {buddy.languages.map((lang, index) => (
                                        <span key={index} className="language-tag">{lang}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Specialties */}
                        {buddy.specialties && buddy.specialties.length > 0 && (
                            <div className="profile-specialties">
                                <h3>Specialties</h3>
                                <div className="specialty-tags">
                                    {buddy.specialties.map((specialty, index) => (
                                        <span key={index} className="specialty-tag">{specialty}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Destination Section */}
                    <div className="profile-destinations">
                        <h3>
                            <MapPin size={18} />
                            Available Destinations ({buddy.relatedDestination?.length || 0})
                        </h3>
                        <div className="destinations-grid">
                            {renderDestinations()}
                        </div>
                    </div>
                </div>

                {/* Right Column - Booking & Details */}
                <div className="profile-right">
                    {/* Booking Card */}
                    <div className="booking-card">
                        <h3>Book {buddy.name}</h3>

                        <div className="booking-form">
                            <div className="form-group">
                                <label>
                                    <Calendar size={16} />
                                    Select Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="date-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Clock size={16} />
                                    Select Time
                                </label>
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="time-select"
                                >
                                    <option value="">Select time</option>
                                    {generateTimeSlots().map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Duration (hours)</label>
                                <div className="duration-selector">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(hours => (
                                        <button
                                            key={hours}
                                            className={`duration-btn ${bookingDuration === hours ? 'selected' : ''}`}
                                            onClick={() => setBookingDuration(hours)}
                                        >
                                            {hours}h
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="price-summary">
                                <div className="price-row">
                                    <span>${buddy.hourlyRate} × {bookingDuration} hours</span>
                                    <span>${buddy.hourlyRate * bookingDuration}</span>
                                </div>
                                <div className="price-row total">
                                    <span>Total</span>
                                    <span>${calculateTotalPrice()}</span>
                                </div>
                            </div>

                            <button
                                className="book-now-btn"
                                onClick={handleBookNow}
                                disabled={!buddy.isAvailableNow}
                            >
                                {buddy.isAvailableNow ? 'Book Now' : 'Not Available'}
                            </button>

                            {!buddy.isAvailableNow && (
                                <p className="not-available-text">
                                    {buddy.name} is not available for booking at the moment.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Activities Section */}
                    <div className="activities-section">
                        <h3>Available Activities ({buddy?.relatedActivities?.length || 0})</h3>
                        <div className="activities-list">
                            {renderActivities()}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="contact-section">
                        <h3>Contact Information</h3>
                        <div className="contact-info">
                            <div className="contact-item">
                                <span className="contact-label">Response Time:</span>
                                <span className="contact-value">Usually responds within 1 hour</span>
                            </div>
                            <div className="contact-item">
                                <span className="contact-label">Last Online:</span>
                                <span className="contact-value">
                                    {new Date(buddy.lastOnline).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs for Additional Info */}
            <div className="profile-tabs">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn ${selectedTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('reviews')}
                    >
                        Reviews ({buddy.rating?.count || 0})
                    </button>
                    <button
                        className={`tab-btn ${selectedTab === 'availability' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('availability')}
                    >
                        Availability
                    </button>
                </div>

                <div className="tabs-content">
                    {selectedTab === 'overview' && (
                        <div className="tab-panel overview">
                            <h3>About My Tours</h3>
                            <p>
                                I specialize in creating memorable experiences that go beyond typical tourist attractions.
                                Whether you're looking for hidden gems, local cuisine, or cultural insights, I'll tailor the
                                experience to your interests.
                            </p>

                            <h3>What to Expect</h3>
                            <ul className="expectations-list">
                                <li>✓ Personalized itinerary based on your interests</li>
                                <li>✓ Local insights and hidden gems</li>
                                <li>✓ Flexible schedule and pacing</li>
                                <li>✓ Cultural and historical context</li>
                                <li>✓ Photo opportunities at scenic spots</li>
                                <li>✓ Recommendations for your entire trip</li>
                            </ul>
                        </div>
                    )}

                    {selectedTab === 'reviews' && (
                        <div className="tab-panel reviews">
                            <div className="reviews-summary">
                                <div className="average-rating">
                                    <div className="rating-number-large">{buddy.rating?.average?.toFixed(1) || 0.0}</div>
                                    <div className="rating-stars-large">
                                        {renderRatingStars(buddy.rating?.average || 0)}
                                    </div>
                                    <div className="rating-count">{buddy.rating?.count || 0} reviews</div>
                                </div>

                                <div className="rating-breakdown">
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = buddy.rating?.breakdown?.[star] || 0;
                                        const percentage = buddy.rating?.count ? (count / buddy.rating.count) * 100 : 0;

                                        return (
                                            <div key={star} className="breakdown-row">
                                                <span className="star-label">{star} star{star !== 1 ? 's' : ''}</span>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="breakdown-count">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="reviews-list">
                                {buddy.featuredReviews && buddy.featuredReviews.length > 0 ? (
                                    buddy.featuredReviews.map((review, index) => renderReview(review, index))
                                ) : (
                                    <div className="no-reviews">
                                        <p>No reviews yet. Be the first to book with {buddy.name}!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'availability' && (
                        <div className="tab-panel availability">
                            <h3>Weekly Availability</h3>
                            <div className="availability-calendar">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <div key={day} className="availability-day">
                                        <div className="day-name">{day}</div>
                                        <div className="time-slots">
                                            {buddy.availability?.[day] ? (
                                                buddy.availability[day].map((slot, index) => (
                                                    <span key={index} className="time-slot">{slot}</span>
                                                ))
                                            ) : (
                                                <span className="not-available">Not Available</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="booking-modal">
                    <div className="modal-overlay" onClick={() => setShowBookingModal(false)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Confirm Booking</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowBookingModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="booking-details">
                                <div className="detail-row">
                                    <span>Guide:</span>
                                    <span>{buddy.name}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Date:</span>
                                    <span>{selectedDate}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Time:</span>
                                    <span>{selectedTime}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Duration:</span>
                                    <span>{bookingDuration} hours</span>
                                </div>
                                <div className="detail-row">
                                    <span>Total Price:</span>
                                    <span className="total-price">${calculateTotalPrice()}</span>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setShowBookingModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="confirm-btn"
                                    onClick={() => {
                                        alert(`Booking confirmed with ${buddy.name}!`);
                                        setShowBookingModal(false);
                                    }}
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuddyProfilePage;