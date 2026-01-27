// src/hooks/useConversations.js
import { useState, useEffect } from 'react';
import { getConversations } from '../service/messageService';

const useConversations = (currentUserId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const fetchConvos = async () => {
      if (!currentUserId) return;
      
      setLoading(true);
      try {
        const res = await getConversations();
        if (res.success) {
          setConversations(res.conversations || []);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConvos();
  }, [currentUserId]);

  useEffect(() => {
    const total = conversations.reduce((acc, convo) => 
      acc + (parseInt(convo.unreadCount) || 0), 0
    );
    setTotalUnread(total);
  }, [conversations]);

  return { conversations, loading, totalUnread, setConversations };
};

export default useConversations;