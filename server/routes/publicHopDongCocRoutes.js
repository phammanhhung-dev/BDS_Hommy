/**
 * Routes công khai cho Hợp đồng cọc qua QR (Public - Khách hàng)
 * Không yêu cầu authentication
 */

const express = require('express');
const router = express.Router();
const HopDongCocQRController = require('../controllers/HopDongCocQRController');

/**
 * GET /api/public/hop-dong-coc/:maQR
 * Xem hợp đồng cọc từ QR code
 * Khách quét QR sẽ vào trang này
 */
router.get('/:maQR', HopDongCocQRController.xemHopDongCocQR);

/**
 * POST /api/public/hop-dong-coc/:maQR/xac-nhan
 * Khách xác nhận đặt cọc (đồng ý/từ chối)
 * Body: { dongY: boolean, ngayChuyenVao: string }
 */
router.post('/:maQR/xac-nhan', HopDongCocQRController.xacNhanHopDongCocQR);

module.exports = router;

