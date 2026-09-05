/**
 * Dashboard Operator Routes
 * Endpoint tổng hợp metrics cho Dashboard Operator
 */

const express = require('express');
const router = express.Router();
const DashboardOperatorController = require('../controllers/DashboardOperatorController');
const authMiddleware = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin (như các route operator khác)
const operatorAuth = [authMiddleware, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * @route GET /api/operator/dashboard/metrics
 * @desc Lấy tất cả metrics cho dashboard operator
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/metrics', operatorAuth, DashboardOperatorController.layMetrics);

module.exports = router;

