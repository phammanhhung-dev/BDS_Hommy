const express = require("express");
const router = express.Router();
const NguoiPhuTrachDuAnController = require("../controllers/NguoiPhuTrachDuAnController");
const authenticate = require('../middleware/auth');

router.get("/:id", authenticate, NguoiPhuTrachDuAnController.layDanhSach);

module.exports = router;
