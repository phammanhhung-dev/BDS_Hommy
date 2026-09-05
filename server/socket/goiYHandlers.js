/**
 * @fileoverview Socket.IO Gợi ý Tin đăng Event Handlers
 * @module goiYHandlers
 * 
 * Xử lý real-time notifications cho tính năng "Gợi ý phòng khác"
 * NVBH subscribe theo maQR để nhận thông báo khi khách phản hồi
 */

const QRSessionStore = require('../services/QRSessionStore');

/**
 * Setup Gợi ý Socket Handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
function setupGoiYHandlers(socket, io) {
  const userId = socket.user?.NguoiDungID;

  if (!userId) {
    console.log('[GoiY Socket] No userId, skipping goiY handlers');
    return;
  }

  console.log(`[GoiY Socket] Setting up handlers for user ${userId}`);

  /**
   * SUBSCRIBE_GOI_Y: NVBH subscribe để nhận thông báo phản hồi
   * @param {Object} data - { maQR: string }
   */
  socket.on('subscribe_goi_y', ({ maQR }) => {
    try {
      if (!maQR) {
        return socket.emit('error', {
          event: 'subscribe_goi_y',
          message: 'Thiếu mã QR'
        });
      }

      // Kiểm tra session tồn tại và thuộc về user này
      const session = QRSessionStore.get(maQR);
      
      if (!session) {
        return socket.emit('error', {
          event: 'subscribe_goi_y',
          message: 'Session không tồn tại hoặc đã hết hạn'
        });
      }

      if (session.nhanVienId !== userId) {
        return socket.emit('error', {
          event: 'subscribe_goi_y',
          message: 'Không có quyền subscribe session này'
        });
      }

      // Join room theo maQR
      const roomName = `goi_y_${maQR}`;
      socket.join(roomName);
      
      console.log(`[GoiY Socket] User ${userId} subscribed to ${roomName}`);
      
      // Emit confirmation
      socket.emit('subscribed_goi_y', {
        maQR,
        trangThai: session.trangThai,
        thoiGianConLai: QRSessionStore.getRemainingTime(maQR)
      });

      // Nếu session đã có phản hồi, emit ngay
      if (session.trangThai !== 'CHO_PHAN_HOI') {
        socket.emit('goi_y_phan_hoi', {
          maQR,
          trangThai: session.trangThai,
          phanHoiLuc: session.phanHoiLuc
        });
      }

    } catch (error) {
      console.error('[GoiY Socket] subscribe_goi_y error:', error);
      socket.emit('error', {
        event: 'subscribe_goi_y',
        message: error.message
      });
    }
  });

  /**
   * UNSUBSCRIBE_GOI_Y: NVBH unsubscribe khỏi room
   * @param {Object} data - { maQR: string }
   */
  socket.on('unsubscribe_goi_y', ({ maQR }) => {
    try {
      if (!maQR) return;

      const roomName = `goi_y_${maQR}`;
      socket.leave(roomName);
      
      console.log(`[GoiY Socket] User ${userId} unsubscribed from ${roomName}`);
      
      socket.emit('unsubscribed_goi_y', { maQR });

    } catch (error) {
      console.error('[GoiY Socket] unsubscribe_goi_y error:', error);
    }
  });

  /**
   * CHECK_GOI_Y_STATUS: Kiểm tra trạng thái QR (polling fallback)
   * @param {Object} data - { maQR: string }
   */
  socket.on('check_goi_y_status', ({ maQR }) => {
    try {
      if (!maQR) {
        return socket.emit('error', {
          event: 'check_goi_y_status',
          message: 'Thiếu mã QR'
        });
      }

      const session = QRSessionStore.get(maQR);
      
      if (!session) {
        return socket.emit('goi_y_status', {
          maQR,
          trangThai: 'KHONG_TON_TAI',
          thoiGianConLai: 0
        });
      }

      socket.emit('goi_y_status', {
        maQR,
        trangThai: session.trangThai,
        thoiGianConLai: QRSessionStore.getRemainingTime(maQR),
        phanHoiLuc: session.phanHoiLuc
      });

    } catch (error) {
      console.error('[GoiY Socket] check_goi_y_status error:', error);
      socket.emit('error', {
        event: 'check_goi_y_status',
        message: error.message
      });
    }
  });

  /**
   * Cleanup khi disconnect
   */
  socket.on('disconnect', () => {
    console.log(`[GoiY Socket] User ${userId} disconnected`);
    // Socket.IO tự động leave tất cả rooms khi disconnect
  });
}

module.exports = setupGoiYHandlers;

