/**
 * Controller xử lý Biên bản Bàn giao cho Operator
 * UC-OPER-06: Lập biên bản bàn giao
 */

const BienBanBanGiaoModel = require('../models/BienBanBanGiaoModel');

class BienBanBanGiaoController {
  /**
   * GET /api/operator/bien-ban
   * Lấy danh sách biên bản bàn giao với phân trang và bộ lọc
   */
  static async danhSach(req, res) {
    try {
      const {
        keyword,
        nhanVienId,
        trangThai,
        page,
        limit
      } = req.query;

      const filters = {
        keyword,
        nhanVienId: nhanVienId ? parseInt(nhanVienId) : null,
        trangThai,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await BienBanBanGiaoModel.layDanhSachBienBan(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách biên bản thành công',
        ...result
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi danhSach:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách biên bản',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/bien-ban/can-ban-giao
   * Lấy danh sách phòng cần bàn giao
   */
  static async danhSachCanBanGiao(req, res) {
    try {
      const {
        trangThai,
        duAnId,
        page,
        limit
      } = req.query;

      const filters = {
        trangThai,
        duAnId: duAnId ? parseInt(duAnId) : null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await BienBanBanGiaoModel.layDanhSachPhongCanBanGiao(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách phòng cần bàn giao thành công',
        ...result
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi danhSachCanBanGiao:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phòng',
        error: error.message
      });
    }
  }

  /**
   * POST /api/operator/bien-ban
   * Tạo biên bản bàn giao mới
   */
  static async taoBienBan(req, res) {
    try {
      const operatorId = req.user.NguoiDungID;
      const {
        PhongID,
        HopDongID,
        ChiSoDien,
        ChiSoNuoc,
        HienTrangJSON
      } = req.body;

      // Validation
      if (!PhongID || !HopDongID) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: PhongID, HopDongID'
        });
      }

      const data = {
        PhongID: parseInt(PhongID),
        HopDongID: parseInt(HopDongID),
        ChiSoDien: ChiSoDien ? parseFloat(ChiSoDien) : null,
        ChiSoNuoc: ChiSoNuoc ? parseFloat(ChiSoNuoc) : null,
        HienTrangJSON: HienTrangJSON || null
      };

      const bienBan = await BienBanBanGiaoModel.taoBienBan(data, operatorId);

      return res.status(201).json({
        success: true,
        message: 'Tạo biên bản bàn giao thành công',
        data: bienBan
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi taoBienBan:', error);
      
      if (error.message === 'Phòng không tồn tại' || error.message === 'Hợp đồng không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không thể') || 
          error.message.includes('đã có') ||
          error.message.includes('không thuộc')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo biên bản',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/bien-ban/:id
   * Cập nhật biên bản bàn giao
   */
  static async capNhat(req, res) {
    try {
      const bienBanId = parseInt(req.params.id);
      const operatorId = req.user.NguoiDungID;
      const {
        TrangThai,
        ChiSoDien,
        ChiSoNuoc,
        HienTrangJSON
      } = req.body;

      if (!bienBanId || isNaN(bienBanId)) {
        return res.status(400).json({
          success: false,
          message: 'ID biên bản không hợp lệ'
        });
      }

      const data = {
        TrangThai,
        ChiSoDien: ChiSoDien !== undefined ? parseFloat(ChiSoDien) : undefined,
        ChiSoNuoc: ChiSoNuoc !== undefined ? parseFloat(ChiSoNuoc) : undefined,
        HienTrangJSON: HienTrangJSON || undefined
      };

      const bienBan = await BienBanBanGiaoModel.capNhatBienBan(bienBanId, data, operatorId);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật biên bản thành công',
        data: bienBan
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi capNhat:', error);
      
      if (error.message === 'Biên bản không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Không thể chuyển') || 
          error.message.includes('Không có dữ liệu')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật biên bản',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/bien-ban/:id/ky
   * Ký biên bản (chuyển sang DaBanGiao, giải tỏa cọc)
   */
  static async ky(req, res) {
    try {
      const bienBanId = parseInt(req.params.id);
      const nguoiKyId = req.user.NguoiDungID;
      const { ChuKySo } = req.body;

      if (!bienBanId || isNaN(bienBanId)) {
        return res.status(400).json({
          success: false,
          message: 'ID biên bản không hợp lệ'
        });
      }

      if (!ChuKySo || ChuKySo.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Chữ ký số không hợp lệ (tối thiểu 4 ký tự)'
        });
      }

      const bienBan = await BienBanBanGiaoModel.kyBienBan(bienBanId, ChuKySo, nguoiKyId);

      return res.status(200).json({
        success: true,
        message: 'Ký biên bản thành công. Cọc an ninh đã được giải tỏa.',
        data: bienBan
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi ky:', error);
      
      if (error.message === 'Biên bản không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không hợp lệ') || 
          error.message.includes('chưa bắt đầu') ||
          error.message.includes('đã được ký')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi ký biên bản',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/bien-ban/:id
   * Lấy chi tiết biên bản bàn giao
   */
  static async chiTiet(req, res) {
    try {
      const bienBanId = parseInt(req.params.id);

      if (!bienBanId || isNaN(bienBanId)) {
        return res.status(400).json({
          success: false,
          message: 'ID biên bản không hợp lệ'
        });
      }

      const bienBan = await BienBanBanGiaoModel.layChiTietBienBan(bienBanId);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết biên bản thành công',
        data: bienBan
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi chiTiet:', error);
      
      if (error.message === 'Biên bản không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết biên bản',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/bien-ban/thong-ke
   * Lấy thống kê biên bản bàn giao
   */
  static async thongKe(req, res) {
    try {
      const thongKe = await BienBanBanGiaoModel.layThongKeBienBan();

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê biên bản thành công',
        data: thongKe
      });
    } catch (error) {
      console.error('[BienBanBanGiaoController] Lỗi thongKe:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: error.message
      });
    }
  }
}

module.exports = BienBanBanGiaoController;






