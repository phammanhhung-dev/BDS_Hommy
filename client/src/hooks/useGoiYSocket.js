/**
 * @fileoverview Socket.IO Hook cho Gợi ý Tin đăng
 * @hook useGoiYSocket
 * 
 * Quản lý real-time notifications khi khách phản hồi QR "Xem Ngay"
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from './useSocket';

/**
 * Trạng thái QR
 */
export const QR_STATUS = {
  CHO_PHAN_HOI: 'CHO_PHAN_HOI',
  DONG_Y: 'DONG_Y',
  TU_CHOI: 'TU_CHOI',
  HET_HAN: 'HET_HAN',
  KHONG_TON_TAI: 'KHONG_TON_TAI'
};

/**
 * Custom hook để quản lý Socket.IO cho tính năng Gợi ý Tin đăng
 * @param {string} maQR - Mã QR để subscribe
 * @returns {Object} - { trangThai, thoiGianConLai, phanHoi, isWaiting, subscribe, unsubscribe }
 */
export const useGoiYSocket = (maQR = null) => {
  const { socket, isConnected } = useSocket();
  const [trangThai, setTrangThai] = useState(QR_STATUS.CHO_PHAN_HOI);
  const [thoiGianConLai, setThoiGianConLai] = useState(0);
  const [phanHoi, setPhanHoi] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState(null);
  
  const countdownRef = useRef(null);
  const currentMaQRRef = useRef(null);

  /**
   * Bắt đầu countdown timer
   */
  const startCountdown = useCallback((seconds) => {
    // Clear existing timer
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setThoiGianConLai(seconds);

    countdownRef.current = setInterval(() => {
      setThoiGianConLai(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setTrangThai(QR_STATUS.HET_HAN);
          setIsWaiting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Subscribe vào room để nhận thông báo
   */
  const subscribe = useCallback((qrCode) => {
    if (!socket || !qrCode) return;

    currentMaQRRef.current = qrCode;
    setIsWaiting(true);
    setTrangThai(QR_STATUS.CHO_PHAN_HOI);
    setPhanHoi(null);
    setError(null);

    socket.emit('subscribe_goi_y', { maQR: qrCode });
    console.log('[useGoiYSocket] Subscribed to:', qrCode);
  }, [socket]);

  /**
   * Unsubscribe khỏi room
   */
  const unsubscribe = useCallback(() => {
    if (!socket || !currentMaQRRef.current) return;

    socket.emit('unsubscribe_goi_y', { maQR: currentMaQRRef.current });
    console.log('[useGoiYSocket] Unsubscribed from:', currentMaQRRef.current);

    // Clear state
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    currentMaQRRef.current = null;
    setIsWaiting(false);
  }, [socket]);

  /**
   * Kiểm tra trạng thái (polling fallback)
   */
  const checkStatus = useCallback(() => {
    if (!socket || !currentMaQRRef.current) return;

    socket.emit('check_goi_y_status', { maQR: currentMaQRRef.current });
  }, [socket]);

  /**
   * Setup socket event listeners
   */
  useEffect(() => {
    if (!socket) return;

    // Khi subscribe thành công
    const handleSubscribed = ({ maQR: qr, trangThai: status, thoiGianConLai: remaining }) => {
      if (qr !== currentMaQRRef.current) return;
      
      console.log('[useGoiYSocket] Subscribed confirmed:', { qr, status, remaining });
      setTrangThai(status);
      
      if (remaining > 0) {
        startCountdown(remaining);
      }
    };

    // Khi có phản hồi từ khách
    const handlePhanHoi = ({ maQR: qr, trangThai: status, phanHoiLuc }) => {
      if (qr !== currentMaQRRef.current) return;

      console.log('[useGoiYSocket] Got response:', { qr, status, phanHoiLuc });
      
      setTrangThai(status);
      setPhanHoi({
        trangThai: status,
        phanHoiLuc: phanHoiLuc ? new Date(phanHoiLuc) : new Date()
      });
      setIsWaiting(false);

      // Stop countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };

    // Khi kiểm tra trạng thái
    const handleStatus = ({ maQR: qr, trangThai: status, thoiGianConLai: remaining, phanHoiLuc }) => {
      if (qr !== currentMaQRRef.current) return;

      setTrangThai(status);
      
      if (status !== QR_STATUS.CHO_PHAN_HOI) {
        setPhanHoi({
          trangThai: status,
          phanHoiLuc: phanHoiLuc ? new Date(phanHoiLuc) : null
        });
        setIsWaiting(false);
      } else if (remaining > 0) {
        setThoiGianConLai(remaining);
      }
    };

    // Khi có lỗi
    const handleError = ({ event, message }) => {
      console.error('[useGoiYSocket] Error:', event, message);
      setError(message);
      
      if (event === 'subscribe_goi_y') {
        setIsWaiting(false);
      }
    };

    socket.on('subscribed_goi_y', handleSubscribed);
    socket.on('goi_y_phan_hoi', handlePhanHoi);
    socket.on('goi_y_status', handleStatus);
    socket.on('error', handleError);

    return () => {
      socket.off('subscribed_goi_y', handleSubscribed);
      socket.off('goi_y_phan_hoi', handlePhanHoi);
      socket.off('goi_y_status', handleStatus);
      socket.off('error', handleError);
    };
  }, [socket, startCountdown]);

  /**
   * Auto-subscribe nếu maQR được truyền vào
   */
  useEffect(() => {
    if (maQR && isConnected) {
      subscribe(maQR);
    }

    return () => {
      if (maQR) {
        unsubscribe();
      }
    };
  }, [maQR, isConnected, subscribe, unsubscribe]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    trangThai,
    thoiGianConLai,
    phanHoi,
    isWaiting,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    checkStatus
  };
};

export default useGoiYSocket;

