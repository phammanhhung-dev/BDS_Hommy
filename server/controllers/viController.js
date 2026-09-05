const ViModel = require("../models/viModel");

class ViController {
  /**
   * Lấy danh sách ví (Admin only - route đã có requireRole)
   */
  static async danhSach(req, res) {
    try {
      const userRole = req.user?.vaiTro;
      if (userRole !== 'QuanTriVienHeThong') {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      }
      const data = await ViModel.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('[ViController] danhSach error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Lấy ví theo NguoiDungID - chỉ xem ví của chính mình hoặc Admin
   */
  static async layTheoNguoiDungId(req, res) {
    try {
      const nguoiDungId = parseInt(req.params.id, 10);
      if (!nguoiDungId)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu NguoiDungID" });

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      if (authUserId !== nguoiDungId && userRole !== 'QuanTriVienHeThong') {
        return res.status(403).json({ success: false, message: 'Bạn chỉ có thể xem ví của chính mình' });
      }

      const data = await ViModel.getByNguoiDungId(nguoiDungId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[ViController] layTheoNguoiDungId error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }
}

module.exports = ViController;
