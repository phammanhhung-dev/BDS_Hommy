const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const HopDongCustomerController = require('../controllers/HopDongCustomerController');

// POST /api/hop-dong/generate
router.post(
  '/generate',
  authMiddleware,
  requireRole('KhachHang'),
  HopDongCustomerController.generate
);

// POST /api/hop-dong/:tinDangId/confirm-deposit
router.post(
  '/:tinDangId/confirm-deposit',
  authMiddleware,
  requireRole('KhachHang'),
  HopDongCustomerController.confirmDeposit
);

// GET /api/hop-dong/khach-hang
router.get(
  '/khach-hang',
  authMiddleware,
  requireRole('KhachHang'),
  HopDongCustomerController.layDanhSachHopDong
);

// POST /api/hop-dong/:id/xin-huy
router.post(
  '/:id/xin-huy',
  authMiddleware,
  requireRole('KhachHang'),
  HopDongCustomerController.xinHuy
);

module.exports = router;

