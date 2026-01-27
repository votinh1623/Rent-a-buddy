// src/hooks/useSocket.js
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (currentUserId) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUserId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log(`🔌 Connecting to socket server for user: ${currentUserId}`);
    
    // Kết nối đến đúng port backend (4000)
    const newSocket = io('http://localhost:3000', {
      query: { userId: currentUserId },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Gửi event để thêm user vào danh sách online
      newSocket.emit('new-user-add', currentUserId);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('getOnlineUsers', (userIds) => {
      console.log('👥 Online users:', userIds);
      setOnlineUsers(new Set(userIds));
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      console.log('🧹 Cleaning up socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [currentUserId]);

  return { socket, onlineUsers, isConnected };
};

export default useSocket;