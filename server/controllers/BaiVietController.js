const BaiVietModel = require("../models/BaiVietModel");

class BaiVietController {
  /**
   * Lấy danh sách bài viết công khai
   * GET /api/public/bai-viet
   */
  static async getDanhSachBaiViet(req, res) {
    try {
      const filters = {
        loai: req.query.loai,
        danhMuc: req.query.danhMuc,
        limit: req.query.limit,
      };

      const data = await BaiVietModel.layDanhSachBaiViet(filters);
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("[BaiVietController] Error get list:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy chi tiết bài viết
   * GET /api/public/bai-viet/:idOrSlug
   */
  static async getChiTietBaiViet(req, res) {
    try {
      const { idOrSlug } = req.params;
      
      if (!idOrSlug) {
        return res.status(400).json({
          success: false,
          message: "Thiếu định danh bài viết",
        });
      }

      const post = await BaiVietModel.layChiTietBaiViet(idOrSlug);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết",
        });
      }

      return res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error("[BaiVietController] Error get detail:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = BaiVietController;
