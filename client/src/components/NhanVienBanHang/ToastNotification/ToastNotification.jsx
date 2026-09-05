/**
 * ToastNotification Component
 * Hiển thị pop-up toast cho các thông báo quan trọng cần xem ngay
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark,
  HiOutlineCalendar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineVideoCamera,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineBell
} from 'react-icons/hi2';
import useSocket from '../../../hooks/useSocket';
import useNotificationSound from '../../../hooks/useNotificationSound';
import { danhDauDaDoc } from '../../../api/nhanVienBanHangApi';
import './ToastNotification.css';

/**
 * Các loại thông báo cần hiển thị pop-up
 */
const URGENT_NOTIFICATION_TYPES = [
  'cuoc_hen_moi',
  'video_call',
  'tro_chuyen_moi',
  'cuoc_hen_cho_phe_duyet',
  'khach_huy_cuoc_hen',
  'reminder',
  'coc_moi',
  'can_bao_cao'
];

/**
 * Icon mapping cho từng loại thông báo
 */
const getNotificationIcon = (type) => {
  const iconMap = {
    cuoc_hen_moi: HiOutlineCalendar,
    video_call: HiOutlineVideoCamera,
    tro_chuyen_moi: HiOutlineChatBubbleLeftRight,
    cuoc_hen_cho_phe_duyet: HiOutlineExclamationCircle,
    khach_huy_cuoc_hen: HiOutlineExclamationCircle,
    reminder: HiOutlineClock,
    coc_moi: HiOutlineCurrencyDollar,
    can_bao_cao: HiOutlineExclamationCircle,
    cuoc_hen_da_phe_duyet: HiOutlineCheckCircle,
    cuoc_hen_tu_choi: HiOutlineExclamationCircle,
    phan_hoi_goi_y: HiOutlineChatBubbleLeftRight,
    cuoc_hen_tu_qr: HiOutlineCalendar
  };
  return iconMap[type] || HiOutlineBell;
};

/**
 * Màu sắc cho từng loại thông báo
 */
const getNotificationColor = (type) => {
  const colorMap = {
    cuoc_hen_moi: '#3b82f6', // Blue
    video_call: '#ef4444', // Red (urgent)
    tro_chuyen_moi: '#8b5cf6', // Purple
    cuoc_hen_cho_phe_duyet: '#f59e0b', // Amber
    khach_huy_cuoc_hen: '#ef4444', // Red
    reminder: '#10b981', // Green
    coc_moi: '#10b981', // Green
    can_bao_cao: '#f59e0b', // Amber
    cuoc_hen_da_phe_duyet: '#10b981', // Green
    cuoc_hen_tu_choi: '#ef4444', // Red
    phan_hoi_goi_y: '#8b5cf6', // Purple
    cuoc_hen_tu_qr: '#3b82f6' // Blue
  };
  return colorMap[type] || '#6b7280';
};

/**
 * Thời gian tự động ẩn (ms) cho từng loại
 */
const getAutoHideDuration = (type) => {
  const durationMap = {
    video_call: 10000, // 10 giây cho video call
    cuoc_hen_moi: 7000, // 7 giây cho cuộc hẹn mới
    tro_chuyen_moi: 5000, // 5 giây cho tin nhắn
    cuoc_hen_cho_phe_duyet: 8000, // 8 giây
    khach_huy_cuoc_hen: 8000, // 8 giây
    reminder: 6000, // 6 giây
    coc_moi: 7000, // 7 giây
    can_bao_cao: 8000 // 8 giây
  };
  return durationMap[type] || 5000; // Mặc định 5 giây
};

