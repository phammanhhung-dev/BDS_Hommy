/**
 * Socket.IO Notification Handlers
 * Xử lý real-time notifications cho Nhân viên Bán hàng
 */

const ThongBaoModel = require('../models/ThongBaoModel');

/**
 * Setup Notification Socket Handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
function setupNotificationHandlers(socket, io) {
  const userId = socket.user.NguoiDungID;

  console.log(`[Socket.IO] User ${userId} connected for notifications (socket ID: ${socket.id})`);

  /**
   * SUBSCRIBE_NOTIFICATIONS: NVBH subscribe vào room notifications
   */
  socket.on('subscribe_notifications', () => {
    const roomName = `notifications:${userId}`;
    socket.join(roomName);
    console.log(`[Socket.IO] User ${userId} subscribed to notifications room: ${roomName}`);
    
    socket.emit('subscribed_notifications', { room: roomName });
  });

  /**
   * UNSUBSCRIBE_NOTIFICATIONS: NVBH unsubscribe khỏi room notifications
   */
  socket.on('unsubscribe_notifications', () => {
    const roomName = `notifications:${userId}`;
    socket.leave(roomName);
    console.log(`[Socket.IO] User ${userId} unsubscribed from notifications room: ${roomName}`);
    
    socket.emit('unsubscribed_notifications', { room: roomName });
  });

  /**
   * DISCONNECT: User ngắt kết nối
   */
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User ${userId} disconnected from notifications (socket ID: ${socket.id})`);
  });
}

/**
 * Helper: Emit notification:new event đến NVBH
 * @param {Server} io - Socket.IO server instance
 * @param {number} nguoiNhanId - ID người nhận
 * @param {Object} thongBao - Thông báo object
 */
function emitNotificationNew(io, nguoiNhanId, thongBao) {
  try {
    const roomName = `notifications:${nguoiNhanId}`;
    io.to(roomName).emit('notification:new', {
      ThongBaoID: thongBao.ThongBaoID,
      TieuDe: thongBao.TieuDe,
      NoiDung: thongBao.NoiDung,
      Payload: thongBao.Payload,
      TaoLuc: thongBao.TaoLuc
    });
    
    console.log(`[Socket.IO] Emitted notification:new to room ${roomName} for user ${nguoiNhanId}`);
  } catch (error) {
    console.error('[Socket.IO] Lỗi emit notification:new:', error);
  }
}

module.exports = {
  setupNotificationHandlers,
  emitNotificationNew
};


