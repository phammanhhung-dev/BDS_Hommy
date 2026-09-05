const NguoiPhuTrachDuAnModel = require("../models/NguoiPhuTrachDuAnModel");

class NguoiPhuTrachDuAnController {
  /**
   * GET /api/nguoi-phu-trach-du-an?khuVucId=...
   */
  static async layDanhSach(req, res) {
    try {
      const khuVucId = Number(req.params.id);
      if (!Number.isInteger(khuVucId) || khuVucId <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu hoặc sai khuVucId" });
      }
      const data = await NguoiPhuTrachDuAnModel.layDanhSachNhanVienPhuTrach(
        khuVucId
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = NguoiPhuTrachDuAnController;
