/**
 * NotificationCenter Component
 * Hiển thị danh sách thông báo với socket integration, pagination, và mark as read
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineVideoCamera,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import useSocket from '../../../hooks/useSocket';
import useNotificationSound from '../../../hooks/useNotificationSound';
import {
  layDanhSachThongBao,
  demThongBaoChuaDoc,
  danhDauDaDoc,
  danhDauDocTatCa
} from '../../../api/nhanVienBanHangApi';
import { getApiBaseUrl } from '../../../config/api';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { playNotificationSound } = useNotificationSound({ enabled: true, volume: 0.5 });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    trangThai: null, // null = tất cả, 'ChuaDoc' = chưa đọc, 'DaDoc' = đã đọc
    loai: null // null = tất cả, hoặc loại cụ thể từ Payload.type
  });

  const loadingRef = useRef(false);

  /**
   * Load danh sách thông báo
   */
  const loadNotifications = useCallback(async (page = 1, reset = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.limit,
        ...(filters.trangThai && { trangThai: filters.trangThai }),
        ...(filters.loai && { loai: filters.loai })
      };

      const response = await layDanhSachThongBao(params);
      
      if (response.success) {
        if (reset) {
          setNotifications(response.data || []);
        } else {
          setNotifications(prev => [...prev, ...(response.data || [])]);
        }

        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        });
      }
    } catch (err) {
      console.error('[NotificationCenter] Load notifications error:', err);
      setError(err.message || 'Lỗi tải thông báo');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [filters, pagination.limit]);

  /**
   * Load số thông báo chưa đọc
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await demThongBaoChuaDoc();
      if (response.success) {
        const count = response.count || 0;
        setUnreadCount(count);
        if (onUnreadCountChange) {
          onUnreadCountChange(count);
        }
      }
    } catch (err) {
      console.error('[NotificationCenter] Load unread count error:', err);
    }
  }, [onUnreadCountChange]);

  /**
   * Đánh dấu thông báo đã đọc
   */
  const markAsRead = useCallback(async (thongBaoId) => {
    try {
      await danhDauDaDoc(thongBaoId);
      
      // Cập nhật local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.ThongBaoID === thongBaoId
            ? { ...notif, TrangThai: 'DaDoc' }
            : notif
        )
      );

      // Reload unread count
      await loadUnreadCount();
    } catch (err) {
      console.error('[NotificationCenter] Mark as read error:', err);
    }
  }, [loadUnreadCount]);

  /**
   * Đánh dấu tất cả đã đọc
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await danhDauDocTatCa();
      
      // Cập nhật local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, TrangThai: 'DaDoc' }))
      );

      // Reload unread count
      await loadUnreadCount();
    } catch (err) {
      console.error('[NotificationCenter] Mark all as read error:', err);
    }
  }, [loadUnreadCount]);

  /**
   * Lấy icon theo loại thông báo
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'cuoc_hen_moi':
      case 'cuoc_hen_nhac_nho':
      case 'cuoc_hen_nhac_bao_cao':
        return <HiOutlineCalendar className="notification-center__icon" />;
      case 'cuoc_hen_da_phe_duyet':
      case 'cuoc_hen_tu_choi':
        return <HiOutlineCheckCircle className="notification-center__icon" />;
      case 'khach_huy_cuoc_hen':
        return <HiOutlineExclamationCircle className="notification-center__icon" />;
      case 'tro_chuyen_moi':
        return <HiOutlineChatBubbleLeftRight className="notification-center__icon" />;
      case 'video_call':
        return <HiOutlineVideoCamera className="notification-center__icon" />;
      case 'giao_dich_coc':
      case 'giao_dich_hoan_tra':
        return <HiOutlineCurrencyDollar className="notification-center__icon" />;
      case 'phan_hoi_goi_y':
      case 'cuoc_hen_tu_qr':
        return <HiOutlineArrowPath className="notification-center__icon" />;
      default:
        return <HiOutlineBell className="notification-center__icon" />;
    }
  };

  /**
   * Format thời gian
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Load notifications khi mở
   */
  useEffect(() => {
    if (isOpen) {
      loadNotifications(1, true);
      loadUnreadCount();
    }
  }, [isOpen, loadNotifications, loadUnreadCount]);

  /**
   * Subscribe socket notifications
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe vào room notifications
    socket.emit('subscribe_notifications');

    // Listen cho thông báo mới
    const handleNewNotification = (data) => {
      console.log('[NotificationCenter] New notification:', data);
      
      // Phát âm thanh thông báo
      const notificationType = data.Payload?.type || 'default';
      playNotificationSound(notificationType);
      
      // Thêm vào đầu danh sách
      setNotifications(prev => [data, ...prev]);
      
      // Tăng unread count
      setUnreadCount(prev => prev + 1);
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount + 1);
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.emit('unsubscribe_notifications');
    };
  }, [socket, isConnected, unreadCount, onUnreadCountChange]);

  /**
   * Load more khi scroll
   */
  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !loading) {
      loadNotifications(pagination.page + 1, false);
    }
  }, [pagination, loading, loadNotifications]);

  /**
   * Điều hướng đến khu vực thao tác của thông báo
   * @param {Object} notif - Thông báo
   */
  const handleNotificationClick = useCallback(async (notif) => {
    const payload = notif.Payload || {};
    const type = payload.type || 'unknown';

    // Đánh dấu đã đọc nếu chưa đọc
    if (notif.TrangThai === 'ChuaDoc') {
      await markAsRead(notif.ThongBaoID);
    }

    // Đóng notification center
    onClose();

    // Điều hướng dựa trên loại thông báo
    try {
      switch (type) {
        case 'tro_chuyen_moi': {
          // Điều hướng đến cuộc trò chuyện
          const cuocHoiThoaiId = payload.CuocHoiThoaiID;
          if (cuocHoiThoaiId) {
            navigate(`/nhan-vien-ban-hang/tin-nhan/${cuocHoiThoaiId}`);
          }
          break;
        }

        case 'video_call': {
          // Mở link video call trong tab mới
          const roomUrl = payload.RoomUrl || payload.roomUrl;
          if (roomUrl) {
            // Mở video call trong window mới
            const width = 1280;
            const height = 720;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            window.open(
              roomUrl,
              'VideoCallWindow',
              `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
            );
          } else {
            // Fallback: điều hướng đến cuộc trò chuyện nếu không có roomUrl
            const cuocHoiThoaiId = payload.CuocHoiThoaiID;
            if (cuocHoiThoaiId) {
              navigate(`/nhan-vien-ban-hang/tin-nhan/${cuocHoiThoaiId}`);
            }
          }
          break;
        }

        case 'cuoc_hen_moi':
        case 'cuoc_hen_cho_phe_duyet':
        case 'cuoc_hen_da_phe_duyet':
        case 'cuoc_hen_tu_choi':
        case 'cuoc_hen_tu_qr':
        case 'khach_huy_cuoc_hen':
        case 'can_bao_cao':
        case 'reminder': {
          // Điều hướng đến chi tiết cuộc hẹn
          const cuocHenId = payload.CuocHenID;
          if (cuocHenId) {
            navigate(`/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}`);
          }
          break;
        }

        case 'phan_hoi_goi_y': {
          // Tạo hoặc điều hướng đến cuộc trò chuyện với khách hàng
          const khachHangID = payload.KhachHangID;
          const tinDangID = payload.TinDangID;
          
          if (khachHangID) {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${getApiBaseUrl()}/api/chat/conversations`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                  ThanhVienIDs: [khachHangID],
                  TieuDe: `Phản hồi gợi ý - ${payload.TieuDeTinDang || 'Tin đăng'}`,
                  ...(tinDangID && { NguCanhID: tinDangID, NguCanhLoai: 'TinDang' })
                })
              });

              const result = await response.json();
              if (result.success && result.data?.CuocHoiThoaiID) {
                navigate(`/nhan-vien-ban-hang/tin-nhan/${result.data.CuocHoiThoaiID}`);
              } else {
                console.warn('[NotificationCenter] Không thể tạo cuộc trò chuyện:', result);
                // Fallback: điều hướng đến trang cuộc hẹn nếu có
                if (payload.CuocHenID) {
                  navigate(`/nhan-vien-ban-hang/cuoc-hen/${payload.CuocHenID}`);
                }
              }
            } catch (err) {
              console.error('[NotificationCenter] Lỗi tạo cuộc trò chuyện:', err);
              // Fallback: điều hướng đến trang cuộc hẹn nếu có
              if (payload.CuocHenID) {
                navigate(`/nhan-vien-ban-hang/cuoc-hen/${payload.CuocHenID}`);
              }
            }
          }
          break;
        }

        case 'coc_moi': {
          // Điều hướng đến chi tiết cuộc hẹn (nơi xác nhận cọc)
          const cuocHenId = payload.CuocHenID;
          if (cuocHenId) {
            navigate(`/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}`);
          }
          break;
        }

        default:
          // Không điều hướng cho các loại thông báo khác
          console.log('[NotificationCenter] Không có điều hướng cho loại:', type);
      }
    } catch (err) {
      console.error('[NotificationCenter] Lỗi điều hướng:', err);
    }
  }, [navigate, markAsRead, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="notification-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="notification-center__header">
        <h3 className="notification-center__title">
          Thông báo
          {unreadCount > 0 && (
            <span className="notification-center__badge">{unreadCount}</span>
          )}
        </h3>
        <div className="notification-center__actions">
          <button
            className="notification-center__action-btn"
            onClick={onClose}
            title="Đóng"
          >
            <HiOutlineXMark />
          </button>
        </div>
      </div>

      <div className="notification-center__filters">
        <div className="notification-center__filters-left">
          <button
            className={`notification-center__filter-btn ${!filters.trangThai ? 'notification-center__filter-btn--active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, trangThai: null }))}
          >
            Tất cả
          </button>
          <button
            className={`notification-center__filter-btn ${filters.trangThai === 'ChuaDoc' ? 'notification-center__filter-btn--active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, trangThai: 'ChuaDoc' }))}
          >
            Chưa đọc
          </button>
          <button
            className={`notification-center__filter-btn ${filters.trangThai === 'DaDoc' ? 'notification-center__filter-btn--active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, trangThai: 'DaDoc' }))}
          >
            Đã đọc
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            className="notification-center__mark-all-btn"
            onClick={markAllAsRead}
            title="Đánh dấu tất cả đã đọc"
          >
            <HiOutlineCheckCircle />
            <span>Đã đọc tất cả</span>
          </button>
        )}
      </div>

      <div className="notification-center__body">
        {loading && notifications.length === 0 ? (
          <div className="notification-center__loading">Đang tải...</div>
        ) : error ? (
          <div className="notification-center__error">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="notification-center__empty">
            <HiOutlineBell />
            <p>Không có thông báo</p>
          </div>
        ) : (
          <div className="notification-center__list">
            {notifications.map((notif) => {
              const payload = notif.Payload || {};
              const type = payload.type || 'unknown';
              const isUnread = notif.TrangThai === 'ChuaDoc';

              return (
                <motion.div
                  key={notif.ThongBaoID}
                  className={`notification-center__item ${isUnread ? 'notification-center__item--unread' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notification-center__item-icon">
                    {getNotificationIcon(type)}
                  </div>
                  <div className="notification-center__item-content">
                    <h4 className="notification-center__item-title">
                      {notif.TieuDe}
                    </h4>
                    <p className="notification-center__item-message">
                      {notif.NoiDung}
                    </p>
                    <div className="notification-center__item-meta">
                      <span className="notification-center__item-time">
                        <HiOutlineClock />
                        {formatTime(notif.TaoLuc)}
                      </span>
                    </div>
                  </div>
                  {isUnread && (
                    <div className="notification-center__item-dot" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {pagination.page < pagination.totalPages && (
          <div className="notification-center__load-more">
            <button
              className="notification-center__load-more-btn"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCenter;

