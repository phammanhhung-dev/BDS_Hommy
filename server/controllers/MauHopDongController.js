/**
 * Controller phục vụ các API đọc mẫu hợp đồng
 */

const HopDongTemplateService = require('../services/HopDongTemplateService');

class MauHopDongController {
  /**
   * GET /api/mau-hop-dong/:id/preview?tinDangId=123
   * Trả về template đã được auto-fill cho KhachHang đang đăng nhập
   */
  static async preview(req, res) {
    try {
      const mauHopDongId = req.params.id ? Number(req.params.id) : null;
      const tinDangId = Number(req.query.tinDangId || req.body?.tinDangId);

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tinDangId để dựng hợp đồng',
        });
      }

      const preview = await HopDongTemplateService.buildPreview({
        mauHopDongId,
        tinDangId,
        khachHangId: req.user.id,
      });

      return res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      console.error('[MauHopDongController.preview]', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi dựng mẫu hợp đồng',
      });
    }
  }
}

module.exports = MauHopDongController;

