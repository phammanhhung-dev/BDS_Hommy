/**
 * Dashboard Operator Controller
 * Xử lý tổng hợp metrics cho Dashboard Operator
 */

const TinDangOperatorModel = require('../models/TinDangOperatorModel');
const DuAnOperatorModel = require('../models/DuAnOperatorModel');
const HoSoNhanVienModel = require('../models/HoSoNhanVienModel');
const BienBanBanGiaoModel = require('../models/BienBanBanGiaoModel');

class DashboardOperatorController {
  /**
   * Lấy tất cả metrics cho dashboard
   * GET /api/operator/dashboard/metrics
   */
  static async layMetrics(req, res) {
    try {
      // Parallel fetch tất cả metrics
      const [tinDang, duAn, nhanVien, bienBan] = await Promise.all([
        TinDangOperatorModel.layThongKeTinDang(),
        DuAnOperatorModel.layThongKeDuAn(),
        HoSoNhanVienModel.layThongKeNhanVien(),
        BienBanBanGiaoModel.layThongKeBienBan()
      ]);

      res.json({
        success: true,
        data: {
          tinDang,
          duAn,
          nhanVien,
          bienBan
        }
      });
    } catch (error) {
      console.error('[DashboardOperatorController] Error in layMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy metrics dashboard',
        error: error.message
      });
    }
  }
}

module.exports = DashboardOperatorController;

