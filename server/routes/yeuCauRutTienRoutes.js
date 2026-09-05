const express = require('express');
const router = express.Router();
const YeuCauRutTienController = require('../controllers/YeuCauRutTienController');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// User Routes
router.post('/', authenticate, YeuCauRutTienController.taoYeuCau);
router.get('/cua-toi', authenticate, YeuCauRutTienController.layLichSuCuaToi);

// Admin Routes (QuanTriVienHeThong)
router.get('/admin/tat-ca', authenticate, requireRoles(['QuanTriVienHeThong', 'NhanVienDieuHanh']), YeuCauRutTienController.layTatCaYeuCau);
router.put('/admin/:id/xu-ly', authenticate, requireRoles(['QuanTriVienHeThong']), YeuCauRutTienController.xuLyYeuCau);

module.exports = router;
