const express = require("express");
const router = express.Router();
const PublicDuAnController = require("../controllers/PublicDuAnController");

router.get("/", PublicDuAnController.getDanhSachDuAn);
router.get("/:id", PublicDuAnController.getChiTietDuAn);

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
