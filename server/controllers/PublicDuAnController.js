const PublicDuAnModel = require("../models/PublicDuAnModel");
const ChuDuAnModel = require("../models/ChuDuAnModel");

class PublicDuAnController {
  static async getDanhSachDuAn(req, res) {
    try {
      const filters = {
        trangThai: req.query.trangThai,
        keyword: req.query.keyword,
        limit: req.query.limit,
      };
      const data = await PublicDuAnModel.layTatCaDuAn(filters);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getChiTietDuAn(req, res) {
    try {
      const duAnId = parseInt(req.params.id, 10);
      if (isNaN(duAnId)) {
        return res.status(400).json({ success: false, message: "ID dự án không hợp lệ" });
      }

      const duAn = await PublicDuAnModel.layDuAnTheoId(duAnId);
      if (!duAn) {
        return res.status(404).json({ success: false, message: "Không tìm thấy dự án" });
      }

      return res.json({ success: true, data: duAn });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateDuAn(req, res) {
    try {
      const duAnId = parseInt(req.params.id, 10);
      const chuDuAnId = req.body.chuDuAnId;

      if (!duAnId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu ID dự án",
        });
      }

      if (!chuDuAnId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu chuDuAnId trong body",
        });
      }

      const allowed = [
        "TenDuAn",
        "DiaChi",
        "ViDo",
        "KinhDo",
        "YeuCauPheDuyetChu",
        "PhuongThucVao",
        "TrangThai",
      ];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) {
          updates[k] = req.body[k];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có trường hợp lệ để cập nhật",
        });
      }

      await ChuDuAnModel.capNhatDuAn(duAnId, chuDuAnId, updates);
      const duAn = await ChuDuAnModel.layChiTietDuAn(duAnId, chuDuAnId);

      return res.json({
        success: true,
        data: duAn,
        message: "Cập nhật dự án thành công",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteDuAn(req, res) {
    try {
      const duAnId = parseInt(req.params.id, 10);
      const chuDuAnId = req.body.chuDuAnId;

      if (!duAnId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu ID dự án",
        });
      }

      if (!chuDuAnId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu chuDuAnId trong body",
        });
      }

      const ok = await ChuDuAnModel.luuTruDuAn(duAnId, chuDuAnId);

      if (!ok) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án hoặc không có quyền",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Đã lưu trữ dự án",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PublicDuAnController;
