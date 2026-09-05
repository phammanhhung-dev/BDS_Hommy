/**
 * @fileoverview Socket.IO Client Hook
 * @hook useSocket
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { getSocketUrl } from '../config/api';

const SOCKET_URL = getSocketUrl();

/**
 * Custom hook để quản lý Socket.IO connection
 * @returns {Object} - {socket, isConnected, error}
 */
export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Tạo socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('error', (err) => {
      console.error('[Socket.IO] Error:', err);
      setError(err.message || 'Socket connection error');
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('[Socket.IO] Disconnecting...');
      socket.disconnect();
    };
  }, []); // Empty deps - chỉ chạy 1 lần khi mount

  return {
    socket: socketRef.current,
    isConnected,
    error
  };
};

export default useSocket;


