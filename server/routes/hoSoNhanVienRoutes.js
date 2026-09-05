/**
 * Routes cho Operator - Quản lý Hồ sơ Nhân viên
 * UC-OPER-04 & UC-OPER-05
 */

const express = require('express');
const router = express.Router();
const HoSoNhanVienController = require('../controllers/HoSoNhanVienController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Operator và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * GET /api/operator/nhan-vien
 * Lấy danh sách nhân viên
 */
router.get('/', operatorAuth, HoSoNhanVienController.danhSach);

/**
 * GET /api/operator/nhan-vien/khu-vuc/mac-dinh
 * Lấy khu vực mặc định của Operator hiện tại
 * ⚠️ Dùng regex để match chính xác, tránh bị match với /:id
 */
router.get('/khu-vuc/mac-dinh', (req, res, next) => {
    console.log('[hoSoNhanVienRoutes] Route /khu-vuc/mac-dinh được match!');
    next();
}, operatorAuth, HoSoNhanVienController.layKhuVucMacDinh);

/**
 * GET /api/operator/nhan-vien/thong-ke
 * Lấy thống kê nhân viên
 */
router.get('/thong-ke', operatorAuth, HoSoNhanVienController.thongKe);

/**
 * GET /api/operator/nhan-vien/:id/khu-vuc
 * Lấy thông tin khu vực phụ trách của nhân viên
 * ⚠️ Dùng regex \d+ để chỉ match số, tránh match /khu-vuc/mac-dinh
 */
router.get(/^\/(\d+)\/khu-vuc$/, operatorAuth, HoSoNhanVienController.layKhuVucPhuTrach);

/**
 * GET /api/operator/nhan-vien/:id
 * Lấy chi tiết nhân viên
 * ⚠️ Dùng regex \d+ để chỉ match số
 */
router.get(/^\/(\d+)$/, operatorAuth, HoSoNhanVienController.chiTiet);

/**
 * POST /api/operator/nhan-vien
 * Tạo tài khoản nhân viên mới
 */
router.post('/', operatorAuth, HoSoNhanVienController.taoMoi);

/**
 * PUT /api/operator/nhan-vien/:id/trang-thai
 * Kích hoạt/vô hiệu hóa nhân viên
 * ⚠️ Dùng regex \d+ để chỉ match số
 */
router.put(/^\/(\d+)\/trang-thai$/, operatorAuth, HoSoNhanVienController.kichHoat);

/**
 * PUT /api/operator/nhan-vien/:id
 * Cập nhật hồ sơ nhân viên
 * ⚠️ Dùng regex \d+ để chỉ match số, PHẢI ĐẶT SAU /trang-thai
 */
router.put(/^\/(\d+)$/, operatorAuth, HoSoNhanVienController.capNhat);

module.exports = router;





