/**
 * Routes cho Quản lý Phòng (Redesign 09/10/2025)
 */

const express = require('express');
const router = express.Router();
const PhongController = require('../controllers/PhongController');

// === PRODUCTION AUTH: JWT-based authentication ===
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const role = {
  requireRole: (roleName) => requireRole(roleName)
};

// ============================================================================
// ROUTES QUẢN LÝ PHÒNG (Phòng Master của Dự án)
// ============================================================================

/**
 * GET /api/chu-du-an/du-an/:duAnID/phong
 * Lấy danh sách phòng của dự án
 * Auth: ChuDuAn
 */
router.get(
  '/du-an/:duAnID/phong',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.layDanhSachPhong
);

/**
 * POST /api/chu-du-an/du-an/:duAnID/phong
 * Tạo phòng mới cho dự án
 * Auth: ChuDuAn
 * Body: { TenPhong, GiaChuan, DienTichChuan, MoTaPhong, HinhAnhPhong }
 */
router.post(
  '/du-an/:duAnID/phong',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.taoPhong
);

/**
 * GET /api/chu-du-an/phong/:phongID
 * Lấy chi tiết phòng
 * Auth: ChuDuAn
 */
router.get(
  '/phong/:phongID',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.layChiTietPhong
);

/**
 * PUT /api/chu-du-an/phong/:phongID
 * Cập nhật thông tin phòng
 * Auth: ChuDuAn
 * Body: { TenPhong?, GiaChuan?, DienTichChuan?, MoTaPhong?, HinhAnhPhong? }
 */
router.put(
  '/phong/:phongID',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.capNhatPhong
);

/**
 * DELETE /api/chu-du-an/phong/:phongID
 * Xóa phòng (chỉ khi chưa có tin đăng sử dụng)
 * Auth: ChuDuAn
 */
router.delete(
  '/phong/:phongID',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.xoaPhong
);

/**
 * PATCH /api/chu-du-an/phong/:phongID/trang-thai
 * Cập nhật trạng thái phòng
 * Auth: ChuDuAn
 * Body: { trangThai: 'Trong' | 'GiuCho' | 'DaThue' | 'DonDep' }
 */
router.patch(
  '/phong/:phongID/trang-thai',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.capNhatTrangThai
);

// ============================================================================
// ROUTES MAPPING PHÒNG - TIN ĐĂNG
// ============================================================================

/**
 * GET /api/chu-du-an/tin-dang/:tinDangID/phong
 * Lấy danh sách phòng của tin đăng (với override)
 * Auth: ChuDuAn
 */
router.get(
  '/tin-dang/:tinDangID/phong',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.layPhongCuaTinDang
);

/**
 * POST /api/chu-du-an/tin-dang/:tinDangID/phong
 * Thêm phòng vào tin đăng
 * Auth: ChuDuAn
 * Body: { danhSachPhong: [{ PhongID, GiaTinDang?, DienTichTinDang?, MoTaTinDang?, HinhAnhTinDang?, ThuTuHienThi? }] }
 */
router.post(
  '/tin-dang/:tinDangID/phong',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.themPhongVaoTinDang
);

/**
 * DELETE /api/chu-du-an/tin-dang/:tinDangID/phong/:phongID
 * Xóa phòng khỏi tin đăng
 * Auth: ChuDuAn
 */
router.delete(
  '/tin-dang/:tinDangID/phong/:phongID',
  auth,
  role.requireRole('ChuDuAn'),
  PhongController.xoaPhongKhoiTinDang
);

module.exports = router;

