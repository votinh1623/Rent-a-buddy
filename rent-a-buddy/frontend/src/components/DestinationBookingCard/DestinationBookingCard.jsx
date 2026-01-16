import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CreditCard, CheckCircle } from 'lucide-react';
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

    // Tính ngày min (ngày hiện tại)
    const today = new Date().toISOString().split('T')[0];

    // Tạo time slots
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 20) slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    // Tính tổng giá
    const calculateTotalPrice = () => {
        if (!buddy || !buddy.hourlyRate) return 0;

        let basePrice = buddy.hourlyRate * bookingDuration;

        // Phí thêm nếu nhiều người tham gia (trên 2 người)
        if (participants > 2) {
            const additionalPeople = participants - 2;
            basePrice += (buddy.hourlyRate * 0.2 * additionalPeople * bookingDuration);
        }

        return Math.round(basePrice);
    };

    // Kiểm tra availability
    const checkAvailability = () => {
        if (!selectedDate || !selectedTime) return false;

        // Kiểm tra nếu buddy không available
        if (!buddy?.isAvailableNow) return false;

        // Kiểm tra nếu destination không available
        if (destination?.status && destination.status !== 'active') return false;

        return true;
    };

    // Xử lý booking
    const handleBooking = async () => {
        if (!checkAvailability()) {
            alert('Please select date and time, or check availability');
            return;
        }

        setIsLoading(true);

        try {
            // Gọi API booking
            const bookingData = {
                destinationId: destination?._id,
                buddyId: buddy?._id,
                date: selectedDate,
                time: selectedTime,
                duration: bookingDuration,
                participants: participants,
                specialRequests: specialRequests,
                totalPrice: calculateTotalPrice()
            };

            // Gửi request đến API
            const response = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (result.success) {
                setShowSuccess(true);
                if (onBookingSuccess) onBookingSuccess(result.data);

                // Reset form sau 3 giây
                setTimeout(() => {
                    setShowSuccess(false);
                    setSelectedDate('');
                    setSelectedTime('');
                    setBookingDuration(2);
                    setParticipants(1);
                    setSpecialRequests('');
                }, 3000);
            } else {
                alert(result.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('An error occurred. Please try again.');
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

                    <div className="price-row total">
                        <span>
                            <CreditCard size={16} />
                            Total
                        </span>
                        <span className="total-price">${calculateTotalPrice()}</span>
                    </div>
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