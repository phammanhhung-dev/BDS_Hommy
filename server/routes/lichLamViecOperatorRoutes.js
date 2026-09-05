/**
 * Routes cho Operator - Quản lý Lịch làm việc NVBH
 * UC-OPER-03
 */

const express = require('express');
const router = express.Router();
const LichLamViecOperatorController = require('../controllers/LichLamViecOperatorController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * GET /api/operator/lich-lam-viec/tong-hop
 * Lấy lịch làm việc tổng hợp
 */
router.get('/tong-hop', operatorAuth, LichLamViecOperatorController.lichTongHop);

/**
 * GET /api/operator/lich-lam-viec/heatmap
 * Phân tích độ phủ nhân sự (heatmap)
 */
router.get('/heatmap', operatorAuth, LichLamViecOperatorController.heatmap);

/**
 * GET /api/operator/lich-lam-viec/nvbh-kha-dung
 * Lấy danh sách NVBH khả dụng
 */
router.get('/nvbh-kha-dung', operatorAuth, LichLamViecOperatorController.layNVBHKhaDung);

module.exports = router;





