const express = require("express");
const router = express.Router();
const BaiVietController = require("../controllers/BaiVietController");

// GET /api/public/bai-viet (danh sách bài viết)
router.get("/", BaiVietController.getDanhSachBaiViet);

// GET /api/public/bai-viet/:idOrSlug (chi tiết bài viết)
router.get("/:idOrSlug", BaiVietController.getChiTietBaiViet);

// Đảm bảo chỉ hỗ trợ GET ở API công khai
router.all("*", (req, res, next) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "API công khai này chỉ hỗ trợ phương thức GET",
    });
  }
  next();
});

module.exports = router;
