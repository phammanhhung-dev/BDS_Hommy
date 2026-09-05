/**
 * @fileoverview Controller quản lý Hợp đồng
 * @module HopDongController
 */

const HopDongModel = require('../models/HopDongModel');
const NhatKyService = require('../services/NhatKyHeThongService');
const path = require('path');
const fs = require('fs').promises;

class HopDongController {
  /**
   * POST /api/chu-du-an/hop-dong/bao-cao
   * Báo cáo hợp đồng đã ký
   */
  static async baoCao(req, res) {
    try {
      const chuDuAnId = req.user.id || req.user.NguoiDungID;
      const {
        TinDangID,
        KhachHangID,
        PhongID,
        NgayBatDau,
        NgayKetThuc,
        GiaThueCuoiCung,
        DoiTruCocVaoTienThue, // boolean
        NoiDungSnapshot
      } = req.body;

      // Validation
      if (!TinDangID || !KhachHangID || !PhongID || !NgayBatDau || !NgayKetThuc || !GiaThueCuoiCung) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
      }

      // Kiểm tra NgayKetThuc > NgayBatDau
      if (new Date(NgayKetThuc) <= new Date(NgayBatDau)) {
        return res.status(400).json({
          success: false,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        });
      }

      const hopDongId = await HopDongModel.baoCaoHopDong({
        TinDangID,
        KhachHangID,
        PhongID,
        NgayBatDau,
        NgayKetThuc,
        GiaThueCuoiCung,
        DoiTruCocVaoTienThue,
        NoiDungSnapshot
      }, chuDuAnId);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: chuDuAnId,
        HanhDong: 'bao_cao_hop_dong_thue',
        DoiTuong: 'hopdong',
        DoiTuongID: hopDongId,
        ChiTiet: JSON.stringify({
          PhongID,
          TinDangID,
          KhachHangID,
          GiaThueCuoiCung,
          DoiTruCoc: DoiTruCocVaoTienThue || false
        })
      });

      res.status(201).json({
        success: true,
        message: 'Báo cáo hợp đồng thành công',
        data: { HopDongID: hopDongId }
      });

    } catch (error) {
      console.error('[HopDongController.baoCao]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi báo cáo hợp đồng'
      });
    }
  }

  /**
   * GET /api/chu-du-an/hop-dong
   * Lấy danh sách hợp đồng
   */
  static async layDanhSach(req, res) {
    try {
      // Lấy ID từ req.user.id hoặc req.user.NguoiDungID (tùy cấu trúc token)
      const chuDuAnId = req.user.id || req.user.NguoiDungID;
      const { tuNgay, denNgay } = req.query;

      const danhSach = await HopDongModel.layDanhSach(chuDuAnId, {
        tuNgay,
        denNgay
      });

      res.json({
        success: true,
        data: danhSach
      });

    } catch (error) {
      console.error('[HopDongController.layDanhSach]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách hợp đồng'
      });
    }
  }

  /**
   * GET /api/admin/hop-dong
   * Lấy tất cả hợp đồng (cho Admin/Operator)
   */
  static async layTatCa(req, res) {
    try {
      const { tuNgay, denNgay, chuDuAnId } = req.query;

      const danhSach = await HopDongModel.layTatCaHopDong({
        tuNgay,
        denNgay,
        chuDuAnId: chuDuAnId ? Number(chuDuAnId) : null
      });

      res.json({
        success: true,
        data: danhSach
      });

    } catch (error) {
      console.error('[HopDongController.layTatCa]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách hợp đồng'
      });
    }
  }

  /**
   * GET /api/chu-du-an/hop-dong/:id
   * Lấy chi tiết hợp đồng
   */
  static async layChiTiet(req, res) {
    try {
      const chuDuAnId = req.user.id || req.user.NguoiDungID;
      const { id } = req.params;

      const hopDong = await HopDongModel.layChiTiet(id, chuDuAnId);

      if (!hopDong) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hợp đồng'
        });
      }

      res.json({
        success: true,
        data: hopDong
      });

    } catch (error) {
      console.error('[HopDongController.layChiTiet]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết hợp đồng'
      });
    }
  }

  /**
   * POST /api/chu-du-an/hop-dong/:id/upload
   * Upload file scan hợp đồng (PDF/Image)
   */
  static async uploadFileScan(req, res) {
    try {
      const chuDuAnId = req.user.id || req.user.NguoiDungID;
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file nào được upload'
        });
      }

      // Tạo đường dẫn lưu file: /uploads/hop-dong/{HopDongID}/
      const uploadDir = path.join('public', 'uploads', 'hop-dong', id);
      
      // Tạo thư mục nếu chưa tồn tại
      await fs.mkdir(uploadDir, { recursive: true });

      // Di chuyển file từ temp folder vào thư mục đích
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const destPath = path.join(uploadDir, fileName);
      const relativePath = `/uploads/hop-dong/${id}/${fileName}`;

      await fs.rename(req.file.path, destPath);

      // Cập nhật database
      await HopDongModel.capNhatFileScan(id, relativePath, chuDuAnId);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: chuDuAnId,
        HanhDong: 'upload_file_scan_hop_dong',
        DoiTuong: 'hopdong',
        DoiTuongID: id,
        ChiTiet: JSON.stringify({
          fileName: req.file.originalname,
          fileSize: req.file.size,
          filePath: relativePath
        })
      });

      res.json({
        success: true,
        message: 'Upload file scan hợp đồng thành công',
        data: {
          filePath: relativePath,
          fileName: req.file.originalname
        }
      });

    } catch (error) {
      console.error('[HopDongController.uploadFileScan]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi upload file scan'
      });
    }
  }

  /**
   * POST /api/admin/hop-dong/:id/xac-nhan-huy
   * Admin xác nhận hủy hợp đồng và hoàn tiền cọc
   */
  static async xacNhanHuy(req, res) {
    try {
      const hopDongID = parseInt(req.params.id, 10);
      const adminID = req.user?.NguoiDungID || req.user?.id || req.user?.userId;

      if (!adminID) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được người dùng'
        });
      }

      if (!hopDongID || isNaN(hopDongID)) {
        return res.status(400).json({
          success: false,
          message: 'ID hợp đồng không hợp lệ'
        });
      }

      await HopDongModel.xacNhanHuyHopDong(hopDongID, adminID);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: adminID,
        HanhDong: 'xac_nhan_huy_hop_dong',
        DoiTuong: 'HopDong',
        DoiTuongID: hopDongID,
        ChiTiet: JSON.stringify({ hopDongID })
      });

      return res.json({
        success: true,
        message: 'Đã xác nhận hủy hợp đồng và hoàn tiền cọc thành công'
      });
    } catch (error) {
      console.error('[HopDongController] Lỗi xacNhanHuy:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xác nhận hủy hợp đồng'
      });
    }
  }
}

module.exports = HopDongController;
