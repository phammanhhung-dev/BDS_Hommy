/**
 * @fileoverview Chat Context - Global state management cho chat
 * @context ChatContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import { getApiBaseUrl } from '../config/api';
import { getAuthHeaderValue } from '../utils/authToken';

const ChatContext = createContext(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Load danh sách cuộc hội thoại
   */
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const authHeader = getAuthHeaderValue();
      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations`,
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // ✅ Important for CORS with credentials
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setConversations(result.data);

        // Tính tổng số tin chưa đọc
        const totalUnread = result.data.reduce((sum, conv) => sum + (conv.SoTinChuaDoc || 0), 0);
        setUnreadCount(totalUnread);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('[ChatContext] Load conversations error:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo hoặc mở cuộc hội thoại
   */
  const findOrCreateConversation = useCallback(async ({ NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe }) => {
    try {
      const authHeader = getAuthHeaderValue();
      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe })
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }

      const result = await response.json();
      if (result.success) {
        // Reload conversations để cập nhật danh sách
        await loadConversations();
        return result.data.CuocHoiThoaiID;
      }
    } catch (error) {
      console.error('[ChatContext] Create conversation error:', error);
      throw error;
    }
  }, [loadConversations]);

  /**
   * Update unread count khi có tin nhắn mới
   */
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Cập nhật conversations và unread count
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.CuocHoiThoaiID === message.CuocHoiThoaiID) {
            // Nếu không phải conversation đang active, tăng unread
            const isActive = conv.CuocHoiThoaiID === activeConversationId;
            return {
              ...conv,
              TinNhanCuoi: message.NoiDung,
              ThoiDiemTinNhanCuoi: message.ThoiGian,
              SoTinChuaDoc: isActive ? conv.SoTinChuaDoc : (conv.SoTinChuaDoc || 0) + 1
            };
          }
          return conv;
        });

        // Tính lại tổng unread
        const totalUnread = updated.reduce((sum, conv) => sum + (conv.SoTinChuaDoc || 0), 0);
        setUnreadCount(totalUnread);

        return updated;
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeConversationId]);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback((conversationId) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.CuocHoiThoaiID === conversationId) {
          return { ...conv, SoTinChuaDoc: 0 };
        }
        return conv;
      });

      // Tính lại tổng unread
      const totalUnread = updated.reduce((sum, conv) => sum + (conv.SoTinChuaDoc || 0), 0);
      setUnreadCount(totalUnread);

      return updated;
    });
  }, []);

  /**
   * Load conversations khi mount
   */
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Incoming call state and handlers
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket]);

  const acceptCall = () => {
    if (incomingCall?.roomUrl) {
      window.open(incomingCall.roomUrl, '_blank');
    }
    setIncomingCall(null);
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  const value = {
    conversations,
    unreadCount,
    activeConversationId,
    setActiveConversationId,
    loadConversations,
    findOrCreateConversation,
    markConversationAsRead,
    isConnected,
    loading,
    incomingCall,
    acceptCall,
    declineCall
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;


