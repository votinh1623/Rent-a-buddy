// src/layout/LayoutDefault/LayoutDefault.jsx
import { Outlet, useLocation } from "react-router-dom";
// import Header from "../../components/Header/Header";
import { Layout, Grid, Drawer, Spin, message } from "antd";
import { useState, useEffect, useRef, useCallback } from "react";
// import { getProfile } from "../../service/userService.jsx";
// import { getConversations } from "../../service/messageService.jsx";
import io from 'socket.io-client';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const socket = io("http://localhost:3000", { autoConnect: false });

const fullBleedPaths = [
  '/home/chat'
];

const LayoutDefault = () => {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(socket);

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
      } else {
        message.error("Không thể tải danh sách tin nhắn.");
        return [];
      }
    } catch (err) {
      console.error("Lỗi fetchConversations:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const updateConvosFromSocket = (newMessage) => {
      const isViewingChat = window.location.pathname.startsWith('/home/chat');
      const selectedConvoId = messagesSetterRef.current ? messagesSetterRef.current.convoId : null;

      if (messagesSetterRef.current && newMessage.conversationId === selectedConvoId) {
        messagesSetterRef.current.setter(prev => [...prev, newMessage]);
      }

      setConversations(prevConvos => {
        let conversationExists = false;

        const newConvos = prevConvos.map(convo => {
          if (convo._id === newMessage.conversationId) {
            conversationExists = true;
            const newUnread = (isViewingChat && convo._id === selectedConvoId) ? 0 : (convo.unreadCount || 0) + 1;
            return { ...convo, lastMessage: newMessage, unreadCount: newUnread };
          }
          return convo;
        });

        if (!conversationExists) {
          fetchConversations();
        }

        return newConvos.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
      });
    };

    const handleUnreadCountReset = ({ conversationId }) => {
      setConversations(prevConvos =>
        prevConvos.map(convo =>
          convo._id === conversationId ? { ...convo, unreadCount: 0 } : convo
        )
      );
    };


    const initialize = async () => {
      setLoadingProfile(true);
      try {
        const user = await getProfile();
        if (!isMounted) return;

        setCurrentUser(user);
        socketRef.current.io.opts.query = { userId: user._id };
        socketRef.current.connect();

        socketRef.current.on('getOnlineUsers', (userIds) => {
          setOnlineUsers(new Set(userIds));
        });
        socketRef.current.on('receiveMessage', updateConvosFromSocket);
        socketRef.current.on('unreadCountReset', handleUnreadCountReset);

        fetchConversations();

      } catch (err) {
        if (err.response && err.response.status === 429) {
          message.error("Bạn đang tải trang quá nhanh. Vui lòng chờ 15 giây.");
        } else {
          console.error("Failed to fetch profile/connect:", err);
          message.error("Lỗi kết nối, vui lòng tải lại trang.");
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
      socketRef.current?.off('getOnlineUsers');
      socketRef.current?.off('receiveMessage');
      socketRef.current?.off('unreadCountReset');
    };
  }, [fetchConversations]);

  useEffect(() => {
    const total = conversations.reduce((acc, convo) => acc + (convo.unreadCount || 0), 0);
    setTotalUnreadMessages(total);
  }, [conversations]);

  return (
    <Layout className="layout-default">
      <Header
        onToggleSider={toggleDrawer}
        user={currentUser}
        loading={loadingProfile}
        socket={socketRef.current}
        totalUnreadMessages={totalUnreadMessages}
      />
      <Layout className="layout-child">
        {screens.md && (
          <Sider
            theme="light"
            width={256}
            className="layout-default-sider"
          >
            {loadingProfile ? <Spin /> : <SiderContent user={currentUser} totalUnreadMessages={totalUnreadMessages} />}
          </Sider>
        )}

        {!screens.md && (
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
    </Layout>
  );
};

export default LayoutDefault;