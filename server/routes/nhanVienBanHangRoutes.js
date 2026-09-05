/**
 * Routes cho Nhân viên Bán hàng
 * 19 endpoints cho 7 use cases
 */

const express = require('express');
const router = express.Router();
const NhanVienBanHangController = require('../controllers/NhanVienBanHangController');
const ThongBaoController = require('../controllers/ThongBaoController');
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Tất cả routes yêu cầu authentication và vai trò NhanVienBanHang
router.use(auth);
router.use(requireRoles(['NhanVienBanHang']));

// ==================== LỊCH LÀM VIỆC (UC-SALE-01) ====================
router.get('/lich-lam-viec', NhanVienBanHangController.layLichLamViec);
router.post('/lich-lam-viec', NhanVienBanHangController.taoLichLamViec);
router.put('/lich-lam-viec/:id', NhanVienBanHangController.capNhatLichLamViec);
router.delete('/lich-lam-viec/:id', NhanVienBanHangController.xoaLichLamViec);

// ==================== CUỘC HẸN (UC-SALE-02, UC-SALE-03, UC-SALE-05) ====================
router.get('/cuoc-hen', NhanVienBanHangController.layDanhSachCuocHen);
router.get('/cuoc-hen/:id', NhanVienBanHangController.xemChiTietCuocHen);
router.put('/cuoc-hen/:id/xac-nhan', NhanVienBanHangController.xacNhanCuocHen);
router.put('/cuoc-hen/:id/doi-lich', NhanVienBanHangController.doiLichCuocHen);
router.put('/cuoc-hen/:id/huy', NhanVienBanHangController.huyCuocHen);
router.post('/cuoc-hen/:id/bao-cao-ket-qua', NhanVienBanHangController.baoCaoKetQuaCuocHen);

// ==================== GIAO DỊCH/CỌC (UC-SALE-04) ====================
router.get('/giao-dich', NhanVienBanHangController.layDanhSachGiaoDich);
router.get('/giao-dich/:id', NhanVienBanHangController.xemChiTietGiaoDich);
router.post('/giao-dich/:id/xac-nhan-coc', NhanVienBanHangController.xacNhanCoc);

// ==================== BÁO CÁO THU NHẬP (UC-SALE-06) ====================
router.get('/bao-cao/thu-nhap', NhanVienBanHangController.layBaoCaoThuNhap);
router.get('/bao-cao/thong-ke', NhanVienBanHangController.layThongKeHieuSuat);
router.get('/bao-cao/cuoc-hen-theo-tuan', NhanVienBanHangController.layCuocHenTheoTuan);

// ==================== DASHBOARD ====================
router.get('/dashboard', NhanVienBanHangController.layDashboard);
router.get('/ho-so', NhanVienBanHangController.layHoSo);
router.put('/ho-so', NhanVienBanHangController.capNhatHoSo);

// ==================== THÔNG BÁO ====================
router.get('/thong-bao', ThongBaoController.layDanhSach);
router.get('/thong-bao/dem-chua-doc', ThongBaoController.demChuaDoc);
router.put('/thong-bao/:id/doc', ThongBaoController.danhDauDaDoc);
router.put('/thong-bao/doc-tat-ca', ThongBaoController.danhDauDocTatCa);

module.exports = router;


