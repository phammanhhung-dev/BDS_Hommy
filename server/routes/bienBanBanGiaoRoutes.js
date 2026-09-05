/**
 * Routes cho Operator - Biên bản Bàn giao
 * UC-OPER-06
 */

const express = require('express');
const router = express.Router();
const BienBanBanGiaoController = require('../controllers/BienBanBanGiaoController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Operator và Admin
const operatorAuth = [auth, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * GET /api/operator/bien-ban
 * Lấy danh sách biên bản bàn giao
 */
router.get('/', operatorAuth, BienBanBanGiaoController.danhSach);

/**
 * GET /api/operator/bien-ban/can-ban-giao
 * Lấy danh sách phòng cần bàn giao
 */
router.get('/can-ban-giao', operatorAuth, BienBanBanGiaoController.danhSachCanBanGiao);

/**
 * GET /api/operator/bien-ban/thong-ke
 * Lấy thống kê biên bản
 */
router.get('/thong-ke', operatorAuth, BienBanBanGiaoController.thongKe);

/**
 * GET /api/operator/bien-ban/:id
 * Lấy chi tiết biên bản
 */
router.get('/:id', operatorAuth, BienBanBanGiaoController.chiTiet);

/**
 * POST /api/operator/bien-ban
 * Tạo biên bản bàn giao mới
 */
router.post('/', operatorAuth, BienBanBanGiaoController.taoBienBan);

/**
 * PUT /api/operator/bien-ban/:id
 * Cập nhật biên bản
 */
router.put('/:id', operatorAuth, BienBanBanGiaoController.capNhat);

/**
 * PUT /api/operator/bien-ban/:id/ky
 * Ký biên bản (chuyển DaBanGiao, giải tỏa cọc)
 */
router.put('/:id/ky', operatorAuth, BienBanBanGiaoController.ky);

module.exports = router;





