const LichSuViModel = require("../models/lichSuViModel");

class LichSuViController {
  /**
   * Thêm lịch sử ví mới
   */
  static async them(req, res) {
    try {
      const { ma_giao_dich, so_tien, trang_thai, LoaiGiaoDich } = req.body;
      const user_id = req.user?.id;

      if (!user_id || !ma_giao_dich || !so_tien) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin bắt buộc" });
      }
      const result = await LichSuViModel.themLichSuVi({
        user_id,
        ma_giao_dich,
        so_tien,
        trang_thai,
        LoaiGiaoDich,
      });
      res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      console.error('[LichSuVi] them error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Sửa lịch sử ví (Admin only - route đã có requireRole)
   */
  static async sua(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res.status(400).json({ success: false, message: "Thiếu id" });
      const { user_id, ma_giao_dich, so_tien, trang_thai } = req.body;
      const result = await LichSuViModel.suaLichSuVi(id, {
        user_id,
        ma_giao_dich,
        so_tien,
        trang_thai,
      });
      res.json({ success: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error('[LichSuVi] sua error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Xem tất cả lịch sử ví (Admin only - route đã có requireRole)
   */
  static async danhSach(req, res) {
    try {
      const data = await LichSuViModel.layTatCa();
      res.json({ success: true, data });
    } catch (error) {
      console.error('[LichSuVi] danhSach error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Xem lịch sử ví theo user - chỉ xem của mình hoặc Admin
   */
  static async danhSachTheoUser(req, res) {
    try {
      const user_id = parseInt(req.params.user_id, 10);
      if (!user_id)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu user_id" });

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      if (authUserId !== user_id && userRole !== 'QuanTriVienHeThong') {
        return res.status(403).json({ success: false, message: 'Bạn chỉ có thể xem lịch sử ví của chính mình' });
      }

      const data = await LichSuViModel.layTheoUser(user_id);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[LichSuVi] danhSachTheoUser error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }
}

module.exports = LichSuViController;
