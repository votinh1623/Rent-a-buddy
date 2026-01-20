import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CreditCard, CheckCircle, Check, Filter } from 'lucide-react';
import './DestinationBookingCard.scss';

const DestinationBookingCard = ({
    destination,
    buddy,
    onBookingSuccess
}) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingDuration, setBookingDuration] = useState(2);
    const [specialRequests, setSpecialRequests] = useState('');
    const [participants, setParticipants] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [availableActivities, setAvailableActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    // Tính ngày min (ngày hiện tại)
    const today = new Date().toISOString().split('T')[0];

    // Fetch activities intersection - CẢ HAI ĐIỀU KIỆN
    useEffect(() => {
        const fetchIntersectionActivities = async () => {
            if (!buddy?._id || !destination?._id) {
                setAvailableActivities([]);
                return;
            }

            setLoadingActivities(true);
            try {
                console.log('Fetching activities intersection for:', {
                    buddyId: buddy._id,
                    destinationId: destination._id
                });

                // Fetch cả hai API song song
                const [destinationActivitiesRes, guideActivitiesRes] = await Promise.all([
                    fetch(`/api/destinations/${destination._id}/activities`),
                    fetch(`/api/activities/guide/${buddy._id}`)
                ]);

                // Parse responses
                const destinationData = destinationActivitiesRes.ok
                    ? await destinationActivitiesRes.json()
                    : { success: false, data: [] };

                const guideData = guideActivitiesRes.ok
                    ? await guideActivitiesRes.json()
                    : { success: false, data: [] };

                console.log('Destination activities:', destinationData);
                console.log('Guide activities:', guideData);

                // Lấy intersection (giao) của hai tập hợp
                let destinationActivities = [];
                let guideActivities = [];

                if (destinationData.success && destinationData.data) {
                    destinationActivities = Array.isArray(destinationData.data)
                        ? destinationData.data
                        : [];
                }

                if (guideData.success && guideData.data) {
                    guideActivities = Array.isArray(guideData.data)
                        ? guideData.data
                        : [];
                }

                // Tìm intersection dựa trên _id
                const guideActivityIds = new Set(
                    guideActivities.map(act => act._id?.toString())
                );

                const intersectionActivities = destinationActivities.filter(act =>
                    act._id && guideActivityIds.has(act._id.toString())
                );

                console.log('Intersection activities:', intersectionActivities);

                // Nếu không có intersection, có thể hiển thị cả hai hoặc một trong hai
                let finalActivities = intersectionActivities;

                if (intersectionActivities.length === 0) {
                    // Fallback: hiển thị activities của destination nếu không có intersection
                    finalActivities = destinationActivities.length > 0
                        ? destinationActivities
                        : guideActivities;

                    console.log('No intersection, using fallback:', finalActivities);
                }

                setAvailableActivities(finalActivities);

            } catch (error) {
                console.error('Error fetching activities intersection:', error);
                // Fallback: sử dụng activities từ destination nếu có
                if (destination?.activities) {
                    const destActivities = Array.isArray(destination.activities)
                        ? destination.activities
                        : [];
                    setAvailableActivities(destActivities);
                }
            } finally {
                setLoadingActivities(false);
            }
        };

        fetchIntersectionActivities();
    }, [buddy, destination]);
    const checkAvailability = () => {
        if (!selectedDate || !selectedTime) return false;

        // Kiểm tra nếu buddy không available
        if (!buddy?.isAvailableNow) return false;

        // Kiểm tra nếu destination không available
        if (destination?.status && destination.status !== 'active') return false;

        return true;
    };
    // Handle activity selection
    const handleActivityToggle = (activityId) => {
        setSelectedActivities(prev => {
            if (prev.includes(activityId)) {
                return prev.filter(id => id !== activityId);
            } else {
                return [...prev, activityId];
            }
        });
    };

    // Select all activities
    const handleSelectAll = () => {
        if (availableActivities.length === 0) return;

        const allIds = availableActivities.map(act => act._id).filter(id => id);
        setSelectedActivities(allIds);
    };

    // Clear all selections
    const handleClearAll = () => {
        setSelectedActivities([]);
    };

    // Tạo time slots
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 20) slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    // Tính tổng giá - thêm phí cho activities
    const calculateTotalPrice = () => {
        if (!buddy || !buddy.hourlyRate) return 0;

        let basePrice = buddy.hourlyRate * bookingDuration;

        // Phí thêm nếu nhiều người tham gia (trên 2 người)
        if (participants > 2) {
            const additionalPeople = participants - 2;
            basePrice += (buddy.hourlyRate * 0.2 * additionalPeople * bookingDuration);
        }

        // Phí thêm cho activities (10% cho mỗi activity)
        const activityPremium = selectedActivities.length > 0
            ? basePrice * (0.1 * selectedActivities.length)
            : 0;

        return Math.round(basePrice + activityPremium);
    };

    // Render activities selection với thông tin chi tiết
    const renderActivitiesSelection = () => {
        if (loadingActivities) {
            return (
                <div className="activities-loading">
                    <div className="loading-spinner-small"></div>
                    <span>Finding available activities for this tour...</span>
                </div>
            );
        }

        if (availableActivities.length === 0) {
            return (
                <div className="no-activities">
                    <Filter size={20} />
                    <p>No specific activities available for this destination with {buddy?.name}.</p>
                    <p className="info-text">General tour activities will be provided.</p>
                </div>
            );
        }

        return (
            <>
                <div className="activities-header">
                    <div className="activities-title">
                        <h4>Select Tour Activities</h4>
                        <p className="subtitle">
                            Activities available at {destination?.name} with {buddy?.name}
                        </p>
                    </div>
                    <div className="activity-actions">
                        <button
                            type="button"
                            className="select-all-btn"
                            onClick={handleSelectAll}
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            className="clear-all-btn"
                            onClick={handleClearAll}
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="activities-list">
                    {availableActivities.map(activity => (
                        <div
                            key={activity._id}
                            className={`activity-item ${selectedActivities.includes(activity._id) ? 'selected' : ''}`}
                            onClick={() => handleActivityToggle(activity._id)}
                        >
                            <div className="activity-checkbox">
                                {selectedActivities.includes(activity._id) && (
                                    <Check size={14} />
                                )}
                            </div>
                            <div className="activity-info">
                                <div className="activity-header">
                                    <div className="activity-name">{activity.name}</div>
                                    {activity.isPopular && (
                                        <span className="popular-badge">Popular</span>
                                    )}
                                </div>

                                {activity.category && (
                                    <div className="activity-category">
                                        {activity.icon || '🎯'} {activity.category}
                                    </div>
                                )}

                                {activity.description && (
                                    <div className="activity-description">
                                        {activity.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedActivities.length > 0 && (
                    <div className="selected-summary">
                        <div className="selected-count">
                            <Check size={14} />
                            {selectedActivities.length} of {availableActivities.length} activities selected
                        </div>
                        <div className="premium-note">
                            +{selectedActivities.length * 10}% premium applied
                        </div>
                    </div>
                )}
            </>
        );
    };

    // Xử lý booking - sử dụng selectedActivities
    const handleBooking = async () => {
        if (!checkAvailability()) {
            alert('Please select date and time, or check availability');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('accessToken');

            const bookingData = {
                buddy: buddy?._id,
                destination: destination?._id,
                activities: selectedActivities,
                startDate: selectedDate,
                startTime: selectedTime,
                duration: bookingDuration,
                numberOfPeople: participants,
                specialRequests: specialRequests,
                paymentMethod: paymentMethod
            };

            console.log('Booking request:', bookingData);

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            if (result.success) {
                setShowSuccess(true);
                if (onBookingSuccess) onBookingSuccess(result.data);

                setTimeout(() => {
                    setShowSuccess(false);
                    setSelectedDate('');
                    setSelectedTime('');
                    setBookingDuration(2);
                    setParticipants(1);
                    setSpecialRequests('');
                    setPaymentMethod('cash');
                    setSelectedActivities([]);
                }, 3000);
            } else {
                throw new Error(result.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert(`Booking failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Render thành công
    if (showSuccess) {
        return (
            <div className="destination-booking-card success">
                <div className="success-icon">
                    <CheckCircle size={48} />
                </div>
                <h3>Booking Confirmed!</h3>
                <p>Your tour with {buddy?.name} has been booked successfully.</p>
                <div className="success-details">
                    <div className="detail-item">
                        <span>Date:</span>
                        <strong>{selectedDate}</strong>
                    </div>
                    <div className="detail-item">
                        <span>Time:</span>
                        <strong>{selectedTime}</strong>
                    </div>
                    <div className="detail-item">
                        <span>Activities:</span>
                        <strong>{selectedActivities.length} selected</strong>
                    </div>
                    <div className="detail-item">
                        <span>Total:</span>
                        <strong>${calculateTotalPrice()}</strong>
                    </div>
                </div>
                <p className="success-note">
                    You'll receive a confirmation email shortly.
                </p>
            </div>
        );
    }

    return (
        <div className="destination-booking-card">
            <div className="booking-header">
                <h3>
                    <Calendar size={20} />
                    Book This Tour
                </h3>
                <p>Experience {destination?.name} with {buddy?.name}</p>
            </div>

            <div className="booking-form">
                {/* Date Selection */}
                <div className="form-group">
                    <label>
                        <Calendar size={16} />
                        Select Date
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={today}
                        className="date-input"
                    />
                </div>

                {/* Time Selection */}
                <div className="form-group">
                    <label>
                        <Clock size={16} />
                        Select Time
                    </label>
                    <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="time-select"
                        disabled={!selectedDate}
                    >
                        <option value="">Select time</option>
                        {generateTimeSlots().map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>

                {/* Duration Selection */}
                <div className="form-group">
                    <label>Duration</label>
                    <div className="duration-selector">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(hours => (
                            <button
                                key={hours}
                                type="button"
                                className={`duration-btn ${bookingDuration === hours ? 'selected' : ''}`}
                                onClick={() => setBookingDuration(hours)}
                            >
                                {hours}h
                            </button>
                        ))}
                    </div>
                </div>

                {/* Participants */}
                <div className="form-group">
                    <label>
                        <Users size={16} />
                        Participants
                    </label>
                    <div className="participants-selector">
                        <button
                            type="button"
                            className="participant-btn"
                            onClick={() => setParticipants(Math.max(1, participants - 1))}
                            disabled={participants <= 1}
                        >
                            −
                        </button>
                        <span className="participant-count">{participants}</span>
                        <button
                            type="button"
                            className="participant-btn"
                            onClick={() => setParticipants(Math.min(10, participants + 1))}
                            disabled={participants >= 10}
                        >
                            +
                        </button>
                        <span className="participant-label">people</span>
                    </div>

                </div>

                {/* Activities Selection */}
                <div className="form-group activities-section">
                    <label>
                        <Filter size={16} />
                        Available Activities
                    </label>
                    <div className="activities-container">
                        {renderActivitiesSelection()}
                    </div>
                </div>

                {/* Special Requests */}
                <div className="form-group">
                    <label>Special Requests (Optional)</label>
                    <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any dietary restrictions, accessibility needs, or special preferences..."
                        rows="3"
                        className="special-requests"
                    />
                </div>

                {/* Price Summary */}
                <div className="price-summary">
                    <div className="price-row">
                        <span>Base rate (${buddy?.hourlyRate}/h × {bookingDuration}h)</span>
                        <span>${buddy?.hourlyRate * bookingDuration}</span>
                    </div>

                    {participants > 2 && (
                        <div className="price-row">
                            <span>Additional people ({(participants - 2)} × 20%)</span>
                            <span>+${(buddy?.hourlyRate * 0.2 * (participants - 2) * bookingDuration).toFixed(2)}</span>
                        </div>
                    )}

                    {selectedActivities.length > 0 && (
                        <div className="price-row">
                            <span>Activities premium ({selectedActivities.length} activities × 10%)</span>
                            <span>+${(buddy?.hourlyRate * bookingDuration * 0.1).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="price-row total">
                        <span>
                            <CreditCard size={16} />
                            Total
                        </span>
                        <span className="total-price">${calculateTotalPrice()}</span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="form-group">
                    <label>Payment Method</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-select"
                    >
                        <option value="cash">Cash (Pay at location)</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="paypal">PayPal</option>
                    </select>
                </div>

                {/* Booking Button */}
                <button
                    className={`book-now-btn ${!checkAvailability() ? 'disabled' : ''}`}
                    onClick={handleBooking}
                    disabled={!checkAvailability() || isLoading}
                >
                    {isLoading ? 'Processing...' : `Book Now with ${buddy?.name}`}
                </button>

                {/* Availability Status */}
                <div className="availability-status">
                    {!buddy?.isAvailableNow ? (
                        <p className="not-available">
                            ⚠️ {buddy?.name} is not available at the moment
                        </p>
                    ) : !selectedDate || !selectedTime ? (
                        <p className="select-info">
                            ⓘ Please select date and time to proceed
                        </p>
                    ) : (
                        <p className="available">
                            ✓ Available for booking on {selectedDate} at {selectedTime}
                        </p>
                    )}
                </div>

                {/* Terms */}
                <div className="booking-terms">
                    <p className="terms-text">
                        By booking, you agree to our <a href="/terms">Terms of Service</a> and
                        <a href="/cancellation"> Cancellation Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DestinationBookingCard;