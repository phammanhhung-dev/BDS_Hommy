/**
 * Routes cho Gợi ý Tin đăng (Authenticated - NVBH)
 * Hỗ trợ NVBH tìm kiếm và gợi ý phòng khác cho khách
 */

const express = require('express');
const router = express.Router();
const GoiYTinDangController = require('../controllers/GoiYTinDangController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Tất cả routes yêu cầu authentication và vai trò NhanVienBanHang
router.use(auth);
router.use(requireRoles(['NhanVienBanHang']));

/**
 * POST /api/nhan-vien-ban-hang/goi-y/tim-kiem
 * Tìm kiếm tin đăng gợi ý theo bộ lọc
 * Body: { cuocHenId, khuVucId, giaMin, giaMax, dienTichMin, dienTichMax, tienIch, limit }
 */
router.post('/tim-kiem', GoiYTinDangController.timKiemGoiY);

/**
 * GET /api/nhan-vien-ban-hang/goi-y/tin-dang/:tinDangId
 * Lấy chi tiết tin đăng gợi ý (bao gồm danh sách phòng trống)
 */
router.get('/tin-dang/:tinDangId', GoiYTinDangController.layChiTietTinDang);

/**
 * POST /api/nhan-vien-ban-hang/goi-y/tao-qr
 * Tạo QR "Xem Ngay" cho khách
 * Body: { cuocHenId, tinDangId, phongId }
 */
router.post('/tao-qr', GoiYTinDangController.taoQRXemNgay);

/**
 * POST /api/nhan-vien-ban-hang/goi-y/tao-qr-dat-coc
 * Tạo QR đặt cọc cho khách hàng quét
 * Body: { cuocHenId, tinDangId, phongId, soThangKy, soTienCoc }
 */
router.post('/tao-qr-dat-coc', GoiYTinDangController.taoQRDatCoc);

/**
 * GET /api/nhan-vien-ban-hang/goi-y/trang-thai/:maQR
 * Kiểm tra trạng thái QR (polling fallback)
 */
router.get('/trang-thai/:maQR', GoiYTinDangController.kiemTraTrangThaiQR);

/**
 * GET /api/nhan-vien-ban-hang/goi-y/khu-vuc
 * Lấy danh sách khu vực con dựa trên KhuVucPhuTrachID của NVBH
 */
router.get('/khu-vuc', GoiYTinDangController.layDanhSachKhuVuc);

module.exports = router;

