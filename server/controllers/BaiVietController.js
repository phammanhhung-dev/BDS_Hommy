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

  /**
   * Tạo bài viết mới (Admin/Operator)
   * POST /api/admin/bai-viet
   */
  static async taoBaiViet(req, res) {
    try {
      const { TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug } = req.body;
      const NguoiVietID = req.user ? req.user.NguoiDungID : null;

      if (!TieuDe || !Slug) {
        return res.status(400).json({ success: false, message: "Thiếu Tiêu đề hoặc Slug" });
      }

      const id = await BaiVietModel.themBaiViet({
        TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, NguoiVietID
      });

      return res.status(201).json({
        success: true,
        message: "Tạo bài viết thành công",
        data: { BaiVietID: id }
      });
    } catch (error) {
      console.error("[BaiVietController] Error taoBaiViet:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Cập nhật bài viết (Admin/Operator)
   * PUT /api/admin/bai-viet/:id
   */
  static async capNhatBaiViet(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const success = await BaiVietModel.suaBaiViet(id, updateData);

      if (!success) {
        return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
      }

      return res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
      console.error("[BaiVietController] Error capNhatBaiViet:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Xóa bài viết (Admin/Operator)
   * DELETE /api/admin/bai-viet/:id
   */
  static async xoaBaiViet(req, res) {
    try {
      const { id } = req.params;
      const success = await BaiVietModel.xoaBaiViet(id);

      if (!success) {
        return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
      }

      return res.json({ success: true, message: "Xóa bài viết thành công" });
    } catch (error) {
      console.error("[BaiVietController] Error xoaBaiViet:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = BaiVietController;
