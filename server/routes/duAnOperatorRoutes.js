/**
 * Routes cho Operator - Quản lý Dự án
 * UC-OPER-02
 * Bổ sung thêm các routes mới (đã có sẵn banned và xu-ly-yeu-cau trong operatorRoutes.js)
 */

const express = require('express');
const router = express.Router();
const DuAnOperatorController = require('../controllers/DuAnOperatorController');
const OperatorController = require('../controllers/OperatorController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];
const systemManagerOnly = [auth, requireRoles(['QuanTriVienHeThong'])];

/**
 * GET /api/operator/du-an
 * Lấy danh sách dự án
 */
router.get('/', operatorAuth, DuAnOperatorController.danhSachDuAn);

/**
 * POST /api/operator/du-an
 * Quản trị viên hệ thống tạo dự án mới
 */
router.post('/', systemManagerOnly, DuAnOperatorController.taoMoi);

/**
 * GET /api/operator/du-an/thong-ke
 * Lấy thống kê dự án
 */
router.get('/thong-ke', operatorAuth, DuAnOperatorController.thongKe);

/**
 * GET /api/operator/du-an/:id
 * Lấy chi tiết dự án
 */
router.get('/:id', operatorAuth, DuAnOperatorController.chiTiet);

/**
 * PUT /api/operator/du-an/:id
 * Quản trị viên hệ thống cập nhật dự án
 */
router.put('/:id', systemManagerOnly, DuAnOperatorController.capNhat);

/**
 * PUT /api/operator/du-an/:id/tam-ngung
 * Tạm ngưng dự án
 */
router.put('/:id/tam-ngung', operatorAuth, DuAnOperatorController.tamNgung);

/**
 * PUT /api/operator/du-an/:id/kich-hoat
 * Kích hoạt lại dự án
 */
router.put('/:id/kich-hoat', operatorAuth, DuAnOperatorController.kichHoat);

/**
 * PUT /api/operator/du-an/:id/banned
 * Banned dự án (đã có sẵn trong OperatorController)
 */
router.put('/:id/banned', operatorAuth, OperatorController.bannedDuAn);

/**
 * PUT /api/operator/du-an/:id/xu-ly-yeu-cau
 * Xử lý yêu cầu mở lại dự án (đã có sẵn trong OperatorController)
 */
router.put('/:id/xu-ly-yeu-cau', operatorAuth, OperatorController.xuLyYeuCauMoLai);

/**
 * POST /api/operator/du-an/:id/duyet-hoa-hong
 * Duyệt hoa hồng dự án
 */
router.post('/:id/duyet-hoa-hong', operatorAuth, DuAnOperatorController.duyetHoaHong);

/**
 * POST /api/operator/du-an/:id/tu-choi-hoa-hong
 * Từ chối hoa hồng dự án
 */
router.post('/:id/tu-choi-hoa-hong', operatorAuth, DuAnOperatorController.tuChoiHoaHong);

module.exports = router;





