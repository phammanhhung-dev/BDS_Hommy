/**
 * Dashboard Routes
 * API endpoints cho Dashboard với real-time queries
 */

const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Middleware: Chỉ cho phép Nhân viên Điều hành và Admin (như các route operator khác)
const operatorAuth = [authMiddleware, requireRoles(['NhanVienDieuHanh', 'QuanTriVienHeThong'])];

/**
 * @route GET /api/operator/dashboard/stats
 * @desc Thống kê tổng quan: tin đăng, cuộc hẹn 7 ngày tới, doanh thu tháng này
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/stats', operatorAuth, DashboardController.getStats);

/**
 * @route GET /api/operator/dashboard/revenue-chart
 * @desc Doanh thu 6 tháng gần nhất
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/revenue-chart', operatorAuth, DashboardController.getRevenueChart);

/**
 * @route GET /api/operator/dashboard/occupancy
 * @desc Tỷ lệ lấp đầy theo từng dự án
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/occupancy', operatorAuth, DashboardController.getOccupancy);

/**
 * @route GET /api/operator/dashboard/status-distribution
 * @desc Phân phối trạng thái tin đăng
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/status-distribution', operatorAuth, DashboardController.getStatusDistribution);

/**
 * @route GET /api/operator/dashboard/recent-listings
 * @desc Tin đăng mới nhất
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/recent-listings', operatorAuth, DashboardController.getRecentListings);

/**
 * @route GET /api/operator/dashboard/upcoming-appointments
 * @desc Cuộc hẹn trong 7 ngày tới
 * @access Private (NhanVienDieuHanh or QuanTriVienHeThong only)
 */
router.get('/upcoming-appointments', operatorAuth, DashboardController.getUpcomingAppointments);

module.exports = router;