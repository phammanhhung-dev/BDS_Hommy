const db = require('../config/db');

class DashboardModel {
  /**
   * 1. GET /api/operator/dashboard/stats
   * Tổng quan: tin đăng, cuộc hẹn 7 ngày tới, doanh thu tháng này
   */
  static async getStats() {
    try {
      // 1. Thống kê tin đăng theo trạng thái
      const [listingsCountRows] = await db.execute(`
        SELECT 
          COUNT(CASE WHEN TrangThai = 'Nhap' THEN 1 END) as Nhap,
          COUNT(CASE WHEN TrangThai = 'ChoDuyet' THEN 1 END) as ChoDuyet,
          COUNT(CASE WHEN TrangThai = 'DaDuyet' THEN 1 END) as DaDuyet,
          COUNT(CASE WHEN TrangThai = 'DaDang' THEN 1 END) as DaDang,
          COUNT(CASE WHEN TrangThai = 'TamNgung' THEN 1 END) as TamNgung,
          COUNT(CASE WHEN TrangThai = 'TuChoi' THEN 1 END) as TuChoi,
          COUNT(CASE WHEN TrangThai = 'LuuTru' THEN 1 END) as LuuTru,
          COUNT(*) as TongSoTinDang
        FROM tindang
      `);
      const listingsStats = listingsCountRows[0];

      // 2. Thống kê người dùng
      const [usersCountRows] = await db.execute(`SELECT COUNT(*) as total FROM nguoidung`);
      const totalUsers = usersCountRows[0].total;

      // 3. Thống kê dự án
      const [projectsCountRows] = await db.execute(`SELECT COUNT(*) as total FROM duan`);
      const totalProjects = projectsCountRows[0].total;

      // 4. Thống kê cuộc hẹn
      const [appointmentsCountRows] = await db.execute(`SELECT COUNT(*) as total FROM cuochen`);
      const totalAppointments = appointmentsCountRows[0].total;

      // 5. Cuộc hẹn trong 7 ngày tới
      const [upcomingAppointmentsRows] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM cuochen 
        WHERE ThoiGianHen >= CURDATE() 
          AND ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `);
      const upcomingAppointments7Days = upcomingAppointmentsRows[0].total;

      // 6. Doanh thu tháng này (chỉ tính giao dịch đã thanh toán)
      const [revenueRows] = await db.execute(`
        SELECT COALESCE(SUM(SoTien), 0) as total 
        FROM giaodich 
        WHERE TrangThai = 'DaThanhToan' 
          AND MONTH(ThoiGian) = MONTH(CURDATE()) 
          AND YEAR(ThoiGian) = YEAR(CURDATE())
      `);
      const revenueThisMonth = revenueRows[0].total;

      // 7. Hoạt động gần đây (nhatkyhethong)
      const [activityRows] = await db.execute(`
        SELECT 
          nk.NhatKyID,
          nk.HanhDong,
          nk.DoiTuong,
          nk.DoiTuongID,
          nk.GiaTriTruoc,
          nk.GiaTriSau,
          nk.ThoiGian,
          nd.TenDayDu
        FROM nhatkyhethong nk
        LEFT JOIN nguoidung nd ON nk.NguoiDungID = nd.NguoiDungID
        ORDER BY nk.ThoiGian DESC
        LIMIT 5
      `);

      return {
        ...listingsStats,
        TongNguoiDung: totalUsers,
        TongDuAn: totalProjects,
        TongCuocHen: totalAppointments,
        CuocHen7Ngay: upcomingAppointments7Days,
        DoanhThuThangNay: revenueThisMonth,
        RecentActivities: activityRows
      };
    } catch (error) {
      console.error('[DashboardModel] Lỗi getStats:', error);
      throw new Error(`Lỗi lấy thống kê tổng quan: ${error.message}`);
    }
  }

  /**
   * 2. GET /api/operator/dashboard/revenue-chart
   * Doanh thu 6 tháng gần nhất
   */
  static async getRevenueChart() {
    try {
      const query = `
        SELECT 
          DATE_FORMAT(gd.ThoiGian, '%Y-%m') as Thang,
          COALESCE(SUM(CASE 
            WHEN gd.TrangThai = 'DaThanhToan' 
            THEN gd.SoTien 
            ELSE 0 
          END), 0) as DoanhThu
        FROM giaodich gd
        WHERE gd.ThoiGian >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(gd.ThoiGian, '%Y-%m')
        ORDER BY Thang ASC
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('[DashboardModel] Lỗi getRevenueChart:', error);
      throw new Error(`Lỗi lấy biểu đồ doanh thu: ${error.message}`);
    }
  }

