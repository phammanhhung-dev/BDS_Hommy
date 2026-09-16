const express = require("express");
const router = express.Router();
const BaiVietController = require("../controllers/BaiVietController");
const authMiddleware = require("../middleware/auth");

// Yêu cầu đăng nhập và có quyền Admin (VaiTroID = 4) hoặc Điều hành (VaiTroID = 5)
router.use(authMiddleware);

// Middleware kiểm tra quyền admin/operator
const checkAdminOrOperator = (req, res, next) => {
  const roleId = req.user?.VaiTroHoatDongID || req.user?.VaiTroID;
  if (roleId === 4 || roleId === 5) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
  }
};

router.use(checkAdminOrOperator);

// POST /api/admin/bai-viet (tạo bài viết)
router.post("/", BaiVietController.taoBaiViet);

// PUT /api/admin/bai-viet/:id (cập nhật bài viết)
router.put("/:id", BaiVietController.capNhatBaiViet);

// DELETE /api/admin/bai-viet/:id (xóa bài viết)
router.delete("/:id", BaiVietController.xoaBaiViet);

module.exports = router;
