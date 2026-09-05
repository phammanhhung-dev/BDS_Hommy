/**
 * @fileoverview Routes quản lý Hợp đồng
 * @module hopDongRoutes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const HopDongController = require('../controllers/HopDongController');

// Cấu hình multer cho upload file scan hợp đồng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/temp'); // Tạm lưu, sẽ di chuyển sau
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, JPG, hoặc PNG'));
    }
  }
});

// Base path: /api/chu-du-an

/**
 * POST /api/chu-du-an/hop-dong/bao-cao
 * Báo cáo hợp đồng đã ký
 */
router.post(
  '/hop-dong/bao-cao',
  authMiddleware,
  requireRole('ChuDuAn'),
  HopDongController.baoCao
);

/**
 * GET /api/chu-du-an/hop-dong
 * Lấy danh sách hợp đồng
 */
router.get(
  '/hop-dong',
  authMiddleware,
  requireRole('ChuDuAn'),
  HopDongController.layDanhSach
);

/**
 * GET /api/chu-du-an/hop-dong/:id
 * Lấy chi tiết hợp đồng
 */
router.get(
  '/hop-dong/:id',
  authMiddleware,
  requireRole('ChuDuAn'),
  HopDongController.layChiTiet
);

/**
 * POST /api/chu-du-an/hop-dong/:id/upload
 * Upload file scan hợp đồng
 */
router.post(
  '/hop-dong/:id/upload',
  authMiddleware,
  requireRole('ChuDuAn'),
  upload.single('file'),
  HopDongController.uploadFileScan
);

module.exports = router;
