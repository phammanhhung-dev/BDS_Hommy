const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const MauHopDongController = require('../controllers/MauHopDongController');

// GET /api/mau-hop-dong/:id/preview?tinDangId=123
router.get(
  '/:id/preview',
  authMiddleware,
  requireRole('KhachHang'),
  MauHopDongController.preview
);

module.exports = router;