const ToastNotification = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { playNotificationSound } = useNotificationSound({ enabled: true, volume: 0.5 });
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  /**
   * Xóa toast
   */
  const removeToast = useCallback((toastId) => {
    // Clear timer nếu có
    if (timersRef.current[toastId]) {
      clearTimeout(timersRef.current[toastId]);
      delete timersRef.current[toastId];
    }
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  /**
   * Xử lý điều hướng khi click vào toast
   */
  const handleNotificationClick = useCallback((notification) => {
    const { Payload } = notification;
    const type = Payload?.type;

    // Đánh dấu đã đọc
    if (notification.TrangThai === 'ChuaDoc') {
      danhDauDaDoc(notification.ThongBaoID).catch(err => 
        console.error('[ToastNotification] Lỗi đánh dấu đã đọc:', err)
      );
    }

    // Điều hướng theo loại thông báo
    switch (type) {
      case 'cuoc_hen_moi':
      case 'cuoc_hen_cho_phe_duyet':
      case 'cuoc_hen_da_phe_duyet':
      case 'cuoc_hen_tu_choi':
      case 'cuoc_hen_tu_qr':
      case 'reminder':
      case 'can_bao_cao':
        if (Payload?.CuocHenID) {
          navigate(`/nhan-vien-ban-hang/cuoc-hen/${Payload.CuocHenID}`);
        } else {
          navigate('/nhan-vien-ban-hang/cuoc-hen');
        }
        break;
      
      case 'video_call':
        if (Payload?.RoomUrl) {
          window.open(Payload.RoomUrl, '_blank');
        } else if (Payload?.CuocHoiThoaiID) {
          navigate(`/nhan-vien-ban-hang/tro-chuyen/${Payload.CuocHoiThoaiID}`);
        }
        break;
      
      case 'tro_chuyen_moi':
        if (Payload?.CuocHoiThoaiID) {
          navigate(`/nhan-vien-ban-hang/tro-chuyen/${Payload.CuocHoiThoaiID}`);
        } else {
          navigate('/nhan-vien-ban-hang/tro-chuyen');
        }
        break;
      
      case 'coc_moi':
        if (Payload?.GiaoDichID) {
          navigate(`/nhan-vien-ban-hang/giao-dich/${Payload.GiaoDichID}`);
        } else {
          navigate('/nhan-vien-ban-hang/giao-dich');
        }
        break;
      
      case 'phan_hoi_goi_y':
        if (Payload?.TinDangID) {
          navigate(`/nhan-vien-ban-hang/tin-dang/${Payload.TinDangID}`);
        } else {
          navigate('/nhan-vien-ban-hang/tin-dang');
        }
        break;
      
      default:
        // Mặc định mở notification center
        break;
    }
  }, [navigate]);

  /**
   * Thêm toast mới
   */
  const addToast = useCallback((notification) => {
    // Kiểm tra xem có phải loại thông báo cần hiển thị pop-up không
    const type = notification.Payload?.type;
    if (!type || !URGENT_NOTIFICATION_TYPES.includes(type)) {
      return;
    }

    // Phát âm thanh thông báo
    playNotificationSound();

    // Thêm toast vào danh sách
    const toastId = `toast-${notification.ThongBaoID}-${Date.now()}`;
    setToasts(prev => [...prev, {
      id: toastId,
      notification,
      autoHideDuration: getAutoHideDuration(type)
    }]);

    // Tự động ẩn sau thời gian quy định
    const autoHideTimer = setTimeout(() => {
      removeToast(toastId);
    }, getAutoHideDuration(type));

    // Lưu timer để có thể clear nếu cần
    timersRef.current[toastId] = autoHideTimer;
  }, [playNotificationSound, removeToast]);

  /**
   * Xử lý click vào toast
   */
  const handleClick = useCallback((toast) => {
    handleNotificationClick(toast.notification);
    removeToast(toast.id);
  }, [handleNotificationClick, removeToast]);

  /**
   * Xử lý đóng toast
   */
  const handleClose = useCallback((e, toastId) => {
    e.stopPropagation(); // Ngăn trigger click event
    removeToast(toastId);
  }, [removeToast]);

  /**
   * Lắng nghe socket events
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data) => {
      if (data && data.ThongBaoID) {
        addToast(data);
      }
    };

    // Subscribe vào notifications
    socket.emit('subscribe_notifications');
    
    // Lắng nghe event new_notification
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected, addToast]);

  /**
   * Cleanup timers khi component unmount
   */
  useEffect(() => {
    return () => {
      // Clear tất cả timers
      Object.values(timersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      timersRef.current = {};
    };
  }, []);

  return (
    <div className="toast-notification-container">
      <AnimatePresence>
        {toasts.map((toast, index) => {
          const { notification } = toast;
          const type = notification.Payload?.type || 'default';
          const Icon = getNotificationIcon(type);
          const color = getNotificationColor(type);

          return (
            <motion.div
              key={toast.id}
              className="toast-notification"
              initial={{ opacity: 0, x: 400, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.8 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.1 
              }}
              style={{ 
                top: `${80 + index * 90}px`,
                borderLeftColor: color 
              }}
              onClick={() => handleClick(toast)}
            >
              <div className="toast-notification__icon" style={{ color }}>
                <Icon />
              </div>
              
              <div className="toast-notification__content">
                <div className="toast-notification__title">
                  {notification.TieuDe}
                </div>
                <div className="toast-notification__message">
                  {notification.NoiDung}
                </div>
              </div>

              <button
                className="toast-notification__close"
                onClick={(e) => handleClose(e, toast.id)}
                aria-label="Đóng"
              >
                <HiOutlineXMark />
              </button>

              {/* Progress bar tự động ẩn */}
              <motion.div
                className="toast-notification__progress"
                style={{ backgroundColor: color }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ 
                  duration: toast.autoHideDuration / 1000,
                  ease: 'linear'
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;

