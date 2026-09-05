/**
 * Routes cho Operator/Admin
 * Quản lý banned dự án, duyệt yêu cầu mở lại
 */

const express = require('express');
const router = express.Router();
const OperatorController = require('../controllers/OperatorController');

// === PRODUCTION AUTH: JWT-based authentication ===
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

/**
 * UC-OPR-01: Banned dự án (ngưng hoạt động do vi phạm)
 * PUT /api/operator/du-an/:id/banned
 * 
 * Middleware:
 * - auth: Xác thực JWT
 * - requireRole(['NhanVienDieuHanh', 'QuanTriVienHeThong']): Chỉ Nhân viên Điều hành/Admin được thực hiện
 * 
 * Body:
 * - LyDoNgungHoatDong (string, required, min 10 chars): Lý do vi phạm
 * 
 * Response:
 * - 200: Success với thông tin dự án đã banned
 * - 400: Validation errors
 * - 401: Chưa đăng nhập
 * - 403: Không có quyền (không phải Nhân viên Điều hành/Admin)
 * - 404: Dự án không tồn tại
 * - 409: Dự án đã bị banned trước đó
 */
router.put(
  '/du-an/:id/banned',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.bannedDuAn
);

/**
 * UC-OPR-02: Xử lý yêu cầu mở lại dự án (duyệt/từ chối)
 * PUT /api/operator/du-an/:id/xu-ly-yeu-cau
 * 
 * Middleware:
 * - auth: Xác thực JWT
 * - requireRole(['NhanVienDieuHanh', 'QuanTriVienHeThong']): Chỉ Nhân viên Điều hành/Admin được thực hiện
 * 
 * Body:
 * - KetQua (string, required): 'ChapNhan' hoặc 'TuChoi'
 * - LyDoTuChoiMoLai (string, required nếu KetQua = 'TuChoi', min 10 chars): Lý do từ chối
 * 
 * Response:
 * - 200: Success
 * - 400: Validation errors
 * - 401: Chưa đăng nhập
 * - 403: Không có quyền
 * - 404: Dự án không tồn tại hoặc không có yêu cầu
 * - 409: Yêu cầu đã được xử lý
 */
router.put(
  '/du-an/:id/xu-ly-yeu-cau',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.xuLyYeuCauMoLai
);

/**
 * UC-OPR-03: Lấy danh sách cuộc hẹn (cho calendar view)
 * GET /api/operator/cuoc-hen
 */
router.get(
  '/cuoc-hen',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layDanhSachCuocHen
);

/**
 * UC-OPR-03: Lấy cuộc hẹn cần gán NVBH
 * GET /api/operator/cuoc-hen/can-gan
 */
router.get(
  '/cuoc-hen/can-gan',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layCuocHenCanGan
);

/**
 * UC-OPR-03: Gán lại cuộc hẹn cho NVBH khác
 * PUT /api/operator/cuoc-hen/:id/gan-lai
 */
router.put(
  '/cuoc-hen/:id/gan-lai',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.ganLaiCuocHen
);

/**
 * UC-OPR-03: Lấy danh sách cuộc hẹn (cho calendar view)
 * GET /api/operator/cuoc-hen
 */
router.get(
  '/cuoc-hen',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layDanhSachCuocHen
);

/**
 * UC-OPR-03: Lấy thống kê cuộc hẹn
 * GET /api/operator/cuoc-hen/thong-ke
 */
router.get(
  '/cuoc-hen/thong-ke',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layThongKeCuocHen
);

/**
 * UC-OPR-03: Lấy cuộc hẹn cần gán NVBH
 * GET /api/operator/cuoc-hen/can-gan
 */
router.get(
  '/cuoc-hen/can-gan',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layCuocHenCanGan
);

/**
 * UC-OPR-03: Gán lại cuộc hẹn cho NVBH khác
 * PUT /api/operator/cuoc-hen/:id/gan-lai
 */
router.put(
  '/cuoc-hen/:id/gan-lai',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.ganLaiCuocHen
);

/**
 * UC-OPR-03: Lấy lịch làm việc NVBH (shifts + appointments)
 * GET /api/operator/lich-lam-viec
 */
router.get(
  '/lich-lam-viec',
  auth,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  OperatorController.layLichLamViec
);

module.exports = router;
