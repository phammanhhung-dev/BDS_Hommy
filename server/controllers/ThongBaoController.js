/**
 * Controller cho Thông báo
 * Xử lý HTTP requests cho thông báo của Nhân viên Bán hàng
 */

const ThongBaoModel = require('../models/ThongBaoModel');

class ThongBaoController {
  /**
   * GET /api/nhan-vien-ban-hang/thong-bao
   * Lấy danh sách thông báo với pagination
   */
  static async layDanhSach(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const filters = {
        trangThai: req.query.trangThai,
        loai: req.query.loai,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ThongBaoModel.layDanhSach(nguoiDungId, filters);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi lấy danh sách thông báo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách thông báo'
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/thong-bao/dem-chua-doc
   * Đếm số thông báo chưa đọc
   */
  static async demChuaDoc(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const count = await ThongBaoModel.demChuaDoc(nguoiDungId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi đếm thông báo chưa đọc:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đếm thông báo chưa đọc'
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/thong-bao/:id/doc
   * Đánh dấu thông báo đã đọc
   */
  static async danhDauDaDoc(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const thongBaoId = parseInt(req.params.id);

      if (isNaN(thongBaoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID thông báo không hợp lệ'
        });
      }

      const success = await ThongBaoModel.danhDauDaDoc(thongBaoId, nguoiDungId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo hoặc bạn không có quyền truy cập'
        });
      }

      res.json({
        success: true,
        message: 'Đã đánh dấu đã đọc'
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi đánh dấu đã đọc:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đánh dấu đã đọc'
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/thong-bao/doc-tat-ca
   * Đánh dấu tất cả thông báo đã đọc
   */
  static async danhDauDocTatCa(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const count = await ThongBaoModel.danhDauDocTatCa(nguoiDungId);

      res.json({
        success: true,
        message: `Đã đánh dấu ${count} thông báo đã đọc`,
        count
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi đánh dấu tất cả đã đọc:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đánh dấu tất cả đã đọc'
      });
    }
  }

  /**
   * POST /api/thong-bao/tao-thu
   * Tạo thông báo thử nghiệm (ví dụ: Nạp tiền, Đăng nhập, Khuyến mãi, Tin đăng)
   */
  static async taoThongBaoThu(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const { loai } = req.body || {};
      const ThongBaoService = require('../services/ThongBaoService');

      let type = 'tin-dang';
      let title = 'Thông báo hệ thống';
      let content = 'Bạn có thông báo mới từ hệ thống Hommy.';
      let payload = { type: 'tin-dang' };

      if (loai === 'nap_tien' || loai === 'tai-chinh') {
        type = 'nap_tien';
        title = 'Nạp tiền vào ví thành công';
        content = 'Bạn vừa nạp thành công 200.000 ₫ vào Ví Hommy qua thanh toán QR.';
        payload = { type: 'tai-chinh', subType: 'nap_tien', amount: 200000, icon: '💰', url: '/vi' };
      } else if (loai === 'dang_nhap') {
        type = 'dang_nhap';
        title = 'Đăng nhập thành công';
        content = `Tài khoản của bạn vừa đăng nhập vào hệ thống lúc ${new Date().toLocaleString('vi-VN')}.`;
        payload = { type: 'tin-dang', subType: 'dang_nhap', icon: '🔐' };
      } else if (loai === 'khuyen_mai' || loai === 'khuyen-mai') {
        type = 'khuyen_mai';
        title = 'Nhận Voucher khuyến mãi VIP';
        content = 'Chúc mừng! Bạn nhận được Voucher HOMMYVIP15 giảm 15% gói đăng tin nổi bật.';
        payload = { type: 'khuyen-mai', subType: 'voucher', code: 'HOMMYVIP15', icon: '🎁', url: '/vi' };
      } else if (loai === 'tin_dang') {
        type = 'tin_dang_duyet';
        title = 'Tin đăng #2048 đã được duyệt';
        content = 'Tin đăng "Cho thuê căn hộ cao cấp Bình Thạnh" đã được duyệt và đăng tải.';

        payload = { type: 'tin-dang', subType: 'tin_dang_duyet', tinDangId: 2048, icon: '🏠', url: '/chu-du-an/tin-dang' };
      }

      const thongBao = await ThongBaoService.guiThongBao(
        nguoiDungId,
        type,
        title,
        content,
        payload,
        payload.url || '/'
      );

      res.status(201).json({
        success: true,
        message: 'Đã tạo thông báo thử thành công',
        data: thongBao
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi tạo thông báo thử:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tạo thông báo thử'
      });
    }
  }

  /**
   * DELETE /api/thong-bao/:id
   * Xóa một thông báo (soft delete)
   */
  static async xoa(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const thongBaoId = parseInt(req.params.id);

      if (isNaN(thongBaoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID thông báo không hợp lệ'
        });
      }

      const success = await ThongBaoModel.xoa(thongBaoId, nguoiDungId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo hoặc bạn không có quyền xóa'
        });
      }

      res.json({
        success: true,
        message: 'Đã xóa thông báo'
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi xóa thông báo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xóa thông báo'
      });
    }
  }

  /**
   * DELETE /api/thong-bao/xoa-tat-ca
   * Xóa tất cả thông báo
   */
  static async xoaTatCa(req, res) {
    try {
      const nguoiDungId = req.user.id;
      const count = await ThongBaoModel.xoaTatCa(nguoiDungId);

      res.json({
        success: true,
        message: `Đã xóa ${count} thông báo`,
        count
      });
    } catch (error) {
      console.error('[ThongBaoController] Lỗi xóa tất cả thông báo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xóa tất cả thông báo'
      });
    }
  }
}

module.exports = ThongBaoController;


