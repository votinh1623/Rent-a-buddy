// src/components/MessageItem/MessageItem.jsx
import React from 'react';
import { FaUserCircle, FaCheckDouble, FaCheck } from 'react-icons/fa';
import './MessageItem.scss';

const MessageItem = ({ 
  message, 
  onClick,
  active = false 
}) => {
  const formatTime = (time) => {
    if (!time) return '';
    
    // If time is in "X ago" format, keep it as is
    if (time.includes('ago')) return time;
    
    // Otherwise format as time
    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`message-item ${active ? 'active' : ''} ${message?.unread ? 'unread' : ''}`} onClick={onClick}>
      <div className="message-avatar">
        {message?.senderAvatar ? (
          <img 
            src={message.senderAvatar} 
            alt={message.sender}
            className="avatar-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=667eea&color=fff`;
            }}
          />
        ) : (
          <div className="avatar-fallback">
            <FaUserCircle />
          </div>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <div className="sender-info">
            <span className="sender-name">{message?.sender || 'User'}</span>
            {message?.unread && <span className="unread-badge">New</span>}
          </div>
          <div className="message-meta">
            <span className="message-time">{formatTime(message?.time)}</span>
            {message?.readStatus && (
              <span className="read-status">
                {message.readStatus === 'read' ? <FaCheckDouble /> : <FaCheck />}
              </span>
            )}
          </div>
        </div>
        
        <div className="message-body">
          <p className="message-preview">
            {message?.message || 'No message'}
          </p>
          {message?.attachment && (
            <span className="attachment-indicator">
              📎 Attachment
            </span>
          )}
        </div>
      </div>
      
      {message?.unread && <div className="unread-indicator"></div>}
    </div>
  );
};

export default MessageItem;