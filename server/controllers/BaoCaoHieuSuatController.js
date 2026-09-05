/**
 * Controller cho Báo cáo Hiệu suất
 * Xử lý các nghiệp vụ liên quan đến báo cáo và thống kê
 * Tách từ ChuDuAnController.js theo domain-driven design
 */

const BaoCaoHieuSuatModel = require('../models/BaoCaoHieuSuatModel');

class BaoCaoHieuSuatController {
  /**
   * UC-PROJ-03: Lấy báo cáo hiệu suất tổng quan
   * GET /api/chu-du-an/bao-cao
   */
  static async layBaoCaoHieuSuat(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const baoCao = await BaoCaoHieuSuatModel.layBaoCaoHieuSuat(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy báo cáo hiệu suất thành công',
        data: baoCao
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo hiệu suất:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy doanh thu theo tháng
   * GET /api/chu-du-an/bao-cao/doanh-thu
   */
  static async layDoanhThuTheoThang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const data = await BaoCaoHieuSuatModel.layDoanhThuTheoThang(chuDuAnId);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Lỗi lấy doanh thu theo tháng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy top tin đăng hiệu quả nhất
   * GET /api/chu-du-an/bao-cao/top-tin-dang
   */
  static async layTopTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const data = await BaoCaoHieuSuatModel.layTopTinDang(chuDuAnId, filters);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Lỗi lấy top tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy conversion rate
   * GET /api/chu-du-an/bao-cao/conversion
   */
  static async layConversionRate(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const data = await BaoCaoHieuSuatModel.layConversionRate(chuDuAnId, filters);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Lỗi lấy conversion rate:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-03: Lấy báo cáo hiệu suất chi tiết (Enhanced)
   * GET /api/chu-du-an/bao-cao/chi-tiet
   */
  static async layBaoCaoHieuSuatChiTiet(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const baoCao = await BaoCaoHieuSuatModel.layBaoCaoHieuSuatChiTiet(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy báo cáo chi tiết thành công',
        data: baoCao
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo chi tiết:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = BaoCaoHieuSuatController;

























