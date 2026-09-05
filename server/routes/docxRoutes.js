/**
 * Routes cho tạo file Word (.docx)
 */

const express = require('express');
const router = express.Router();
const DocxController = require('../controllers/DocxController');
// const { authenticate, authorize } = require('../middleware/auth');

// Tạo báo cáo hiệu suất Chủ dự án
router.post('/bao-cao-hieu-suat/:chuDuAnId', DocxController.taoBaoCaoHieuSuat);

// Tạo hợp đồng thuê phòng
router.post('/hop-dong/:hopDongId', DocxController.taoHopDong);

// Tạo báo cáo thu chi
router.post('/bao-cao-thu-chi', DocxController.taoBaoCaoThuChi);

// Tạo document tùy chỉnh
router.post('/custom', DocxController.taoDocumentCustom);

module.exports = router;


