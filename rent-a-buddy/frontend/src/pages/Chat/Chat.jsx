import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSocket from '../../hooks/useSocket';
import useConversations from '../../hooks/useConversations';
import { Input, Spin, Dropdown, Menu, Button, Modal, message as antdMessage } from 'antd';
import Swal from 'sweetalert2';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

import {
    Search, Paperclip, Smile, Send, Phone, MoreVertical,
    Edit, Trash2, X, Flag, MessageSquareDashed,
    PhoneMissed, PhoneOutgoing, PhoneIncoming, Video
} from 'lucide-react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { getMessages, findOrCreateConversation } from '../../service/messageService';
import { searchUsers } from '../../service/userService';
import ReportModal from '../../components/ReportModal/ReportModal';
import './Chat.scss';
import '../../layout/LayoutDefault/CallModal.scss';

const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const SharedPostSnippet = ({ postData, navigate }) => {
    if (!postData || !postData.userId) {
        return <div className="shared-post-snippet error">Post does not exist.</div>;
    }
    const isShared = postData.originalPostId;
    const originalPost = isShared ? postData.originalPostId : postData;
    const author = originalPost.userId;
    const story = originalPost.storyId;
    const postId = originalPost._id;

    const handleNavigation = (e) => {
        e.stopPropagation();
        const url = `/home/profile/${author._id}#${postId}`;
        navigate(url);
    };

    return (
        <div className="shared-post-snippet" onClick={handleNavigation}>
            <span className="shared-label">Shared post</span>
            <div className="shared-content">
                <img
                    className="shared-cover"
                    src={story?.coverImage || 'https://www.svgrepo.com/show/452030/avatar-default.svg'}
                    alt="Cover"
                />
                <div className="shared-info">
                    <strong className="shared-title">{story?.title || 'Deleted story'}</strong>
                    <p className="shared-caption">
                        {originalPost.caption || postData.sharedCaption || '—'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const CallMessageSnippet = ({ msg, currentUser, onCallAgain }) => {
    const isMyMsg = msg.senderId._id === currentUser?._id;
    const isMissed = msg.content === 'MISSED_CALL';

    let Icon = Video;
    let text = "Video call";
    let subText = "";
    let iconColor = "#555";
    let bgColor = "#f0f2f5";
    const canCallBack = isMissed && !isMyMsg;

    if (isMissed) {
        if (isMyMsg) {
            Icon = PhoneOutgoing;
            text = "Outgoing video call";
            subText = "Recipient didn't answer";
        } else {
            Icon = PhoneMissed;
            text = "Missed video call";
            subText = "Click to call back";
            iconColor = "#ff4d4f";
            bgColor = "#fff1f0";
        }
    } else {
        if (isMyMsg) {
            Icon = PhoneOutgoing;
            text = "Outgoing video call";
            subText = "Call ended";
        } else {
            Icon = PhoneIncoming;
            text = "Incoming video call";
            subText = "Call ended";
        }
    }

    return (
        <div
            className="call-message-snippet"
            onClick={() => {
                if (canCallBack) {
                    onCallAgain();
                }
            }}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 15px', borderRadius: '12px',
                background: bgColor, border: isMissed && !isMyMsg ? '1px solid #ffccc7' : '1px solid #e5e7eb',
                minWidth: '200px',
                cursor: canCallBack ? 'pointer' : 'default',
                transition: '0.2s'
            }}
            onMouseEnter={(e) => { if (canCallBack) e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={(e) => { if (canCallBack) e.currentTarget.style.opacity = '1'; }}
        >
            <div style={{
                background: isMissed && !isMyMsg ? '#ff4d4f' : '#ddd',
                padding: '8px', borderRadius: '50%', display: 'flex'
            }}>
                <Icon size={20} color={isMissed && !isMyMsg ? 'white' : '#555'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: isMissed && !isMyMsg ? '#ff4d4f' : '#333' }}>
                    {text}
                </span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                    {subText}
                </span>
            </div>
        </div>
    );
};

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get currentUser from localStorage
    const [currentUser] = useState(() => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user:', error);
            return null;
        }
    });

    // Use custom hooks
    const { socket, onlineUsers } = useSocket(currentUser?._id);
    const { conversations, loading: loadingConvos, setConversations } = useConversations(currentUser?._id);

    // States
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [friendQuery, setFriendQuery] = useState('');
    const [friendResults, setFriendResults] = useState([]);
    const [friendLoading, setFriendLoading] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isCalling, setIsCalling] = useState(false);

    // Refs
    const emojiRef = useRef(null);
    const socketRef = useRef(socket);
    const messageEndRef = useRef(null);
    const messageAreaRef = useRef(null);
    const inputRef = useRef(null);
    const friendSearchTimeout = useRef(null);
    const messagesSetterRef = useRef(null);

    // Redirect if no user
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Show loading if no user
    if (!currentUser) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spin size="large" />
                <p>Loading user data...</p>
            </div>
        );
    }

    // Update socket ref when socket changes
    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // Handle socket messages
    const handleSocketMessage = (newMessage) => {
        const msgConvoId = typeof newMessage.conversationId === 'object'
            ? String(newMessage.conversationId._id)
            : String(newMessage.conversationId);

        const activeConvoId = messagesSetterRef.current?.convoId
            ? String(messagesSetterRef.current.convoId)
            : null;

        if (messagesSetterRef.current && activeConvoId === msgConvoId) {
            messagesSetterRef.current.setter(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                if (newMessage.tempId) {
                    return prev.map(m => m._id === newMessage.tempId ? { ...newMessage, tempId: undefined } : m);
                }
                return [...prev, newMessage];
            });

            if (currentUser && newMessage.senderId !== currentUser._id) {
                socket?.emit('markAsRead', { conversationId: msgConvoId });
            }
        }
    };

    const performSendMessage = (content, type = 'text') => {
        if (!socketRef.current || !currentUser || !selectedConvo) return;

        const tempId = Date.now().toString();
        const messageData = {
            content: content.trim(),
            receiverId: selectedConvo.partner._id,
            senderId: currentUser._id,
            conversationId: selectedConvo._id,
            tempId: tempId,
            messageType: type
        };

        // Optimistically update conversation list
        const optimisticLastMessage = {
            _id: tempId,
            content: content.trim(),
            senderId: currentUser._id,
            createdAt: new Date().toISOString(),
            messageType: type
        };

        setConversations(prev => prev.map(convo =>
            convo._id === selectedConvo._id
                ? {
                    ...convo,
                    lastMessage: optimisticLastMessage,
                    updatedAt: new Date().toISOString()
                }
                : convo
        ));

        socketRef.current.emit('sendMessage', messageData);

        const optimisticMessage = {
            ...messageData,
            _id: tempId,
            senderId: { _id: currentUser._id, name: currentUser.name, pfp: currentUser.pfp },
            createdAt: new Date().toISOString(),
            messageType: type
        };

        setMessages(prev => [...prev, optimisticMessage]);
    };

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        socket.on("call-accepted", ({ roomId }) => {
            localStorage.setItem('currentCallInfo', JSON.stringify({
                conversationId: selectedConvo?._id,
                partnerId: selectedConvo?.partner?._id,
                partner: selectedConvo?.partner,
                isCaller: true
            }));
            setIsCalling(false);
            navigate(`/video-call/${roomId}`);
        });

        socket.on("call-rejected", () => {
            setIsCalling(false);
            antdMessage.info("User is busy or declined the call.");
            performSendMessage("MISSED_CALL", "call");
        });

        // Add socket listeners for messages
        socket.on('receiveMessage', handleSocketMessage);
        socket.on('messageSent', handleSocketMessage);

        socket.on('messageEdited', (updatedMsg) => {
            setMessages(prev => prev.map(msg =>
                msg._id === updatedMsg._id ? updatedMsg : msg
            ));
        });

        socket.on('messageDeleted', ({ messageId }) => {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });
        socket.on('updateConversationLastMessage', ({ conversationId, lastMessage }) => {
            console.log('Updating conversation last message:', { conversationId, lastMessage });

            setConversations(prev => prev.map(convo =>
                convo._id === conversationId
                    ? {
                        ...convo,
                        lastMessage: lastMessage,
                        updatedAt: new Date().toISOString(),
                        // Tăng unread count nếu message không phải từ current user
                        unreadCount: lastMessage.senderId === currentUser._id
                            ? convo.unreadCount
                            : convo.unreadCount + 1
                    }
                    : convo
            ));
        });

        // Listener để reset unread count khi đọc message
        socket.on('conversationRead', ({ conversationId }) => {
            setConversations(prev => prev.map(convo =>
                convo._id === conversationId
                    ? { ...convo, unreadCount: 0 }
                    : convo
            ));
        });

        // Listener để cập nhật conversation khi có message mới từ conversation khác
        socket.on('newMessageInConversation', ({ conversationId, message }) => {
            // Nếu đây không phải conversation đang chọn, cập nhật lastMessage
            if (selectedConvo?._id !== conversationId) {
                setConversations(prev => prev.map(convo =>
                    convo._id === conversationId
                        ? {
                            ...convo,
                            lastMessage: {
                                _id: message._id,
                                content: message.content,
                                senderId: message.senderId,
                                createdAt: message.createdAt,
                                messageType: message.messageType
                            },
                            updatedAt: new Date().toISOString(),
                            unreadCount: convo.unreadCount + 1
                        }
                        : convo
                ));
            }
        });

        return () => {
            socket.off("call-accepted");
            socket.off("call-rejected");
            socket.off('receiveMessage');
            socket.off('messageSent');
            socket.off('messageEdited');
            socket.off('messageDeleted');
            socket.off('updateConversationLastMessage');
            socket.off('conversationRead');
            socket.off('newMessageInConversation');
        };
    }, [socket, navigate, selectedConvo, currentUser, setConversations]);

    const handlePhoneClick = () => {
        if (!selectedConvo || !currentUser) return;

        const roomId = `room_${Date.now()}`;
        setIsCalling(true);

        socket?.emit("call-user", {
            callerId: currentUser._id,
            callerName: currentUser.name,
            pfp: currentUser.pfp,
            receiverId: selectedConvo.partner._id,
            conversationId: selectedConvo._id,
            roomId: roomId
        });
    };

    useEffect(() => {
        if (location.state?.targetConversation) {
            const { targetConversation } = location.state;
            setSelectedConvo(targetConversation);
            window.history.replaceState({}, document.title);
            return;
        }

        const lastConvoId = sessionStorage.getItem('lastActiveConvoId');
        if (lastConvoId) {
            if (conversations.length > 0) {
                const foundConvo = conversations.find(c => c._id === lastConvoId);
                if (foundConvo) {
                    setSelectedConvo(foundConvo);
                    sessionStorage.removeItem('lastActiveConvoId');
                }
            }
        }
    }, [location.state, conversations]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Replace setMessagesExternally
    useEffect(() => {
        messagesSetterRef.current = {
            setter: setMessages,
            convoId: selectedConvo?._id
        };

        return () => {
            messagesSetterRef.current = null;
        };
    }, [selectedConvo]);

    useEffect(() => {
        if (!friendQuery || friendQuery.trim().length < 2) {
            setFriendResults([]);
            setFriendLoading(false);
            return;
        }

        setFriendLoading(true);
        if (friendSearchTimeout.current) clearTimeout(friendSearchTimeout.current);
        friendSearchTimeout.current = setTimeout(async () => {
            try {
                const res = await searchUsers(1, 8, friendQuery.trim());
                if (res && res.success) {
                    setFriendResults(res.users || []);
                } else {
                    setFriendResults([]);
                }
            } catch (err) {
                setFriendResults([]);
            } finally {
                setFriendLoading(false);
            }
        }, 300);

        return () => {
            if (friendSearchTimeout.current) clearTimeout(friendSearchTimeout.current);
        };
    }, [friendQuery]);

    const handleStartChatFromSearch = async (user) => {
        if (!user) return;
        try {
            const res = await findOrCreateConversation(user._id);
            if (res && res.success) {
                const conversationData = {
                    _id: res.conversationId,
                    partner: user,
                    updatedAt: new Date().toISOString()
                };

                // Add to conversations list if not exists
                setConversations(prev => {
                    const exists = prev.find(c => c._id === conversationData._id);
                    if (exists) return prev;
                    return [conversationData, ...prev];
                });

                setSelectedConvo(conversationData);
                setFriendQuery('');
                setFriendResults([]);
            } else {
                antdMessage.error(res.error || 'Cannot create conversation.');
            }
        } catch (err) {
            console.error(err);
            antdMessage.error('Error creating conversation.');
        }
    };

    const handleViewProfile = (user) => {
        navigate(`/home/profile/${user._id}`);
    };

    const handleFollowUser = (user) => {
        antdMessage.success(`Following ${user.name} successfully!`);
    };

    useEffect(() => {
        if (!selectedConvo) return;
        socket?.emit('markAsRead', { conversationId: selectedConvo._id });
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const res = await getMessages(selectedConvo._id);
                if (res.success) {
                    setMessages(res.messages);
                }
            } catch (err) {
                antdMessage.error("Error loading messages.");
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedConvo, socket]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNavigateToProfile = (partnerId) => {
        navigate(`/home/profile/${partnerId}`);
    };

    const handleStartEdit = (msg) => {
        setNewMessage(msg.content);
        setEditingMessageId(msg._id);
        inputRef.current?.focus();
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setNewMessage("");
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
        inputRef.current?.focus();
    };

    const handleDeleteMessage = (messageId) => {
        Swal.fire({
            title: 'Delete message?',
            text: "You cannot undo this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                socket?.emit('deleteMessage', { messageId });
            }
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        setShowEmojiPicker(false);
        if (newMessage.trim() === "" || !socket || !currentUser || !selectedConvo) return;

        if (editingMessageId) {
            socket.emit('editMessage', {
                messageId: editingMessageId,
                newContent: newMessage.trim()
            });
            setEditingMessageId(null);
            setNewMessage('');
            return;
        }

        performSendMessage(newMessage, 'text');
        setNewMessage("");
    };

    const renderMessageMenu = (msg) => (
        <Menu>
            {msg.messageType === 'text' && (
                <Menu.Item key="edit" icon={<Edit size={16} />} onClick={() => handleStartEdit(msg)}>
                    Edit
                </Menu.Item>
            )}
            <Menu.Item key="delete" icon={<Trash2 size={16} />} danger onClick={() => handleDeleteMessage(msg._id)}>
                Delete
            </Menu.Item>
        </Menu>
    );

    const headerMenu = (
        <Menu>
            <Menu.Item key="report" icon={<Flag size={16} />} danger onClick={() => setIsReportModalOpen(true)}>
                Report User
            </Menu.Item>
        </Menu>
    );

    const isPartnerOnline = selectedConvo && onlineUsers.has(selectedConvo.partner._id);

    const filteredConversations = conversations.filter(convo => {
        if (!convo.partner) return false;
        const partnerName = convo.partner.name || '';
        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="chat-layout">
            <aside className="conversation-list">
                <div className="cl-header">
                    <h2>Messages</h2>
                    <div className="cl-friend-search-section">
                        <span className="cl-friend-label">Find Friends</span>
                        <Input
                            className="cl-friend-search"
                            placeholder="Enter name or email..."
                            prefix={<Search size={16} color="#888" />}
                            value={friendQuery}
                            onChange={(e) => setFriendQuery(e.target.value)}
                        />
                    </div>
                    <div className="cl-divider"></div>
                    <div className="cl-search-section">
                        <span className="cl-convo-label">Conversations</span>
                        <Input
                            className="cl-search"
                            placeholder="Search..."
                            prefix={<Search size={16} color="#888" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="cl-items">
                    {friendQuery && friendQuery.trim().length >= 2 ? (
                        friendLoading ? (
                            <div style={{ padding: 20, textAlign: 'center' }}><Spin /></div>
                        ) : friendResults.length > 0 ? (
                            friendResults.map(user => (
                                <div key={user._id} className="friend-result">
                                    <div className={`convo-avatar-wrapper ${onlineUsers.has(user._id) ? 'online' : ''}`} onClick={() => handleViewProfile(user)} style={{ cursor: 'pointer' }}>
                                        {user.pfp ? (
                                            <img className="avatar" src={user.pfp} alt={user.name} />
                                        ) : (
                                            <div className="avatar-initials">{getInitials(user.name)}</div>
                                        )}
                                    </div>
                                    <div className="convo-details">
                                        <div className="convo-top">
                                            <span className="convo-name" onClick={() => handleViewProfile(user)} style={{ cursor: 'pointer', color: '#0084ff' }}>{user.name}</span>
                                        </div>
                                        <div className="convo-bottom">
                                            <Button size="small" onClick={() => handleStartChatFromSearch(user)}>Message</Button>
                                            <Button size="small" type="default" onClick={() => handleFollowUser(user)} style={{ marginLeft: 4 }}>Follow</Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 12, color: '#777' }}>No users found.</div>
                        )
                    ) : (
                        loadingConvos ? (
                            <Spin style={{ padding: "20px", display: 'block', margin: '0 auto' }} />
                        ) : (
                            filteredConversations.map(convo => (
                                <div
                                    key={convo._id}
                                    className={`convo-item ${selectedConvo?._id === convo._id ? 'active' : ''}`}
                                    onClick={() => setSelectedConvo(convo)}
                                >
                                    <div className={`convo-avatar-wrapper ${convo.partner && onlineUsers.has(convo.partner._id) ? 'online' : ''}`}>
                                        {convo.partner?.pfp ? (
                                            <img className="avatar" src={convo.partner.pfp} alt={convo.partner.name} />
                                        ) : (
                                            <div className="avatar-initials">{getInitials(convo.partner?.name)}</div>
                                        )}
                                    </div>
                                    <div className="convo-details">
                                        <div className="convo-top">
                                            <span className="convo-name">{convo.partner.name}</span>
                                            <span className="convo-timestamp">{formatTimestamp(convo.lastMessage?.createdAt)}</span>
                                        </div>
                                        <div className="convo-bottom">
                                            <p className={`convo-last-message ${convo.unreadCount > 0 ? 'unread' : ''}`}>
                                                {convo.lastMessage?.senderId === currentUser?._id ? "You: " : ""}
                                                {(convo.lastMessage?.messageType === 'call' || convo.lastMessage?.content === 'CALL_ENDED' || convo.lastMessage?.content === 'MISSED_CALL')
                                                    ? (convo.lastMessage.content === 'MISSED_CALL' ? '📞 Missed call' : '📞 Video call')
                                                    : convo.lastMessage?.messageType === 'shared_post'
                                                        ? 'Shared a post'
                                                        : (convo.lastMessage?.content || "...")
                                                }
                                            </p>
                                            {convo.unreadCount > 0 && <span className="unread-badge">{convo.unreadCount}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </aside>

            <main className="chat-window">
                {selectedConvo ? (
                    <>
                        <header className="chat-header">
                            <div className="ch-user" onClick={() => handleNavigateToProfile(selectedConvo.partner._id)}>
                                {selectedConvo.partner.pfp ? (
                                    <img className="avatar" src={selectedConvo.partner.pfp} alt="Avatar" />
                                ) : (
                                    <div className="avatar-initials">{getInitials(selectedConvo.partner?.name)}</div>
                                )}
                                <div className="ch-user-details">
                                    <h4>{selectedConvo.partner.name}</h4>
                                    <span className={isPartnerOnline ? 'online' : 'offline'}>
                                        {isPartnerOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="ch-actions">
                                <button className="icon-btn" onClick={handlePhoneClick}>
                                    <Phone size={20} />
                                </button>
                                <Dropdown overlay={headerMenu} trigger={['click']} placement="bottomRight">
                                    <button className="icon-btn"><MoreVertical size={20} /></button>
                                </Dropdown>
                            </div>
                        </header>

                        <div className="message-area" ref={messageAreaRef}>
                            {loadingMessages ? (
                                <div className="loading-area"><Spin /></div>
                            ) : (
                                messages.map(msg => {
                                    const isMyMsg = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id;
                                    let messageContent;
                                    if (msg.messageType === 'call' || msg.content === 'CALL_ENDED' || msg.content === 'MISSED_CALL') {
                                        messageContent = (
                                            <CallMessageSnippet
                                                msg={msg}
                                                currentUser={currentUser}
                                                onCallAgain={handlePhoneClick}
                                            />
                                        );
                                    } else if (msg.messageType === 'shared_post' && msg.sharedPostId) {
                                        messageContent = <SharedPostSnippet postData={msg.sharedPostId} navigate={navigate} />;
                                    } else {
                                        messageContent = (
                                            <div className="text-content">
                                                {msg.content}
                                                {msg.isEdited && <span className="edited-tag">(edited)</span>}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg._id || msg.tempId || `msg-${msg.createdAt}-${Math.random()}`} className={`message-bubble ${isMyMsg ? 'sent' : 'received'}`}>
                                            {!isMyMsg && (
                                                <div className="msg-avatar-container">
                                                    {msg.senderId.pfp ? (
                                                        <img className="msg-avatar-img" src={msg.senderId.pfp} alt="Avatar" />
                                                    ) : (
                                                        <div className="msg-avatar-initials">{getInitials(msg.senderId?.name)}</div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="message-content">
                                                {messageContent}

                                                <div className="message-meta">
                                                    <span className="message-timestamp">{formatTimestamp(msg.createdAt)}</span>
                                                </div>
                                            </div>

                                            {isMyMsg && msg.messageType !== 'call' && (
                                                <Dropdown overlay={renderMessageMenu(msg)} trigger={['click']} placement="topRight">
                                                    <Button type="text" className="message-action-btn">
                                                        <BsThreeDotsVertical />
                                                    </Button>
                                                </Dropdown>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messageEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            {editingMessageId && (
                                <div className="editing-indicator">
                                    <span>Editing message...</span>
                                    <button type="button" className="cancel-edit-btn" onClick={handleCancelEdit}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <button type="button" className="icon-btn" disabled={!!editingMessageId}>
                                <Paperclip size={20} />
                            </button>

                            <div className="emoji-container" ref={emojiRef}>
                                <button
                                    type="button"
                                    className={`icon-btn ${showEmojiPicker ? 'active' : ''}`}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    disabled={!!editingMessageId}
                                >
                                    <Smile size={20} />
                                </button>
                                {showEmojiPicker && (
                                    <div className="emoji-picker-popup">
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            width={300}
                                            height={400}
                                            searchDisabled={false}
                                            skinTonesDisabled
                                            previewConfig={{ showPreview: false }}
                                        />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={editingMessageId ? "Enter new content..." : "Type a message..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="send-btn"><Send size={20} /></button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="welcome-icon">
                            <MessageSquareDashed size={64} color="#ccc" />
                        </div>
                        <h2>Welcome to Chat</h2>
                        <p>Connect with your friends to start chatting now!</p>
                    </div>
                )}
            </main>

            {selectedConvo && (
                <ReportModal
                    open={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    targetId={selectedConvo.partner._id}
                    targetType="User"
                    targetName={selectedConvo.partner.name}
                    onReported={() => { toast.success("User reported successfully"); }}
                />
            )}
            <Modal
                title={null}
                open={isCalling}
                footer={null}
                closable={false}
                centered
                width={360}
                className="call-modal"
            >
                <div className="call-modal-content">
                    <div className="avatar-container">
                        <img
                            src={selectedConvo?.partner?.pfp || 'https://via.placeholder.com/150'}
                            alt="Partner"
                            className="caller-avatar"
                        />
                        <div className="pulse-ring"></div>
                    </div>

                    <h3 className="caller-name">{selectedConvo?.partner?.name}</h3>
                    <p className="call-status">Calling...</p>

                    <div className="call-actions">
                        <Button
                            shape="circle"
                            size="large"
                            className="action-btn reject-btn"
                            onClick={() => {
                                setIsCalling(false);
                                socket?.emit("reject-call", { callerId: currentUser._id });
                                performSendMessage("MISSED_CALL", "call");
                            }}
                        >
                            <X size={28} />
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Chat;