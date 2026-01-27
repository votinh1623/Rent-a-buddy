// src/service/messageService.js
import { get, post } from "@/utils/request";

export const getConversations = async () => {
  return get('conversations');
};

export const getMessages = async (conversationId) => {
  return get(`messages/${conversationId}?populatePost=true`);
};

export const findOrCreateConversation = async (receiverId) => {
  return post('conversations/findOrCreate', { receiverId });
};