  /**
   * 3. GET /api/operator/dashboard/occupancy
   * Tỷ lệ lấp đầy theo từng dự án
   */
  static async getOccupancy() {
    try {
      const query = `
        SELECT 
          d.DuAnID,
          d.TenDuAn,
          COUNT(*) as TongPhong,
          COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) as PhongDaThue,
          ROUND(
            (COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(*), 0), 
            2
          ) as TyLeLapDay
        FROM duan d
        LEFT JOIN phong p ON d.DuAnID = p.DuAnID
        GROUP BY d.DuAnID, d.TenDuAn
        ORDER BY TyLeLapDay DESC
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('[DashboardModel] Lỗi getOccupancy:', error);
      throw new Error(`Lỗi lấy tỷ lệ lấp đầy: ${error.message}`);
    }
  }

  /**
   * 4. GET /api/operator/dashboard/status-distribution
   * Phân phối trạng thái tin đăng
   */
  static async getStatusDistribution() {
    try {
      const query = `
        SELECT 
          TrangThai,
          COUNT(*) as SoLuong
        FROM tindang
        GROUP BY TrangThai
        ORDER BY 
          CASE TrangThai
            WHEN 'DaDang' THEN 1
            WHEN 'ChoDuyet' THEN 2
            WHEN 'DaDuyet' THEN 3
            WHEN 'Nhap' THEN 4
            WHEN 'TamNgung' THEN 5
            WHEN 'TuChoi' THEN 6
            WHEN 'LuuTru' THEN 7
          END
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('[DashboardModel] Lỗi getStatusDistribution:', error);
      throw new Error(`Lỗi lấy phân phối trạng thái: ${error.message}`);
    }
  }

  /**
   * 5. GET /api/operator/dashboard/recent-listings?limit=5
   * Tin đăng mới nhất
   */
  static async getRecentListings(limit = 5) {
    try {
      const query = `
        SELECT 
          td.TinDangID,
          td.TieuDe,
          td.TrangThai,
          td.TaoLuc,
          td.DuAnID,
          d.TenDuAn
        FROM tindang td
        LEFT JOIN duan d ON td.DuAnID = d.DuAnID
        ORDER BY td.TaoLuc DESC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [limit]);
      return rows;
    } catch (error) {
      console.error('[DashboardModel] Lỗi getRecentListings:', error);
      throw new Error(`Lỗi lấy tin đăng mới nhất: ${error.message}`);
    }
  }

  /**
   * 6. GET /api/operator/dashboard/upcoming-appointments
   * Cuộc hẹn trong 7 ngày tới
   */
  static async getUpcomingAppointments() {
    try {
      const query = `
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai as TrangThaiCuocHen,
          ch.PheDuyetChuDuAn,
          td.TinDangID,
          td.TieuDe as TieuDeTinDang,
          td.TrangThai as TrangThaiTinDang,
          d.TenDuAn,
          p.TenPhong,
          nd.TenDayDu as TenKhachHang,
          nv.TenDayDu as TenNhanVien
        FROM cuochen ch
        INNER JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan d ON td.DuAnID = d.DuAnID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN nguoidung nd ON ch.KhachHangID = nd.NguoiDungID
        LEFT JOIN nguoidung nv ON ch.NhanVienBanHangID = nv.NguoiDungID
        WHERE ch.ThoiGianHen >= CURDATE() 
        AND ch.ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY ch.ThoiGianHen ASC
        LIMIT 10
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('[DashboardModel] Lỗi getUpcomingAppointments:', error);
      throw new Error(`Lỗi lấy cuộc hẹn sắp tới: ${error.message}`);
    }
  }
}

module.exports = DashboardModel;