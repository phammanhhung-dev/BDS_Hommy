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
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        setConversations([]);
        return;
      }

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
        setConversations([]);
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
        if (!window.location.pathname.startsWith('/login')) { window.location.href = '/login'; }
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
        const exists = prev.some(conv => conv.CuocHoiThoaiID === message.CuocHoiThoaiID);
        if (!exists) {
          // Nếu nhận tin nhắn từ cuộc hội thoại mới chưa có trong danh sách -> reload
          loadConversations();
          return prev;
        }

        const updated = prev.map(conv => {
          if (conv.CuocHoiThoaiID === message.CuocHoiThoaiID) {
            // Nếu không phải conversation đang active, tăng unread
            const isActive = conv.CuocHoiThoaiID === activeConversationId;
            
            if (!isActive) {
              const currentUserId = parseInt(localStorage.getItem('userId') || '0');
              let cUserId = currentUserId;
              try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  const currentUser = JSON.parse(userStr);
                  if (!cUserId) cUserId = currentUser.NguoiDungID || 0;
                }
              } catch (e) {}
              
              if (parseInt(message.NguoiGuiID) !== cUserId) {
                 window.dispatchEvent(new CustomEvent('new_chat_message', { detail: message }));
              }
            }

            return {
              ...conv,
              TinNhanCuoi: message.NoiDung,
              ThoiDiemTinNhanCuoi: message.ThoiGian,
              SoTinChuaDoc: isActive ? conv.SoTinChuaDoc : (conv.SoTinChuaDoc || 0) + 1
            };
          }
          return conv;
        });

        // Sắp xếp lại để cuộc trò chuyện có tin nhắn mới nhất lên đầu danh sách
        updated.sort((a, b) => new Date(b.ThoiDiemTinNhanCuoi || 0) - new Date(a.ThoiDiemTinNhanCuoi || 0));

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
  }, [socket, activeConversationId, loadConversations]);

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
      setIncomingCall({
        ...callData,
        callerName: callData.callerName || callData.nguoiGoiTen || 'Người dùng',
        roomUrl: callData.roomUrl || callData.RoomUrl
      });
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('video_call_incoming', handleIncomingCall);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('video_call_incoming', handleIncomingCall);
    };
  }, [socket]);

  const acceptCall = () => {
    if (incomingCall?.roomUrl) {
      const width = 1280;
      const height = 720;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      window.open(
        incomingCall.roomUrl,
        'VideoCallWindow',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
      );
    }
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (incomingCall?.cuocHoiThoaiID && socket) {
      socket.emit('answer_video_call', {
        cuocHoiThoaiID: incomingCall.cuocHoiThoaiID,
        accepted: false
      });
    }
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


