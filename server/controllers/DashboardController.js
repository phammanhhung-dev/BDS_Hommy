const DashboardModel = require('../models/DashboardModel');

class DashboardController {
  /**
   * 1. GET /api/operator/dashboard/stats
   * Tổng quan: tin đăng, cuộc hẹn 7 ngày tới, doanh thu tháng này
   */
  static async getStats(req, res) {
    try {
      const stats = await DashboardModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[DashboardController] Error in getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê tổng quan',
        error: error.message
      });
    }
  }

  /**
   * 2. GET /api/operator/dashboard/revenue-chart
   * Doanh thu 6 tháng gần nhất
   */
  static async getRevenueChart(req, res) {
    try {
      const revenueChart = await DashboardModel.getRevenueChart();
      res.json({
        success: true,
        data: revenueChart
      });
    } catch (error) {
      console.error('[DashboardController] Error in getRevenueChart:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy biểu đồ doanh thu',
        error: error.message
      });
    }
  }

  /**
   * 3. GET /api/operator/dashboard/occupancy
   * Tỷ lệ lấp đầy theo từng dự án
   */
  static async getOccupancy(req, res) {
    try {
      const occupancy = await DashboardModel.getOccupancy();
      res.json({
        success: true,
        data: occupancy
      });
    } catch (error) {
      console.error('[DashboardController] Error in getOccupancy:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tỷ lệ lấp đầy',
        error: error.message
      });
    }
  }

  /**
   * 4. GET /api/operator/dashboard/status-distribution
   * Phân phối trạng thái tin đăng
   */
  static async getStatusDistribution(req, res) {
    try {
      const statusDistribution = await DashboardModel.getStatusDistribution();
      res.json({
        success: true,
        data: statusDistribution
      });
    } catch (error) {
      console.error('[DashboardController] Error in getStatusDistribution:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy phân phối trạng thái',
        error: error.message
      });
    }
  }

  /**
   * 5. GET /api/operator/dashboard/recent-listings?limit=5
   * Tin đăng mới nhất
   */
  static async getRecentListings(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const recentListings = await DashboardModel.getRecentListings(limit);
      res.json({
        success: true,
        data: recentListings
      });
    } catch (error) {
      console.error('[DashboardController] Error in getRecentListings:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tin đăng mới nhất',
        error: error.message
      });
    }
  }

  /**
   * 6. GET /api/operator/dashboard/upcoming-appointments
   * Cuộc hẹn trong 7 ngày tới
   */
  static async getUpcomingAppointments(req, res) {
    try {
      const upcomingAppointments = await DashboardModel.getUpcomingAppointments();
      res.json({
        success: true,
        data: upcomingAppointments
      });
    } catch (error) {
      console.error('[DashboardController] Error in getUpcomingAppointments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy cuộc hẹn sắp tới',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;