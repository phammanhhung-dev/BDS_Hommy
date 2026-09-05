const express = require('express');
const router = express.Router();
const ThongBaoController = require('../controllers/ThongBaoController');
const auth = require('../middleware/auth');

// Tất cả routes yêu cầu authentication
router.use(auth);

router.get('/', ThongBaoController.layDanhSach);
router.get('/dem-chua-doc', ThongBaoController.demChuaDoc);
router.put('/doc-tat-ca', ThongBaoController.danhDauDocTatCa);
router.put('/:id/doc', ThongBaoController.danhDauDaDoc);
router.post('/tao-thu', ThongBaoController.taoThongBaoThu);
router.delete('/xoa-tat-ca', ThongBaoController.xoaTatCa);
router.delete('/:id', ThongBaoController.xoa);

module.exports = router;
