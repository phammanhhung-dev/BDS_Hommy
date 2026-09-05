const express = require("express");
const router = express.Router();
const PublicTinDangController = require("../controllers/PublicTinDangController");

// GET /api/public/tin-dang (public - danh sách)
router.get("/", PublicTinDangController.getDanhSachTinDang);

// GET /api/public/tin-dang/stats (public - thống kê)
router.get("/stats", PublicTinDangController.getThongKeTrangChu);

// POST /api/public/tin-dang/predict-price (public - định giá học máy)
router.post("/predict-price", PublicTinDangController.predictPrice);

// GET /api/public/tin-dang/:id (public - chi tiết)
router.get("/:id", PublicTinDangController.getChiTietTinDang);

// Public endpoint chỉ cho phép đọc, không cho phép mutate dữ liệu.
router.put("/:id", (req, res) => {
  return res.status(405).json({
    success: false,
    message: "Public API chỉ hỗ trợ GET"
  });
});

router.delete("/:id", (req, res) => {
  return res.status(405).json({
    success: false,
    message: "Public API chỉ hỗ trợ GET"
  });
});

module.exports = router;
