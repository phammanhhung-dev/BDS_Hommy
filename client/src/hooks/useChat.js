/**
 * @fileoverview Chat Logic Hook
 * @hook useChat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '../config/api';
import useSocket from './useSocket';

/**
 * Custom hook để quản lý chat logic cho một cuộc hội thoại
 * @param {number} cuocHoiThoaiID - ID cuộc hội thoại
 * @returns {Object} - Chat state và actions
 */
export const useChat = (cuocHoiThoaiID) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const typingTimeoutRef = useRef(null);

  /**
   * Join vào cuộc hội thoại
   */
  useEffect(() => {
    if (!socket || !cuocHoiThoaiID || !isConnected) return;

    socket.emit('join_conversation', { cuocHoiThoaiID });

    return () => {
      socket.emit('leave_conversation', { cuocHoiThoaiID });
    };
  }, [socket, cuocHoiThoaiID, isConnected]);

  /**
   * Listen Socket events
   */
  useEffect(() => {
    if (!socket) return;

    // Tin nhắn mới
    const handleNewMessage = (message) => {
      if (message.CuocHoiThoaiID === cuocHoiThoaiID) {
        setMessages(prev => [...prev, message]);
      }
    };

    // User đang gõ
    const handleUserTyping = ({ nguoiDungID, cuocHoiThoaiID: convID, typing }) => {
      if (convID !== cuocHoiThoaiID) return;

      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (typing) {
          newSet.add(nguoiDungID);
        } else {
          newSet.delete(nguoiDungID);
        }
        return newSet;
      });
    };

    // User online/offline
    const handleUserOnline = ({ nguoiDungID }) => {
      setOnlineUsers(prev => new Set(prev).add(nguoiDungID));
    };

    const handleUserOffline = ({ nguoiDungID }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(nguoiDungID);
        return newSet;
      });
    };

    // Error
    const handleError = ({ event, message: errorMessage }) => {
      console.error(`[Socket.IO] ${event} error:`, errorMessage);
      setError(errorMessage);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('error', handleError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('error', handleError);
    };
  }, [socket, cuocHoiThoaiID]);

  /**
   * Gửi tin nhắn
   */
  const sendMessage = useCallback((noiDung) => {
    if (!socket || !cuocHoiThoaiID || !noiDung.trim()) return;

    socket.emit('send_message', {
      cuocHoiThoaiID,
      noiDung: noiDung.trim()
    });

    // Stop typing
    socket.emit('typing_stop', { cuocHoiThoaiID });
  }, [socket, cuocHoiThoaiID]);

  /**
   * Báo hiệu đang gõ
   */
  const handleTyping = useCallback(() => {
    if (!socket || !cuocHoiThoaiID) return;

    // Gửi typing_start
    socket.emit('typing_start', { cuocHoiThoaiID });

    // Clear timeout cũ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout mới - sau 2 giây không gõ sẽ gửi typing_stop
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { cuocHoiThoaiID });
    }, 2000);
  }, [socket, cuocHoiThoaiID]);

  /**
   * Đánh dấu đã đọc
   */
  const markAsRead = useCallback(() => {
    if (!socket || !cuocHoiThoaiID) return;

    socket.emit('mark_as_read', { cuocHoiThoaiID });
  }, [socket, cuocHoiThoaiID]);

  /**
   * Load lịch sử tin nhắn (REST API fallback)
   */
  const loadMessages = useCallback(async (limit = 50, offset = 0) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations/${cuocHoiThoaiID}/messages?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await response.json();
      if (result.success) {
        setMessages(result.data);
      }
    } catch (err) {
      console.error('[useChat] Load messages error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cuocHoiThoaiID]);

  /**
   * Load tin nhắn khi mount
   */
  useEffect(() => {
    if (cuocHoiThoaiID) {
      loadMessages();
    }
  }, [cuocHoiThoaiID, loadMessages]);

  return {
    messages,
    sendMessage,
    handleTyping,
    markAsRead,
    loadMessages,
    isTyping: typingUsers.size > 0,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),
    loading,
    error,
    isConnected
  };
};

export default useChat;


