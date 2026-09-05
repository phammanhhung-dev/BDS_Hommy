/**
 * Routes cho Operator - Quản lý Nội dung Hệ thống
 * Chỉ dành cho QuanTriVienHeThong
 */

const express = require('express');
const router = express.Router();
const NoiDungHeThongController = require('../controllers/NoiDungHeThongController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Quản trị viên Hệ thống
const systemManagerOnly = [auth, requireRoles(['QuanTriVienHeThong'])];

/**
 * GET /api/operator/noi-dung-he-thong
 * Lấy danh sách nội dung hệ thống
 */
router.get('/', systemManagerOnly, NoiDungHeThongController.danhSach);

/**
 * GET /api/operator/noi-dung-he-thong/:id
 * Lấy nội dung theo ID
 */
router.get('/:id', systemManagerOnly, NoiDungHeThongController.layTheoID);

/**
 * POST /api/operator/noi-dung-he-thong
 * Tạo nội dung mới
 */
router.post('/', systemManagerOnly, NoiDungHeThongController.taoMoi);

/**
 * PUT /api/operator/noi-dung-he-thong/:id
 * Cập nhật nội dung
 */
router.put('/:id', systemManagerOnly, NoiDungHeThongController.capNhat);

/**
 * DELETE /api/operator/noi-dung-he-thong/:id
 * Xóa nội dung
 */
router.delete('/:id', systemManagerOnly, NoiDungHeThongController.xoa);

module.exports = router;

