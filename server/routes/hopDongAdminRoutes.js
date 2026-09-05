/**
 * @fileoverview Routes quản lý Hợp đồng cho Admin/Operator
 * @module hopDongAdminRoutes
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');
const HopDongController = require('../controllers/HopDongController');

// Middleware: Chỉ cho phép Admin và Operator
const adminAuth = [authMiddleware, requireRoles(['QuanTriVienHeThong', 'NhanVienDieuHanh'])];

/**
 * GET /api/admin/hop-dong
 * Lấy tất cả hợp đồng (cho Admin/Operator)
 */
router.get(
  '/hop-dong',
  adminAuth,
  HopDongController.layTatCa
);

/**
 * POST /api/admin/hop-dong/:id/xac-nhan-huy
 * Admin xác nhận hủy hợp đồng và hoàn tiền cọc
 */
router.post(
  '/hop-dong/:id/xac-nhan-huy',
  adminAuth,
  HopDongController.xacNhanHuy
);

module.exports = router;

