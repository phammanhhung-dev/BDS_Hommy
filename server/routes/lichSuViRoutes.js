const express = require("express");
const router = express.Router();
const lichSuViController = require("../controllers/lichSuViController");
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

router.post("/", authenticate, lichSuViController.them);
router.put("/:id", authenticate, lichSuViController.sua);
router.get("/", authenticate, requireRoles(['QuanTriVienHeThong']), lichSuViController.danhSach);
router.get("/user/:user_id", authenticate, lichSuViController.danhSachTheoUser);

module.exports = router;
