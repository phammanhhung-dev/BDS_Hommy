/**
 * Routes công khai cho Gợi ý Tin đăng (Public - Khách hàng)
 * Không yêu cầu authentication
 */

const express = require('express');
const router = express.Router();
const GoiYTinDangController = require('../controllers/GoiYTinDangController');

/**
 * GET /api/public/xem-ngay/:maQR
 * Xem thông tin phòng từ QR code
 * Khách quét QR sẽ vào trang này
 */
router.get('/:maQR', GoiYTinDangController.xemQRXemNgay);

/**
 * POST /api/public/xem-ngay/:maQR/phan-hoi
 * Khách phản hồi (đồng ý/từ chối xem phòng)
 * Body: { dongY: boolean }
 */
router.post('/:maQR/phan-hoi', GoiYTinDangController.phanHoiQRXemNgay);

module.exports = router;

