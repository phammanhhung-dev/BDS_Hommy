/**
 * Controller cho Dự án
 * Xử lý các nghiệp vụ liên quan đến quản lý dự án
 * Tách từ ChuDuAnController.js theo domain-driven design
 */

const DuAnModel = require('../models/DuAnModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

class DuAnController {
  /**
   * Lấy danh sách dự án
   * GET /api/chu-du-an/du-an
   */
  static async layDanhSachDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const danhSach = await DuAnModel.layDanhSachDuAn(chuDuAnId);

      res.json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        data: danhSach
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy chi tiết dự án
   * GET /api/chu-du-an/du-an/:id
   */
  static async layChiTietDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id);

      const duAn = await DuAnModel.layChiTietDuAn(duAnId, chuDuAnId);

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án'
        });
      }

      res.json({
        success: true,
        data: duAn
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách khu vực
   * GET /api/chu-du-an/khu-vuc
   */
  static async layDanhSachKhuVuc(req, res) {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId) : null;
      const danhSach = await DuAnModel.layDanhSachKhuVuc(parentId);

      res.json({
        success: true,
        data: danhSach
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách khu vực:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tạo dự án mới
   * POST /api/chu-du-an/du-an
   */
  static async taoDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const data = req.body;

      const duAnId = await DuAnModel.taoDuAn(chuDuAnId, data);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'tao_du_an',
        'DuAn',
        duAnId,
        null,
        { tenDuAn: data.TenDuAn, diaChi: data.DiaChi },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Tạo dự án thành công',
        data: { duAnId }
      });
    } catch (error) {
      console.error('Lỗi tạo dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cập nhật dự án
   * PUT /api/chu-du-an/du-an/:id
   */
  static async capNhatDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id);
      const data = req.body;

      const duAn = await DuAnModel.capNhatDuAn(duAnId, chuDuAnId, data);

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'cap_nhat_du_an',
        'DuAn',
        duAnId,
        null,
        data,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Cập nhật dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('Lỗi cập nhật dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lưu trữ dự án (soft delete)
   * DELETE /api/chu-du-an/du-an/:id
   */
  static async luuTruDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id);

      const duAn = await DuAnModel.luuTruDuAn(duAnId, chuDuAnId);

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'luu_tru_du_an',
        'DuAn',
        duAnId,
        { trangThai: 'HoatDong' },
        { trangThai: 'LuuTru' },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lưu trữ dự án thành công'
      });
    } catch (error) {
      console.error('Lỗi lưu trữ dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tạo dự án nhanh
   * POST /api/chu-du-an/du-an/nhanh
   */
  static async taoNhanhDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const data = { ...req.body, ChuDuAnID: chuDuAnId };

      const duAnId = await DuAnModel.taoDuAnNhanh(data);

      res.status(201).json({
        success: true,
        message: 'Tạo dự án nhanh thành công',
        data: { duAnId }
      });
    } catch (error) {
      console.error('Lỗi tạo dự án nhanh:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Gửi yêu cầu mở lại dự án
   * POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai
   */
  static async guiYeuCauMoLaiDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id);
      const { noiDungGiaiTrinh } = req.body;

      if (!noiDungGiaiTrinh) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung giải trình là bắt buộc'
        });
      }

      // Note: This logic should be in a separate method in DuAnModel
      // For now, use capNhatDuAn
      const data = {
        YeuCauMoLai: 'ChoXuLy',
        NoiDungGiaiTrinh: noiDungGiaiTrinh
      };

      const duAn = await DuAnModel.capNhatDuAn(duAnId, chuDuAnId, data);

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'yeu_cau_mo_lai_du_an',
        'DuAn',
        duAnId,
        null,
        { noiDungGiaiTrinh },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Gửi yêu cầu mở lại dự án thành công'
      });
    } catch (error) {
      console.error('Lỗi gửi yêu cầu mở lại dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = DuAnController;



















