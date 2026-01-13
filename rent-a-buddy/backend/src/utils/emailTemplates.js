// backend/src/utils/emailTemplates.js

export const generateBookingConfirmation = (recipientEmail, recipientName, otherPartyName, booking, isGuideNotification = false) => {
  const formattedDate = booking.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const startTime = booking.startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const endTime = booking.endTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const subject = isGuideNotification 
    ? `New Booking Request: ${recipientName} wants to book your tour`
    : `Booking Confirmation: Your tour with ${otherPartyName}`;
  
  const greeting = isGuideNotification
    ? `Hi ${recipientName},`
    : `Dear ${recipientName},`;
  
  const content = isGuideNotification
    ? `
      You have received a new booking request!<br><br>
      
      <strong>Booking Details:</strong><br>
      - Traveller: ${otherPartyName}<br>
      - Date: ${formattedDate}<br>
      - Time: ${startTime} - ${endTime}<br>
      - Duration: ${booking.duration} hours<br>
      - Number of People: ${booking.numberOfPeople}<br>
      - Total Price: $${booking.totalPrice}<br>
      ${booking.specialRequests ? `- Special Requests: ${booking.specialRequests}<br>` : ''}
      
      Please log in to your account to confirm or cancel this booking.<br><br>
      
      Best regards,<br>
      Rent-a-Buddy Team
    `
    : `
      Your booking has been received!<br><br>
      
      <strong>Booking Details:</strong><br>
      - Guide: ${otherPartyName}<br>
      - Date: ${formattedDate}<br>
      - Time: ${startTime} - ${endTime}<br>
      - Duration: ${booking.duration} hours<br>
      - Number of People: ${booking.numberOfPeople}<br>
      - Total Price: $${booking.totalPrice}<br>
      ${booking.meetingPoint ? `- Meeting Point: ${booking.meetingPoint}<br>` : ''}
      ${booking.specialRequests ? `- Special Requests: ${booking.specialRequests}<br>` : ''}
      
      Your guide will contact you soon to confirm the booking.<br><br>
      
      Best regards,<br>
      Rent-a-Buddy Team
    `;
  
  return {
    to: recipientEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rent-a-Buddy</h1>
            <p>${subject}</p>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <div class="details">
              ${content}
            </div>
            <p>Need help? Contact our support team at support@rentabuddy.com</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Rent-a-Buddy. All rights reserved.</p>
            <p>This email was sent to ${recipientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export const generateBookingStatusUpdate = (recipientEmail, recipientName, booking, newStatus) => {
  const statusMessages = {
    confirmed: 'Your booking has been confirmed!',
    cancelled: 'Your booking has been cancelled',
    completed: 'Your booking has been marked as completed'
  };
  
  const subject = statusMessages[newStatus] || 'Booking Status Update';
  
  return {
    to: recipientEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .status-${newStatus} { 
            background: ${newStatus === 'confirmed' ? '#48bb78' : newStatus === 'cancelled' ? '#f56565' : '#4299e1'}; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 5px; 
            display: inline-block; 
            font-weight: bold; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rent-a-Buddy</h1>
            <p>${subject}</p>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>The status of your booking has been updated to:</p>
            <div class="status-${newStatus}">${newStatus.toUpperCase()}</div>
            <p>Booking ID: ${booking._id}</p>
            <p>Date: ${booking.date.toLocaleDateString()}</p>
            ${booking.cancellationReason ? `<p>Cancellation Reason: ${booking.cancellationReason}</p>` : ''}
            <br>
            <p>Best regards,<br>Rent-a-Buddy Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export const generateReviewNotification = (guideEmail, guideName, travellerName, rating, comment) => {
  return {
    to: guideEmail,
    subject: `New Review from ${travellerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .rating { color: #f6e05e; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rent-a-Buddy</h1>
            <p>New Review Received</p>
          </div>
          <div class="content">
            <p>Hi ${guideName},</p>
            <p>${travellerName} has left you a review!</p>
            <div class="rating">${'★'.repeat(rating)}${'☆'.repeat(5-rating)} (${rating}/5)</div>
            <p><strong>Comment:</strong> "${comment}"</p>
            <br>
            <p>This review will help future travellers choose you as their guide.</p>
            <p>Best regards,<br>Rent-a-Buddy Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export const generateWelcomeEmail = (email, name) => {
  return {
    to: email,
    subject: 'Welcome to Rent-a-Buddy!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .welcome-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rent-a-Buddy</h1>
            <p>Welcome to Our Community!</p>
          </div>
          <div class="content">
            <div class="welcome-icon">👋</div>
            <p>Hi ${name},</p>
            <p>Welcome to Rent-a-Buddy! We're excited to have you join our community.</p>
            <p>Whether you're looking for a local guide or want to share your city's secrets, we're here to help you connect.</p>
            <p>Get started by:</p>
            <ul>
              <li>Updating your profile</li>
              <li>Browsing available guides/destinations</li>
              <li>Booking your first tour</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <br>
            <p>Happy exploring!</p>
            <p>Best regards,<br>The Rent-a-Buddy Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Helper function để gửi email (place holder)
export const sendEmail = async (emailData) => {
  console.log('📧 Email would be sent to:', emailData.to);
  console.log('📧 Subject:', emailData.subject);
  
  // Ở đây bạn có thể tích hợp với email service như:
  // - Nodemailer (Gmail, SMTP)
  // - SendGrid
  // - Mailgun
  // - AWS SES
  
  return {
    success: true,
    message: 'Email queued for sending (simulated)',
    data: {
      to: emailData.to,
      subject: emailData.subject
    }
  };
};