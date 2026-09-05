/**
 * Video Call Notification Component
 * Pop-up riêng cho video call với nút Đồng ý/Từ chối
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineVideoCamera,
  HiOutlinePhone,
  HiOutlineXMark,
  HiUserCircle
} from 'react-icons/hi2';
import useSocket from '../../../hooks/useSocket';
import useNotificationSound from '../../../hooks/useNotificationSound';
import './VideoCallNotification.css';

const VideoCallNotification = () => {
  const { socket, isConnected } = useSocket();
  const { playNotificationSound } = useNotificationSound({ enabled: true, volume: 0.7 });

  const [incomingCall, setIncomingCall] = useState(null);
  const [isRinging, setIsRinging] = useState(false);

  // Refs để quản lý timers
  const ringingIntervalRef = React.useRef(null);
  const autoRejectTimerRef = React.useRef(null);

  /**
   * Helper để clear timers
   */
  const clearTimers = useCallback(() => {
    if (ringingIntervalRef.current) {
      clearInterval(ringingIntervalRef.current);
      ringingIntervalRef.current = null;
    }
    if (autoRejectTimerRef.current) {
      clearTimeout(autoRejectTimerRef.current);
      autoRejectTimerRef.current = null;
    }
  }, []);

  /**
   * Xử lý đồng ý cuộc gọi
   */
  const handleAccept = useCallback(() => {
    if (!incomingCall) return;

    const { cuocHoiThoaiID, roomUrl } = incomingCall;

    // Gửi socket event trả lời đồng ý
    if (socket && isConnected) {
      socket.emit('answer_video_call', {
        cuocHoiThoaiID,
        accepted: true,
        roomUrl
      });
    }

    // Mở room video call
    const width = 1280;
    const height = 720;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      roomUrl,
      'VideoCallWindow',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );

    // Xóa timers và đóng pop-up
    clearTimers();
    setIncomingCall(null);
    setIsRinging(false);
  }, [incomingCall, socket, isConnected, clearTimers]);

  /**
   * Xử lý từ chối cuộc gọi
   */
  const handleReject = useCallback(() => {
    if (!incomingCall) return;

    const { cuocHoiThoaiID } = incomingCall;

    // Gửi socket event trả lời từ chối
    if (socket && isConnected) {
      socket.emit('answer_video_call', {
        cuocHoiThoaiID,
        accepted: false,
        roomUrl: null,
        missed: false // Người dùng chủ động từ chối, không phải nhỡ
      });
    }

    // Xóa timers và đóng pop-up
    clearTimers();
    setIncomingCall(null);
    setIsRinging(false);
  }, [incomingCall, socket, isConnected, clearTimers]);

  /**
   * Lắng nghe socket events
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe vào room notifications để nhận video call
    socket.emit('subscribe_notifications');
    console.log('[VideoCallNotification] Subscribed to notifications room');

    const handleVideoCallIncoming = (data) => {
      console.log('[VideoCallNotification] Incoming video call:', data);

      // Clear timers cũ nếu có
      clearTimers();

      // Phát âm thanh lần đầu
      playNotificationSound('video_call');

      // Hiển thị pop-up
      setIncomingCall(data);
      setIsRinging(true);

      // Chuông reo liên tục mỗi 2.5 giây trong 1 phút
      let ringCount = 0;
      const maxRings = 24; // 60 giây / 2.5 giây = 24 lần

      ringingIntervalRef.current = setInterval(() => {
        ringCount++;
        if (ringCount < maxRings) {
          playNotificationSound('video_call');
        } else {
          // Dừng chuông sau 1 phút
          if (ringingIntervalRef.current) {
            clearInterval(ringingIntervalRef.current);
            ringingIntervalRef.current = null;
          }
        }
      }, 2500); // Mỗi 2.5 giây

      // Tự động từ chối sau 1 phút (60000ms) nếu không trả lời
      autoRejectTimerRef.current = setTimeout(async () => {
        // Dừng chuông
        if (ringingIntervalRef.current) {
          clearInterval(ringingIntervalRef.current);
          ringingIntervalRef.current = null;
        }

        setIncomingCall(prev => {
          if (prev?.cuocHoiThoaiID === data.cuocHoiThoaiID) {
            // Gửi socket event từ chối và lưu cuộc gọi nhỡ
            if (socket && isConnected) {
              socket.emit('answer_video_call', {
                cuocHoiThoaiID: data.cuocHoiThoaiID,
                accepted: false,
                roomUrl: null,
                missed: true // Đánh dấu là cuộc gọi nhỡ
              });
            }
            return null;
          }
          return prev;
        });
        setIsRinging(false);
      }, 60000); // 1 phút


    };

    const handleCallEnded = () => {
      console.log('[VideoCallNotification] Call ended or answered elsewhere');
      clearTimers();
      setIncomingCall(null);
      setIsRinging(false);
    };

    socket.on('video_call_incoming', handleVideoCallIncoming);
    socket.on('video_call_answered', handleCallEnded); // Nghe ở thiết bị khác
    socket.on('video_call_rejected', handleCallEnded); // Từ chối ở thiết bị khác
    socket.on('video_call_ended', handleCallEnded);    // Người gọi tắt máy

    return () => {
      socket.off('video_call_incoming', handleVideoCallIncoming);
      socket.off('video_call_answered', handleCallEnded);
      socket.off('video_call_rejected', handleCallEnded);
      socket.off('video_call_ended', handleCallEnded);
      socket.emit('unsubscribe_notifications');
      clearTimers();
    };
  }, [socket, isConnected, playNotificationSound, clearTimers]);

  /**
   * Animation cho icon video
   */
  const pulseAnimation = {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  if (!incomingCall) return null;

  const { nguoiGoiTen, nguoiGoiID } = incomingCall;

  return (
    <AnimatePresence>
      <motion.div
        className="video-call-notification"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Overlay */}
        <div className="video-call-notification__overlay" onClick={handleReject} />

        {/* Container */}
        <div className="video-call-notification__container">
          {/* Header */}
          <div className="video-call-notification__header">
            <motion.div
              className="video-call-notification__icon-wrapper"
              animate={isRinging ? pulseAnimation : {}}
            >
              <HiOutlineVideoCamera className="video-call-notification__icon" />
            </motion.div>
            <h3 className="video-call-notification__title">Cuộc gọi video đến</h3>
          </div>

          {/* Body */}
          <div className="video-call-notification__body">
            {/* Avatar */}
            <div className="video-call-notification__avatar">
              <HiUserCircle />
            </div>

            {/* Thông tin người gọi */}
            <div className="video-call-notification__info">
              <p className="video-call-notification__caller-name">
                {nguoiGoiTen || `Người dùng #${nguoiGoiID}`}
              </p>
              <p className="video-call-notification__caller-status">
                {isRinging ? 'Đang gọi...' : 'Đang chờ'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="video-call-notification__actions">
            <button
              className="video-call-notification__button video-call-notification__button--reject"
              onClick={handleReject}
              aria-label="Từ chối"
            >
              <HiOutlineXMark />
              <span>Từ chối</span>
            </button>

            <button
              className="video-call-notification__button video-call-notification__button--accept"
              onClick={handleAccept}
              aria-label="Đồng ý"
            >
              <HiOutlinePhone />
              <span>Đồng ý</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallNotification;

