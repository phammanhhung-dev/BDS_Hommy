/**
 * Routes cho Nhân viên Điều hành (NVDH)
 * Bao gồm:
 * - Báo cáo thu nhập từ NVBH dưới quyền
 * - Quản lý team sales
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');
const HoaHongService = require('../services/HoaHongService');

/**
 * @route GET /api/nhan-vien-dieu-hanh/bao-cao-thu-nhap
 * @desc Lấy báo cáo thu nhập NVDH từ các NVBH dưới quyền
 * @access Private - NhanVienDieuHanh
 * @query tuNgay - Ngày bắt đầu (YYYY-MM-DD)
 * @query denNgay - Ngày kết thúc (YYYY-MM-DD)
 */
router.get('/bao-cao-thu-nhap',
  authMiddleware,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  async (req, res) => {
    try {
      const quanLyId = req.user.NguoiDungID;
      const { tuNgay, denNgay } = req.query;

      // Validate parameters
      if (!tuNgay || !denNgay) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tuNgay và denNgay'
        });
      }

      const baoCao = await HoaHongService.baoCaoThuNhapNVDH(quanLyId, tuNgay, denNgay);

      return res.json({
        success: true,
        data: baoCao
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo thu nhập NVDH:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/nhan-vien-dieu-hanh/danh-sach-nvbh
 * @desc Lấy danh sách NVBH dưới quyền
 * @access Private - NhanVienDieuHanh
 */
router.get('/danh-sach-nvbh',
  authMiddleware,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  async (req, res) => {
    try {
      const quanLyId = req.user.NguoiDungID;
      const db = require('../config/db');

      const [nvbhRows] = await db.execute(`
        SELECT 
          hs.HoSoID,
          hs.NguoiDungID,
          hs.MaNhanVien,
          hs.TyLeHoaHong,
          hs.NgayBatDau,
          nd.TenDayDu,
          nd.Email,
          nd.DienThoai,
          nd.AnhDaiDien
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        WHERE hs.QuanLyID = ?
        ORDER BY hs.NgayBatDau DESC
      `, [quanLyId]);

      return res.json({
        success: true,
        data: nvbhRows
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách NVBH:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/nhan-vien-dieu-hanh/nvbh/:nhanVienId/thu-nhap
 * @desc Lấy chi tiết thu nhập của một NVBH cụ thể
 * @access Private - NhanVienDieuHanh
 * @params nhanVienId - ID nhân viên bán hàng
 * @query tuNgay - Ngày bắt đầu
 * @query denNgay - Ngày kết thúc
 */
router.get('/nvbh/:nhanVienId/thu-nhap',
  authMiddleware,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  async (req, res) => {
    try {
      const quanLyId = req.user.NguoiDungID;
      const { nhanVienId } = req.params;
      const { tuNgay, denNgay } = req.query;
      const db = require('../config/db');

      // Kiểm tra NVBH có thuộc quyền quản lý không
      const [checkRows] = await db.execute(
        'SELECT HoSoID FROM hosonhanvien WHERE NguoiDungID = ? AND QuanLyID = ?',
        [nhanVienId, quanLyId]
      );

      if (checkRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Nhân viên này không thuộc quyền quản lý của bạn'
        });
      }

      // Validate parameters
      if (!tuNgay || !denNgay) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tuNgay và denNgay'
        });
      }

      const baoCao = await HoaHongService.baoCaoThuNhapNVBH(nhanVienId, tuNgay, denNgay);

      return res.json({
        success: true,
        data: baoCao
      });
    } catch (error) {
      console.error('Lỗi lấy thu nhập NVBH:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/nhan-vien-dieu-hanh/hop-dong/:hopDongId/hoa-hong
 * @desc Xem chi tiết hoa hồng của một hợp đồng
 * @access Private - NhanVienDieuHanh
 */
router.get('/hop-dong/:hopDongId/hoa-hong',
  authMiddleware,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  async (req, res) => {
    try {
      const quanLyId = req.user.NguoiDungID;
      const { hopDongId } = req.params;

      // Tính thu nhập NVDH từ hợp đồng này
      const chiTiet = await HoaHongService.tinhThuNhapNVDH(quanLyId, hopDongId);

      return res.json({
        success: true,
        data: chiTiet
      });
    } catch (error) {
      console.error('Lỗi tính hoa hồng hợp đồng:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/nhan-vien-dieu-hanh/preview-hoa-hong
 * @desc Preview tính toán hoa hồng (không lưu DB)
 * @access Private - NhanVienDieuHanh
 * @query soTienCoc - Số tiền cọc
 * @query soThangCoc - Số tháng cọc
 * @query bangHoaHong - JSON array bảng hoa hồng (optional)
 */
router.get('/preview-hoa-hong',
  authMiddleware,
  requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong']),
  async (req, res) => {
    try {
      const { soTienCoc, soThangCoc, bangHoaHong } = req.query;

      if (!soTienCoc || !soThangCoc) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp soTienCoc và soThangCoc'
        });
      }

      // Parse bangHoaHong nếu có
      let bangHoaHongParsed = [
        { soThang: 6, tyLe: 30 },
        { soThang: 12, tyLe: 70 }
      ]; // Default
      
      if (bangHoaHong) {
        try {
          bangHoaHongParsed = JSON.parse(bangHoaHong);
        } catch (e) {
          // Giữ default
        }
      }

      const preview = HoaHongService.tinhPreviewHoaHong({
        soTienCoc: parseFloat(soTienCoc),
        bangHoaHong: bangHoaHongParsed,
        soThangCoc: parseInt(soThangCoc)
      });

      return res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('Lỗi preview hoa hồng:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
