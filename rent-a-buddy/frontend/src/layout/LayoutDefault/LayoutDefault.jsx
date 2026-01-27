import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Grid, Drawer, Spin, message, Modal, Button } from "antd";
import { useState, useEffect, useRef, useCallback } from "react";
import { getProfile } from "../../service/userService.jsx";
import { getConversations } from "../../service/messageService.jsx";
import io from 'socket.io-client';
import { Phone, X, Menu } from 'lucide-react'; // Thêm Menu icon
import "./LayoutDefault.scss";
import "./CallModal.scss";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const socket = io("http://localhost:3000", { autoConnect: false });

const fullBleedPaths = ['/home/chat'];

const LayoutDefault = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const socketRef = useRef(socket);
  const userRef = useRef(null);

  const location = useLocation();
  const isFullBleed = fullBleedPaths.includes(location.pathname);
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const messagesSetterRef = useRef(null);
  const setMessagesExternally = useCallback((setterAndConvoId) => {
    messagesSetterRef.current = setterAndConvoId;
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      if (res.success) {
        setConversations(res.conversations);
        return res.conversations;
      }
      return [];
    } catch (err) {
      console.error("Lỗi fetchConversations:", err);
      return [];
    }
  }, []);

  const handleAcceptCall = () => {
    if (!incomingCallData) return;
    socketRef.current.emit("accept-call", {
      roomId: incomingCallData.roomId,
      callerId: incomingCallData.from
    });

    localStorage.setItem('currentCallInfo', JSON.stringify({
      conversationId: incomingCallData.conversationId,
      partnerId: incomingCallData.from,
      isCaller: false
    }));

    setIsIncomingCall(false);
    navigate(`/video-call/${incomingCallData.roomId}`);
  };

  const handleRejectCall = () => {
    if (!incomingCallData) return;
    socketRef.current.emit("reject-call", { callerId: incomingCallData.from });
    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  useEffect(() => {
    let isMounted = true;
    const handleSocketMessage = (newMessage) => {
      const curUser = userRef.current;

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

        if (curUser && newMessage.senderId !== curUser._id) {
          socketRef.current.emit('markAsRead', { conversationId: msgConvoId });
        }
      }
      setConversations(prevConvos => {
        const convoIndex = prevConvos.findIndex(c => String(c._id) === msgConvoId);
        if (convoIndex === -1) {
          fetchConversations();
          return prevConvos;
        }
        const updatedConvos = prevConvos.map(c => ({ ...c }));
        const currentConvo = updatedConvos[convoIndex];
        let newUnreadCount = parseInt(currentConvo.unreadCount || 0);

        const isMyMessage = curUser && String(newMessage.senderId) === String(curUser._id);

        if (isMyMessage) {
          newUnreadCount = 0;
        } else {
          if (!activeConvoId || String(activeConvoId) !== msgConvoId) {
            newUnreadCount += 1;
          } else {
            newUnreadCount = 0;
          }
        }

        currentConvo.lastMessage = newMessage;
        currentConvo.unreadCount = newUnreadCount;
        currentConvo.updatedAt = new Date().toISOString();

        return updatedConvos.sort((a, b) =>
          new Date(b.updatedAt || b.lastMessage?.createdAt || 0) -
          new Date(a.updatedAt || a.lastMessage?.createdAt || 0)
        );
      });
    };

    const handleUnreadCountReset = ({ conversationId }) => {
      setConversations(prevConvos =>
        prevConvos.map(convo =>
          String(convo._id) === String(conversationId) ? { ...convo, unreadCount: 0 } : convo
        )
      );
    };

    const handleIncomingCall = (data) => {
      console.log("📞 [DEBUG] Incoming call data:", data);
      if (!data.conversationId) console.error("❌ [LỖI] Server không gửi conversationId!");

      setIncomingCallData(data);
      setIsIncomingCall(true);
    };

    const handleCallRejectedByCaller = () => {
      setIsIncomingCall(false);
      setIncomingCallData(null);
    };

    // const initialize = async () => {
    //   if (!currentUser) setLoadingProfile(true);
    //   try {
    //     const user = await getProfile();
    //     if (!isMounted) return;

    //     setCurrentUser(user);
    //     userRef.current = user;

    //     if (!socketRef.current.connected) {
    //       socketRef.current.io.opts.query = { userId: user._id };
    //       socketRef.current.connect();
    //     }

    //     socketRef.current.off('receiveMessage');
    //     socketRef.current.off('messageSent');
    //     socketRef.current.off('unreadCountReset');
    //     socketRef.current.off('getOnlineUsers');
    //     socketRef.current.off('incoming-call');
    //     socketRef.current.off('call-rejected');

    //     socketRef.current.on('getOnlineUsers', (userIds) => setOnlineUsers(new Set(userIds)));
    //     socketRef.current.on('receiveMessage', handleSocketMessage);
    //     socketRef.current.on('messageSent', handleSocketMessage);
    //     socketRef.current.on('unreadCountReset', handleUnreadCountReset);

    //     socketRef.current.on('incoming-call', handleIncomingCall);
    //     socketRef.current.on('call-rejected', handleCallRejectedByCaller);

    //     fetchConversations();

    //   } catch (err) {
    //     if (err.response && err.response.status === 429) {
    //       console.warn("Rate limit exceeded.");
    //     } else {
    //       console.error("Init error", err);
    //     }
    //   } finally {
    //     if (isMounted) setLoadingProfile(false);
    //   }
    // };

    // initialize();

    return () => {
      isMounted = false;
      socketRef.current?.off('getOnlineUsers');
      socketRef.current?.off('receiveMessage');
      socketRef.current?.off('messageSent');
      socketRef.current?.off('unreadCountReset');
      socketRef.current?.off('incoming-call');
      socketRef.current?.off('call-rejected');
    };
  }, [fetchConversations]);

  useEffect(() => {
    const total = conversations.reduce((acc, convo) => acc + (parseInt(convo.unreadCount) || 0), 0);
    setTotalUnreadMessages(total);
  }, [conversations]);

  return (
    <Layout className="layout-default">
      {/* Simple header với menu button cho mobile */}
      {!isFullBleed && (
        <div className="simple-header">
          {!screens.md && (
            <Button 
              type="text" 
              icon={<Menu size={20} />} 
              onClick={toggleDrawer}
              className="menu-toggle-btn"
            />
          )}
          {currentUser && !loadingProfile && (
            <div className="user-info">
              <span>Xin chào, {currentUser.name}</span>
            </div>
          )}
        </div>
      )}
      
      <Layout className="layout-child">
        {screens.md && !isFullBleed && (
          <Sider theme="light" width={256} className="layout-default-sider">
            {loadingProfile ? <Spin /> : <SiderContent user={currentUser} totalUnreadMessages={totalUnreadMessages} />}
          </Sider>
        )}
        {!screens.md && !isFullBleed && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={256}
            styles={{ body: { padding: 0 } }}
          >
            {loadingProfile ? <Spin /> : (
              <SiderContent
                onClose={() => setDrawerVisible(false)}
                user={currentUser}
                totalUnreadMessages={totalUnreadMessages}
              />
            )}
          </Drawer>
        )}
        <Content className={`layout__content ${isFullBleed ? 'layout__content--full-bleed' : ''}`}>
          <Outlet context={{
            currentUser,
            conversations,
            setConversations,
            onlineUsers,
            socket: socketRef.current,
            loadingConvos: loadingProfile,
            setMessagesExternally
          }} />
        </Content>
      </Layout>

      <Modal
        title={null}
        open={isIncomingCall}
        footer={null}
        closable={false}
        centered
        width={360}
        className="call-modal"
      >
        <div className="call-modal-content">
          <div className="avatar-container">
            <img
              src={incomingCallData?.pfp || 'https://via.placeholder.com/150'}
              alt="caller"
              className="caller-avatar"
            />
            <div className="pulse-ring"></div>
          </div>

          <h3 className="caller-name">{incomingCallData?.name}</h3>
          <p className="call-status">Đang gọi video cho bạn...</p>

          <div className="call-actions">
            <Button
              shape="circle"
              size="large"
              className="action-btn accept-btn"
              onClick={handleAcceptCall}
            >
              <Phone size={28} />
            </Button>

            <Button
              shape="circle"
              size="large"
              className="action-btn reject-btn"
              onClick={handleRejectCall}
            >
              <X size={28} />
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default LayoutDefault;