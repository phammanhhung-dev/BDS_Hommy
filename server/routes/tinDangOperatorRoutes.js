/**
 * Routes cho Operator - Duyệt Tin đăng
 * UC-OPER-01
 */

const express = require('express');
const router = express.Router();
const TinDangOperatorController = require('../controllers/TinDangOperatorController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * GET /api/operator/tin-dang/cho-duyet
 * Lấy danh sách tin đăng chờ duyệt
 */
router.get('/cho-duyet', operatorAuth, TinDangOperatorController.danhSachChoDuyet);

/**
 * GET /api/operator/tin-dang/thong-ke
 * Lấy thống kê tin đăng theo trạng thái
 */
router.get('/thong-ke', operatorAuth, TinDangOperatorController.thongKe);

/**
 * GET /api/operator/tin-dang/:id/chi-tiet
 * Xem chi tiết tin đăng cần duyệt
 */
router.get('/:id/chi-tiet', operatorAuth, TinDangOperatorController.xemChiTiet);

/**
 * PUT /api/operator/tin-dang/:id/duyet
 * Duyệt tin đăng
 */
router.put('/:id/duyet', operatorAuth, TinDangOperatorController.duyetTin);

/**
 * PUT /api/operator/tin-dang/:id/tu-choi
 * Từ chối tin đăng
 */
router.put('/:id/tu-choi', operatorAuth, TinDangOperatorController.tuChoiTin);

module.exports = router;





