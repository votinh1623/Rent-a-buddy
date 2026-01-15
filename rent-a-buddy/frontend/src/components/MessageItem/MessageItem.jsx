import React from 'react';
import { FaUserCircle, FaCheckDouble, FaCheck } from 'react-icons/fa';
import './MessageItem.scss';

const MessageItem = ({
  conversation,
  currentUserId,
  onClick,
  active = false
}) => {
  // Sử dụng otherParticipant từ conversation
  const getParticipantInfo = () => {
    // Nếu conversation có otherParticipant
    if (conversation?.otherParticipant) {
      const other = conversation.otherParticipant;
      return {
        name: other.name || other.username || 'User',
        pfp: other.pfp || other.avatar || other.profilePicture || null,
        id: other._id || other.id,
        role: other.role,
        email: other.email
      };
    }
    
    // Nếu là group chat và có tên conversation
    if (conversation?.name && conversation.isGroup) {
      return {
        name: conversation.name,
        pfp: conversation.groupAvatar || null,
        id: conversation._id,
        isGroup: true
      };
    }
    
    // Fallback
    return { 
      name: 'User', 
      pfp: null,
      id: null
    };
  };

  // Helper function to get avatar URL
  const getAvatarUrl = () => {
    const { pfp, name } = getParticipantInfo();

    if (pfp && pfp.trim() !== '') {
      return pfp;
    }

    // Fallback to UI Avatars với tên thực tế
    const displayName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=667eea&color=fff&bold=true`;
  };

  // Helper function to get participant name
  const getParticipantName = () => {
    const info = getParticipantInfo();
    
    // Nếu là group chat
    if (info.isGroup) {
      return info.name || 'Group Chat';
    }
    
    // Trả về tên của otherParticipant
    return info.name || 'User';
  };

  // Helper function to get last message info
  const getLastMessageInfo = () => {
    if (!conversation?.lastMessage) {
      return { 
        text: 'No messages yet', 
        sender: null, 
        time: conversation?.updatedAt || conversation?.createdAt 
      };
    }

    const lastMsg = conversation.lastMessage;

    // Determine if last message was sent by current user
    const isSentByCurrentUser = lastMsg.sender?._id?.toString() === currentUserId?.toString() ||
                                lastMsg.sender?.toString() === currentUserId?.toString();

    // Format message content
    let messageText = '';
    if (lastMsg.text) {
      messageText = lastMsg.text;
    } else if (lastMsg.image) {
      messageText = '📷 Photo';
    } else if (lastMsg.file) {
      messageText = '📎 File';
    } else if (lastMsg.location) {
      messageText = '📍 Location';
    } else {
      messageText = 'New message';
    }

    return {
      text: messageText,
      sender: lastMsg.sender,
      time: lastMsg.timestamp || lastMsg.createdAt || conversation.updatedAt,
      isSentByCurrentUser,
      prefix: isSentByCurrentUser ? 'You: ' : ''
    };
  };

  const formatTime = (time) => {
    if (!time) return '';

    // If time is in "X ago" format, keep it as is
    if (typeof time === 'string' && time.includes('ago')) return time;

    // Otherwise format as time
    const date = new Date(time);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    if (!conversation || !currentUserId) return 0;
    
    // Cách 1: Nếu có unreadCount field đơn giản
    if (conversation.unreadCount !== undefined) {
      return conversation.unreadCount;
    }
    
    // Cách 2: Nếu có unreadCounts object
    if (conversation.unreadCounts && typeof conversation.unreadCounts === 'object') {
      // Nếu là Map
      if (conversation.unreadCounts instanceof Map) {
        return conversation.unreadCounts.get(currentUserId.toString()) || 0;
      }
      // Nếu là plain object
      return conversation.unreadCounts[currentUserId.toString()] || 0;
    }
    
    // Cách 3: Nếu là array
    if (Array.isArray(conversation.unreadCounts)) {
      const userUnread = conversation.unreadCounts.find(
        unread => unread.userId?.toString() === currentUserId.toString()
      );
      return userUnread?.count || 0;
    }
    
    return 0;
  };

  const participantName = getParticipantName();
  const avatarUrl = getAvatarUrl();
  const lastMessage = getLastMessageInfo();
  const unreadCount = getUnreadCount();
  const hasUnread = unreadCount > 0;
  const formattedTime = formatTime(lastMessage.time);

  return (
    <div className={`message-item ${active ? 'active' : ''} ${hasUnread ? 'unread' : ''}`} onClick={onClick}>
      <div className="message-avatar">
        <img
          src={avatarUrl}
          alt={participantName}
          className="avatar-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              participantName.charAt(0) || 'U'
            )}&background=667eea&color=fff&bold=true`;
          }}
        />
        {/* Online indicator nếu có thông tin */}
        {conversation?.otherParticipant?.isOnline ||
         (conversation?.otherParticipant?.lastActive && 
          new Date(conversation.otherParticipant.lastActive) > new Date(Date.now() - 5 * 60 * 1000)) ? (
          <div className="online-indicator"></div>
        ) : null}
      </div>

      <div className="message-content">
        <div className="message-header">
          <div className="sender-info">
            <span className="sender-name">{participantName}</span>
            {conversation?.booking && (
              <span className="booking-badge">📅 Booking</span>
            )}
            {/* Hiển thị role nếu có */}
            {conversation?.otherParticipant?.role && (
              <span className={`role-badge ${conversation.otherParticipant.role}`}>
                {conversation.otherParticipant.role}
              </span>
            )}
          </div>
          <div className="message-meta">
            <span className="message-time">{formattedTime}</span>
            {lastMessage.sender && lastMessage.isSentByCurrentUser && (
              <span className="read-status">
                {conversation.lastMessage?.readBy?.length > 0 ?
                  <FaCheckDouble title="Read" className="read-icon" /> :
                  <FaCheck title="Sent" className="sent-icon" />}
              </span>
            )}
          </div>
        </div>

        <div className="message-body">
          <p className="message-preview">
            <span className="message-prefix">{lastMessage.prefix}</span>
            {lastMessage.text}
          </p>
          {hasUnread && (
            <span className="unread-count-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;