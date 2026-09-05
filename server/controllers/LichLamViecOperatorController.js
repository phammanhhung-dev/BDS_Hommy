/**
 * Controller xử lý Quản lý Lịch làm việc NVBH cho Operator
 * UC-OPER-03: Quản lý lịch làm việc tổng thể
 */

const LichLamViecOperatorModel = require('../models/LichLamViecOperatorModel');

class LichLamViecOperatorController {
  /**
   * GET /api/operator/cuoc-hen
   * Lấy danh sách cuộc hẹn với phân trang + bộ lọc cho Operator (list view)
   */
  static async danhSachCuocHen(req, res) {
    try {
      const {
        trangThai,
        tuNgay,
        denNgay,
        nhanVienId,
        page,
        limit
      } = req.query;

      const filters = {
        trangThai,
        tuNgay,
        denNgay,
        nhanVienId: nhanVienId ? parseInt(nhanVienId) : null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await LichLamViecOperatorModel.layDanhSachCuocHen(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách cuộc hẹn thành công',
        ...result
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi danhSachCuocHen:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách cuộc hẹn',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/lich-lam-viec/tong-hop
   * Lấy lịch làm việc tổng hợp của tất cả NVBH
   */
  static async lichTongHop(req, res) {
    try {
      const {
        startDate,
        endDate,
        khuVucId,
        nhanVienId
      } = req.query;

      const filters = {
        startDate,
        endDate,
        khuVucId: khuVucId ? parseInt(khuVucId) : null,
        nhanVienId: nhanVienId ? parseInt(nhanVienId) : null
      };

      const lich = await LichLamViecOperatorModel.layLichTongHop(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy lịch tổng hợp thành công',
        data: lich
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi lichTongHop:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch tổng hợp',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/lich-lam-viec/heatmap
   * Phân tích độ phủ nhân sự (heatmap data)
   */
  static async heatmap(req, res) {
    try {
      const { startDate, endDate, khuVucId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp startDate và endDate'
        });
      }

      const heatmapData = await LichLamViecOperatorModel.phanTichDoPhus(
        startDate,
        endDate,
        khuVucId ? parseInt(khuVucId) : null
      );

      return res.status(200).json({
        success: true,
        message: 'Lấy dữ liệu heatmap thành công',
        data: heatmapData
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi heatmap:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi phân tích độ phủ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/cuoc-hen/can-gan
   * Lấy danh sách cuộc hẹn cần gán NVBH
   */
  static async danhSachCanGan(req, res) {
    try {
      const cuocHen = await LichLamViecOperatorModel.layDanhSachCuocHenCanGan();

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách cuộc hẹn cần gán thành công',
        data: cuocHen
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi danhSachCanGan:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách cuộc hẹn',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/cuoc-hen/:id/gan-lai
   * Gán lại cuộc hẹn cho NVBH khác
   */
  static async ganLaiCuocHen(req, res) {
    try {
      const cuocHenId = parseInt(req.params.id);
      const { NhanVienBanHangIdMoi } = req.body;
      const nhanVienDieuHanhId = req.user.NguoiDungID;

      if (!cuocHenId || isNaN(cuocHenId)) {
        return res.status(400).json({
          success: false,
          message: 'ID cuộc hẹn không hợp lệ'
        });
      }

      if (!NhanVienBanHangIdMoi) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp ID nhân viên bán hàng mới'
        });
      }

      const cuocHen = await LichLamViecOperatorModel.ganLaiCuocHen(
        cuocHenId,
        NhanVienBanHangIdMoi,
        nhanVienDieuHanhId
      );

      return res.status(200).json({
        success: true,
        message: 'Gán lại cuộc hẹn thành công',
        data: cuocHen
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi ganLaiCuocHen:', error);
      
      if (error.message === 'Cuộc hẹn không tồn tại' || error.message === 'Nhân viên bán hàng không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không hoạt động') || 
          error.message.includes('không có lịch') ||
          error.message.includes('xung đột') ||
          error.message.includes('đã có cuộc hẹn')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi gán lại cuộc hẹn',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/lich-lam-viec/nvbh-kha-dung
   * Lấy danh sách NVBH khả dụng cho thời điểm cụ thể
   */
  static async layNVBHKhaDung(req, res) {
    try {
      const { thoiGianHen, khuVucId } = req.query;

      if (!thoiGianHen) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp thoiGianHen'
        });
      }

      const nvbhList = await LichLamViecOperatorModel.layDanhSachNVBHKhaDung(
        thoiGianHen,
        khuVucId ? parseInt(khuVucId) : null
      );

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách NVBH khả dụng thành công',
        data: nvbhList
      });
    } catch (error) {
      console.error('[LichLamViecOperatorController] Lỗi layNVBHKhaDung:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách NVBH',
        error: error.message
      });
    }
  }
}

module.exports = LichLamViecOperatorController;






