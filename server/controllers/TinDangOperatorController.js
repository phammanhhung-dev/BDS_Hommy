/**
 * Controller xử lý nghiệp vụ Duyệt Tin đăng cho Operator
 * UC-OPER-01: Duyệt tin đăng
 */

const TinDangOperatorModel = require('../models/TinDangOperatorModel');

class TinDangOperatorController {
  /**
   * GET /api/operator/tin-dang/cho-duyet
   * Lấy danh sách tin đăng chờ duyệt với phân trang và bộ lọc
   */
  static async danhSachChoDuyet(req, res) {
    try {
      const {
        keyword,
        khuVucId,
        duAnId,
        tuNgay,
        denNgay,
        page,
        limit
      } = req.query;

      const filters = {
        keyword,
        khuVucId: khuVucId ? parseInt(khuVucId) : null,
        duAnId: duAnId ? parseInt(duAnId) : null,
        tuNgay,
        denNgay,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await TinDangOperatorModel.layDanhSachTinDangChoDuyet(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách tin đăng chờ duyệt thành công',
        ...result
      });
    } catch (error) {
      console.error('[TinDangOperatorController] Lỗi danhSachChoDuyet:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách tin đăng',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/tin-dang/:id/chi-tiet
   * Xem chi tiết tin đăng cần duyệt (kèm checklist KYC)
   */
  static async xemChiTiet(req, res) {
    try {
      const tinDangId = parseInt(req.params.id);

      if (!tinDangId || isNaN(tinDangId)) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const tinDang = await TinDangOperatorModel.layChiTietTinDangChoDuyet(tinDangId);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết tin đăng thành công',
        data: tinDang
      });
    } catch (error) {
      console.error('[TinDangOperatorController] Lỗi xemChiTiet:', error);
      
      if (error.message === 'Tin đăng không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết tin đăng',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/tin-dang/:id/duyet
   * Duyệt tin đăng (ChoDuyet → DaDuyet)
   */
  static async duyetTin(req, res) {
    try {
      const tinDangId = parseInt(req.params.id);
      
      const operatorIdFromClient = req.body.operatorId;
      
      const nhanVienId = operatorIdFromClient 
        ? parseInt(operatorIdFromClient) 
        : (req.user ? req.user.NguoiDungID : null);

      if (!nhanVienId) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được người thực hiện duyệt tin (Thiếu operatorId)'
        });
      }

      if (!tinDangId || isNaN(tinDangId)) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const tinDang = await TinDangOperatorModel.duyetTinDang(tinDangId, nhanVienId);

      console.log('Danh sách tin đăng sau khi duyệt: ', tinDang);

      return res.status(200).json({
        success: true,
        message: 'Duyệt tin đăng thành công',
        data: tinDang
      });
    } catch (error) {
      console.error('[TinDangOperatorController] Lỗi duyetTin:', error);
      
      if (error.message === 'Tin đăng không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không thể duyệt') || error.message.includes('KYC')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi duyệt tin đăng',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/tin-dang/:id/tu-choi
   * Từ chối tin đăng với lý do
   */
  static async tuChoiTin(req, res) {
    try {
      const tinDangId = parseInt(req.params.id);
      const operatorIdFromClient = req.body.operatorId;
      
      const nhanVienId = operatorIdFromClient 
        ? parseInt(operatorIdFromClient) 
        : (req.user ? req.user.NguoiDungID : null);

      const LyDoTuChoi = req.body.lyDo;

      console.log('Từ chối tin đăng: ', tinDangId, nhanVienId, LyDoTuChoi);

      if (!tinDangId || isNaN(tinDangId)) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      if (!nhanVienId) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được người thực hiện duyệt tin (Thiếu operatorId)'
        });
      }

      if (!LyDoTuChoi || LyDoTuChoi.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Lý do từ chối phải có ít nhất 10 ký tự'
        });
      }

      const tinDang = await TinDangOperatorModel.tuChoiTinDang(tinDangId, nhanVienId, LyDoTuChoi);

      return res.status(200).json({
        success: true,
        message: 'Từ chối tin đăng thành công',
        data: tinDang
      });
    } catch (error) {
      console.error('[TinDangOperatorController] Lỗi tuChoiTin:', error);
      
      if (error.message === 'Tin đăng không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không thể từ chối') || error.message.includes('Lý do')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi từ chối tin đăng',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/tin-dang/thong-ke
   * Lấy thống kê tin đăng theo trạng thái
   */
  static async thongKe(req, res) {
    try {
      const thongKe = await TinDangOperatorModel.layThongKeTinDang();

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê tin đăng thành công',
        data: thongKe
      });
    } catch (error) {
      console.error('[TinDangOperatorController] Lỗi thongKe:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: error.message
      });
    }
  }
}

module.exports = TinDangOperatorController;






