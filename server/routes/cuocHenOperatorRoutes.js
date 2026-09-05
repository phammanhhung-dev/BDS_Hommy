/**
 * Routes cho Operator - Quản lý Cuộc hẹn (UC-OPER-03)
 * Tách riêng vì liên quan đến entity CuocHen
 */

const express = require('express');
const router = express.Router();
const LichLamViecOperatorController = require('../controllers/LichLamViecOperatorController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * GET /api/operator/cuoc-hen
 * Lấy danh sách cuộc hẹn cho Operator (list view)
 */
router.get('/', operatorAuth, LichLamViecOperatorController.danhSachCuocHen);

/**
 * GET /api/operator/cuoc-hen/can-gan
 * Lấy danh sách cuộc hẹn cần gán NVBH
 */
router.get('/can-gan', operatorAuth, LichLamViecOperatorController.danhSachCanGan);

/**
 * PUT /api/operator/cuoc-hen/:id/gan-lai
 * Gán lại cuộc hẹn cho NVBH khác
 */
router.put('/:id/gan-lai', operatorAuth, LichLamViecOperatorController.ganLaiCuocHen);

module.exports = router;





