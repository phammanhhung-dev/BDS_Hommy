const express = require("express");
const router = express.Router();
const cuocHenCtrl = require("../controllers/cuocHenController");
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

router.post("/", authenticate, cuocHenCtrl.create);
router.get("/", authenticate, requireRoles(['QuanTriVienHeThong', 'NhanVienDieuHanh']), cuocHenCtrl.getAll);
router.get("/search/khach-hang/:khachHangId", authenticate, cuocHenCtrl.findByKhachHang);
router.get("/search/nhan-vien/:nhanVienId", authenticate, cuocHenCtrl.findByNhanVien);
router.get("/search/chu-du-an/:chuDuAnId", authenticate, cuocHenCtrl.findByChuDuAn);
router.get("/:id", authenticate, cuocHenCtrl.getById);
router.put("/:id", authenticate, cuocHenCtrl.update);
router.delete("/:id", authenticate, cuocHenCtrl.delete);

module.exports = router;
