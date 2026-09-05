/**
 * @fileoverview Routes quản lý Chat/Messaging
 * @module chatRoutes
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ChatController = require('../controllers/ChatController');

// Base path: /api/chat

/**
 * POST /api/chat/conversations
 * Tạo hoặc lấy cuộc hội thoại
 */
router.post(
  '/conversations',
  authMiddleware,
  ChatController.taoHoacLayCuocHoiThoai
);

/**
 * GET /api/chat/conversations
 * Lấy danh sách cuộc hội thoại (với unread count)
 */
router.get(
  '/conversations',
  authMiddleware,
  ChatController.layDanhSachCuocHoiThoai
);

/**
 * GET /api/chat/conversations/:id
 * Lấy chi tiết cuộc hội thoại
 */
router.get(
  '/conversations/:id',
  authMiddleware,
  ChatController.layChiTietCuocHoiThoai
);

/**
 * GET /api/chat/conversations/:id/messages
 * Lấy lịch sử tin nhắn
 */
router.get(
  '/conversations/:id/messages',
  authMiddleware,
  ChatController.layTinNhan
);

/**
 * POST /api/chat/conversations/:id/messages
 * Gửi tin nhắn (REST fallback when Socket.IO offline)
 */
router.post(
  '/conversations/:id/messages',
  authMiddleware,
  ChatController.guiTinNhan
);

/**
 * PUT /api/chat/conversations/:id/mark-read
 * Đánh dấu đã đọc
 */
router.put(
  '/conversations/:id/mark-read',
  authMiddleware,
  ChatController.danhDauDaDoc
);

/**
 * DELETE /api/chat/messages/:id
 * Xóa tin nhắn (soft delete)
 */
router.delete(
  '/messages/:id',
  authMiddleware,
  ChatController.xoaTinNhan
);

module.exports = router;


