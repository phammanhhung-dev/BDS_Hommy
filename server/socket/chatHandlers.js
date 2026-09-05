/**
 * @fileoverview Socket.IO Chat Event Handlers
 * @module chatHandlers
 */

const ChatModel = require('../models/ChatModel');
const NhatKyService = require('../services/NhatKyHeThongService');

// Rate limiting: Map để lưu số lượng tin nhắn của mỗi user
const userMessageCount = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
const MAX_MESSAGES_PER_MINUTE = 50;

// Map để lưu thông tin cuộc gọi video đang chờ (để lưu cuộc gọi nhỡ)
// Key: cuocHoiThoaiID, Value: { nguoiGoiID, nguoiGoiTen, roomUrl, timestamp }
const pendingVideoCalls = new Map();

/**
 * Reset message count sau mỗi phút
 */
setInterval(() => {
  userMessageCount.clear();
}, RATE_LIMIT_WINDOW);

/**
 * Kiểm tra rate limit
 */
function checkRateLimit(userId) {
  const count = userMessageCount.get(userId) || 0;
  if (count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  userMessageCount.set(userId, count + 1);
  return true;
}

/**
 * XSS Sanitization helper
 */
function sanitizeMessage(content) {
  try {
    const DOMPurify = require('isomorphic-dompurify');
    return DOMPurify.sanitize(content.trim());
  } catch (error) {
    // Fallback: basic sanitization if DOMPurify not available
    return content.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

/**
 * Setup Chat Socket Handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
function setupChatHandlers(socket, io) {
  const userId = socket.user.NguoiDungID;

  console.log(`[Socket.IO] User ${userId} connected (socket ID: ${socket.id})`);

  /**
   * JOIN_CONVERSATION: Tham gia vào một cuộc hội thoại
   */
  socket.on('join_conversation', async ({ cuocHoiThoaiID }) => {
    try {
      // Kiểm tra quyền truy cập
      const hasAccess = await ChatModel.kiemTraQuyenTruyCap(cuocHoiThoaiID, userId);
      
      if (!hasAccess) {
        return socket.emit('error', {
          event: 'join_conversation',
          message: 'Bạn không có quyền truy cập cuộc hội thoại này'
        });
      }

      // Join socket room
      socket.join(`conversation_${cuocHoiThoaiID}`);
      
      console.log(`[Socket.IO] User ${userId} joined conversation ${cuocHoiThoaiID}`);
      
      socket.emit('joined_conversation', { cuocHoiThoaiID });

      // Thông báo cho các thành viên khác
      socket.to(`conversation_${cuocHoiThoaiID}`).emit('user_online', {
        nguoiDungID: userId,
        cuocHoiThoaiID
      });

    } catch (error) {
      console.error('[Socket.IO] join_conversation error:', error);
      socket.emit('error', {
        event: 'join_conversation',
        message: error.message
      });
    }
  });

  /**
   * LEAVE_CONVERSATION: Rời khỏi cuộc hội thoại
   */
  socket.on('leave_conversation', ({ cuocHoiThoaiID }) => {
    socket.leave(`conversation_${cuocHoiThoaiID}`);
    
    console.log(`[Socket.IO] User ${userId} left conversation ${cuocHoiThoaiID}`);
    
    // Thông báo cho các thành viên khác
    socket.to(`conversation_${cuocHoiThoaiID}`).emit('user_offline', {
      nguoiDungID: userId,
      cuocHoiThoaiID
    });
  });

  /**
   * SEND_MESSAGE: Gửi tin nhắn
   */
  socket.on('send_message', async ({ cuocHoiThoaiID, noiDung }) => {
    try {
      // Rate limiting
      if (!checkRateLimit(userId)) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút.'
        });
      }

      // Validation
      if (!noiDung || noiDung.trim().length === 0) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Nội dung tin nhắn không được để trống'
        });
      }

      if (noiDung.length > 5000) {
        return socket.emit('error', {
          event: 'send_message',
          message: 'Tin nhắn quá dài (tối đa 5000 ký tự)'
        });
      }

      // XSS Prevention
      const sanitizedNoiDung = sanitizeMessage(noiDung);

      // Lưu tin nhắn vào database
      const tinNhan = await ChatModel.guiTinNhan({
        CuocHoiThoaiID: cuocHoiThoaiID,
        NguoiGuiID: userId,
        NoiDung: sanitizedNoiDung
      });

      // Broadcast tin nhắn đến tất cả thành viên trong room
      io.to(`conversation_${cuocHoiThoaiID}`).emit('new_message', tinNhan);

      console.log(`[Socket.IO] Message sent: ${tinNhan.TinNhanID} in conversation ${cuocHoiThoaiID}`);

      // Gửi thông báo cho NVBH nếu có trong cuộc hội thoại (async, không chờ)
      // Lấy danh sách thành viên và kiểm tra ai là NVBH
      const db = require('../config/db');
      const [thanhVienRows] = await db.execute(`
        SELECT tv.NguoiDungID, nd.VaiTroHoatDongID
        FROM thanhviencuochoithoai tv
        INNER JOIN nguoidung nd ON tv.NguoiDungID = nd.NguoiDungID
        WHERE tv.CuocHoiThoaiID = ? AND tv.NguoiDungID != ?
      `, [cuocHoiThoaiID, userId]);

      // VaiTroHoatDongID = 2 là NhanVienBanHang
      const nvbhMembers = thanhVienRows.filter(member => member.VaiTroHoatDongID === 2);
      
      if (nvbhMembers.length > 0) {
        const ThongBaoService = require('../services/ThongBaoService');
        // Gửi thông báo cho tất cả NVBH trong cuộc hội thoại
        nvbhMembers.forEach(nvbh => {
          ThongBaoService.thongBaoTroChuyenMoi(cuocHoiThoaiID, nvbh.NguoiDungID, tinNhan.TinNhanID)
            .catch(err => console.error(`[Socket.IO] Lỗi gửi thông báo cho NVBH ${nvbh.NguoiDungID}:`, err));
        });
      }

      // Audit log (async, không chờ)
      NhatKyService.ghiNhan({
        NguoiDungID: userId,
        HanhDong: 'gui_tin_nhan_socket',
        DoiTuong: 'tinnhan',
        DoiTuongID: tinNhan.TinNhanID,
        ChiTiet: JSON.stringify({ CuocHoiThoaiID: cuocHoiThoaiID })
      }).catch(err => console.error('[Socket.IO] Audit log error:', err));

    } catch (error) {
      console.error('[Socket.IO] send_message error:', error);
      socket.emit('error', {
        event: 'send_message',
        message: error.message || 'Lỗi khi gửi tin nhắn'
      });
    }
  });

  /**
   * TYPING_START: Bắt đầu gõ tin nhắn
   */
  socket.on('typing_start', ({ cuocHoiThoaiID }) => {
    socket.to(`conversation_${cuocHoiThoaiID}`).emit('user_typing', {
      nguoiDungID: userId,
      cuocHoiThoaiID,
      typing: true
    });
  });

  /**
   * TYPING_STOP: Dừng gõ tin nhắn
   */
  socket.on('typing_stop', ({ cuocHoiThoaiID }) => {
    socket.to(`conversation_${cuocHoiThoaiID}`).emit('user_typing', {
      nguoiDungID: userId,
      cuocHoiThoaiID,
      typing: false
    });
  });

  /**
   * MARK_AS_READ: Đánh dấu đã đọc
   */
  socket.on('mark_as_read', async ({ cuocHoiThoaiID }) => {
    try {
      await ChatModel.danhDauDaDoc(cuocHoiThoaiID, userId);
      
      // Thông báo cho các thành viên khác
      socket.to(`conversation_${cuocHoiThoaiID}`).emit('message_read', {
        nguoiDungID: userId,
        cuocHoiThoaiID,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('[Socket.IO] mark_as_read error:', error);
    }
  });

  /**
   * INITIATE_VIDEO_CALL: Chủ dự án gọi video cho NVBH
   */
  socket.on('initiate_video_call', async ({ cuocHoiThoaiID, roomUrl }) => {
    try {
      // Validation
      if (!cuocHoiThoaiID || !roomUrl) {
        return socket.emit('error', {
          event: 'initiate_video_call',
          message: 'Thiếu thông tin cuộc gọi'
        });
      }

      // Kiểm tra quyền truy cập
      const hasAccess = await ChatModel.kiemTraQuyenTruyCap(cuocHoiThoaiID, userId);
      
      if (!hasAccess) {
        return socket.emit('error', {
          event: 'initiate_video_call',
          message: 'Bạn không có quyền truy cập cuộc hội thoại này'
        });
      }

      // Lấy thông tin người gọi
      const db = require('../config/db');
      const [nguoiGoiRows] = await db.execute(`
        SELECT NguoiDungID, TenDayDu, VaiTroHoatDongID
        FROM nguoidung
        WHERE NguoiDungID = ?
      `, [userId]);

      if (nguoiGoiRows.length === 0) {
        return socket.emit('error', {
          event: 'initiate_video_call',
          message: 'Không tìm thấy thông tin người gọi'
        });
      }

      const nguoiGoi = nguoiGoiRows[0];

      // Lấy danh sách thành viên trong cuộc hội thoại (trừ người gọi)
      const [thanhVienRows] = await db.execute(`
        SELECT tv.NguoiDungID, nd.TenDayDu, nd.VaiTroHoatDongID
        FROM thanhviencuochoithoai tv
        INNER JOIN nguoidung nd ON tv.NguoiDungID = nd.NguoiDungID
        WHERE tv.CuocHoiThoaiID = ? AND tv.NguoiDungID != ?
      `, [cuocHoiThoaiID, userId]);

      // Lưu thông tin cuộc gọi vào Map (để lưu cuộc gọi nhỡ sau này)
      pendingVideoCalls.set(cuocHoiThoaiID, {
        nguoiGoiID: userId,
        nguoiGoiTen: nguoiGoi.TenDayDu,
        roomUrl,
        timestamp: new Date().toISOString()
      });

      // Tự động xóa sau 2 phút (cuộc gọi đã kết thúc hoặc quá lâu)
      setTimeout(() => {
        pendingVideoCalls.delete(cuocHoiThoaiID);
      }, 2 * 60 * 1000);

      // Gửi thông báo video call cho tất cả thành viên khác
      thanhVienRows.forEach(thanhVien => {
        // Emit event video_call_incoming cho từng thành viên
        io.to(`notifications:${thanhVien.NguoiDungID}`).emit('video_call_incoming', {
          cuocHoiThoaiID,
          nguoiGoiID: userId,
          nguoiGoiTen: nguoiGoi.TenDayDu,
          roomUrl,
          timestamp: new Date().toISOString()
        });

        // Gửi thông báo trong-app cho NVBH (nếu là NVBH)
        if (thanhVien.VaiTroHoatDongID === 2) {
          const ThongBaoService = require('../services/ThongBaoService');
          ThongBaoService.thongBaoVideoCall(
            cuocHoiThoaiID,
            userId,
            thanhVien.NguoiDungID,
            roomUrl
          ).catch(err => console.error(`[Socket.IO] Lỗi gửi thông báo video call cho NVBH ${thanhVien.NguoiDungID}:`, err));
        }
      });

      console.log(`[Socket.IO] Video call initiated by user ${userId} in conversation ${cuocHoiThoaiID}`);

      // Xác nhận cho người gọi
      socket.emit('video_call_initiated', {
        cuocHoiThoaiID,
        roomUrl,
        recipients: thanhVienRows.map(tv => tv.NguoiDungID)
      });

    } catch (error) {
      console.error('[Socket.IO] initiate_video_call error:', error);
      socket.emit('error', {
        event: 'initiate_video_call',
        message: error.message || 'Lỗi khi khởi tạo cuộc gọi video'
      });
    }
  });

  /**
   * ANSWER_VIDEO_CALL: NVBH trả lời cuộc gọi
   */
  socket.on('answer_video_call', async ({ cuocHoiThoaiID, accepted, roomUrl, missed }) => {
    try {
      // Nếu là cuộc gọi nhỡ (missed = true), lưu vào tin nhắn
      if (missed === true) {
        try {
          // Lấy thông tin người gọi từ Map
          const callInfo = pendingVideoCalls.get(cuocHoiThoaiID);
          
          if (callInfo) {
            // Lưu tin nhắn cuộc gọi nhỡ
            const missedCallMessage = JSON.stringify({
              type: 'video_call_missed',
              nguoiGoiID: callInfo.nguoiGoiID,
              nguoiGoiTen: callInfo.nguoiGoiTen,
              timestamp: callInfo.timestamp,
              roomUrl: callInfo.roomUrl || null
            });

            await ChatModel.guiTinNhan({
              CuocHoiThoaiID: cuocHoiThoaiID,
              NguoiGuiID: userId, // NVBH là người nhận (missed)
              NoiDung: missedCallMessage
            });

            // Xóa khỏi Map sau khi đã lưu
            pendingVideoCalls.delete(cuocHoiThoaiID);

            // Broadcast tin nhắn cuộc gọi nhỡ đến tất cả thành viên
            io.to(`conversation_${cuocHoiThoaiID}`).emit('new_message', {
              TinNhanID: null, // Sẽ được set bởi ChatModel
              CuocHoiThoaiID: cuocHoiThoaiID,
              NguoiGuiID: userId,
              NoiDung: missedCallMessage,
              ThoiGian: new Date(),
              NguoiGuiTen: 'Hệ thống'
            });

            console.log(`[Socket.IO] Missed video call saved to conversation ${cuocHoiThoaiID}`);
          } else {
            console.warn(`[Socket.IO] Không tìm thấy thông tin cuộc gọi cho conversation ${cuocHoiThoaiID}`);
          }
        } catch (saveError) {
          console.error('[Socket.IO] Lỗi lưu cuộc gọi nhỡ:', saveError);
        }
      } else {
        // Nếu không phải cuộc gọi nhỡ (đồng ý hoặc từ chối), xóa khỏi Map
        pendingVideoCalls.delete(cuocHoiThoaiID);
      }

      // Thông báo cho người gọi
      socket.to(`conversation_${cuocHoiThoaiID}`).emit('video_call_answered', {
        cuocHoiThoaiID,
        nguoiTraLoiID: userId,
        accepted,
        roomUrl: accepted ? roomUrl : null,
        missed: missed || false,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket.IO] Video call answered by user ${userId} in conversation ${cuocHoiThoaiID}: ${accepted ? 'accepted' : missed ? 'missed' : 'rejected'}`);
    } catch (error) {
      console.error('[Socket.IO] answer_video_call error:', error);
      socket.emit('error', {
        event: 'answer_video_call',
        message: error.message || 'Lỗi khi trả lời cuộc gọi'
      });
    }
  });

  /**
   * DISCONNECT: User ngắt kết nối
   */
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User ${userId} disconnected (socket ID: ${socket.id})`);
    
    // Thông báo offline cho tất cả conversations mà user đang tham gia
    // (Socket.IO tự động leave all rooms khi disconnect)
  });
}

module.exports = setupChatHandlers;


