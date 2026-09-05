/**
 * NotificationBadge Component
 * Hiển thị số thông báo chưa đọc với real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell } from 'react-icons/hi2';
import useSocket from '../../../hooks/useSocket';
import { demThongBaoChuaDoc } from '../../../api/nhanVienBanHangApi';
import './NotificationBadge.css';

const NotificationBadge = ({ onClick, onUnreadCountChange, className = '' }) => {
  const { socket, isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Load số thông báo chưa đọc
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await demThongBaoChuaDoc();
      if (response.success) {
        const count = response.count || 0;
        setUnreadCount(count);
        if (onUnreadCountChange) {
          onUnreadCountChange(count);
        }
      }
    } catch (err) {
      console.error('[NotificationBadge] Load unread count error:', err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  /**
   * Load unread count khi mount
   */
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  /**
   * Subscribe socket notifications
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe vào room notifications
    socket.emit('subscribe_notifications');

    // Listen cho thông báo mới
    const handleNewNotification = () => {
      // Tăng unread count
      setUnreadCount(prev => prev + 1);
    };

    // Listen cho khi đánh dấu đã đọc
    const handleMarkAsRead = () => {
      // Giảm unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleMarkAsRead);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleMarkAsRead);
      socket.emit('unsubscribe_notifications');
    };
  }, [socket, isConnected]);

  /**
   * Cập nhật unread count cho parent component (sau khi state đã update)
   */
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  /**
   * Polling fallback nếu socket không kết nối
   */
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000); // Poll mỗi 30 giây

      return () => clearInterval(interval);
    }
  }, [isConnected, loadUnreadCount]);

  return (
    <button
      className={`notification-badge ${className}`}
      onClick={onClick}
      aria-label={`${unreadCount} thông báo chưa đọc`}
    >
      <HiOutlineBell className="notification-badge__icon" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            className="notification-badge__count"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default NotificationBadge;

