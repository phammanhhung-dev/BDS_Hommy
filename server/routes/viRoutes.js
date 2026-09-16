const express = require("express");
const router = express.Router();
const viController = require("../controllers/viController");
const authenticate = require('../middleware/auth');

router.get("/", authenticate, viController.danhSach);
router.get("/:id", authenticate, viController.layTheoNguoiDungId);
router.post("/thanh-toan-coc", authenticate, viController.thanhToanCoc);

module.exports = router;
