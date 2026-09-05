/**
 * Service layer cho Operator/Admin
 * Xử lý business logic: Quản lý cuộc hẹn, phân công NVBH
 */

const db = require('../config/db');

class OperatorService {
  /**
   * UC-OPR-03: Lấy danh sách cuộc hẹn với filters và pagination
   * @param {Object} filters - { nhanVienId, trangThai, tuNgay, denNgay, page, limit }
   * @returns {Promise<Object>} { cuocHens: Array, pagination: Object }
   */
  static async layDanhSachCuocHen(filters = {}) {
    try {
      const {
        nhanVienId,
        trangThai,
        tuNgay,
        denNgay,
        page = 1,
        limit = 20
      } = filters;

      // Build WHERE conditions
      const conditions = [];
      const params = [];

      if (nhanVienId) {
        conditions.push('ch.NhanVienBanHangID = ?');
        params.push(parseInt(nhanVienId));
      }

      if (trangThai) {
        conditions.push('ch.TrangThai = ?');
        params.push(trangThai);
      }

      if (tuNgay) {
        conditions.push('DATE(ch.ThoiGianHen) >= DATE(?)');
        params.push(tuNgay);
      }

      if (denNgay) {
        conditions.push('DATE(ch.ThoiGianHen) <= DATE(?)');
        params.push(denNgay);
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      // Count total - dùng db.query() cho query động
      const countSql = `
        SELECT COUNT(*) as total
        FROM cuochen ch
        ${whereClause}
      `;
      const [countResult] = await db.query(countSql, params);
      const total = countResult[0].total;

      // Get paginated data - đảm bảo limit/offset là số nguyên
      const limitInt = parseInt(limit, 10) || 20;
      const pageInt = parseInt(page, 10) || 1;
      const offset = (pageInt - 1) * limitInt;
      
      const dataSql = `
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          ch.PheDuyetChuDuAn,
          ch.PhongID,
          ch.TinDangID,
          ch.NhanVienBanHangID,
          ch.KhachHangID,
          ch.ChuDuAnID,
          ch.SoLanDoiLich,
          ch.TaoLuc,
          
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          
          nvbh.TenDayDu as TenNhanVien,
          nvbh.SoDienThoai as SDTNhanVien,
          
          p.TenPhong,
          p.GiaChuan as GiaPhong,
          
          td.TieuDe as TieuDeTinDang,
          
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn
          
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan da ON ch.ChuDuAnID = da.DuAnID
        ${whereClause}
        ORDER BY ch.ThoiGianHen DESC
        LIMIT ? OFFSET ?
      `;

      const dataParams = [...params, limitInt, offset];
      // Dùng db.query() cho query động
      const [rows] = await db.query(dataSql, dataParams);

      return {
        cuocHens: rows,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          totalPages: Math.ceil(total / limitInt)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-OPR-03: Lấy danh sách cuộc hẹn cần gán NVBH
   * @returns {Promise<Array>} Danh sách cuộc hẹn chưa có NVBH
   */
  static async layCuocHenCanGan() {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.PhongID,
          ch.TinDangID,
          ch.ChuDuAnID,
          ch.TaoLuc,
          
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          
          p.TenPhong,
          p.GiaChuan as GiaPhong,
          
          td.TieuDe as TieuDeTinDang,
          
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn
          
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan da ON ch.ChuDuAnID = da.DuAnID
        WHERE ch.NhanVienBanHangID IS NULL
          AND ch.TrangThai = 'DaYeuCau'
        ORDER BY ch.ThoiGianHen ASC
      `);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy cuộc hẹn cần gán: ${error.message}`);
    }
  }

  /**
   * UC-OPR-03: Gán lại cuộc hẹn cho NVBH khác
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienBanHangId - ID nhân viên bán hàng mới
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>}
   */
  static async ganLaiCuocHen(cuocHenId, nhanVienBanHangId, operatorId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validate cuộc hẹn tồn tại
      const [cuocHenRows] = await connection.execute(
        'SELECT CuocHenID, TrangThai, NhanVienBanHangID FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      if (cuocHenRows.length === 0) {
        throw new Error('Cuộc hẹn không tồn tại');
      }

      const cuocHen = cuocHenRows[0];

      // Validate NVBH mới tồn tại và có quyền
      const [nvbhRows] = await connection.execute(
        `SELECT NguoiDungID, TenDayDu, VaiTroID 
         FROM nguoidung 
         WHERE NguoiDungID = ? AND VaiTroID = 2`,
        [nhanVienBanHangId]
      );

      if (nvbhRows.length === 0) {
        throw new Error('Nhân viên bán hàng không tồn tại hoặc không có quyền');
      }

      // Validate trạng thái cho phép gán lại
      const allowedStatuses = ['DaYeuCau', 'ChoXacNhan', 'DaXacNhan'];
      if (!allowedStatuses.includes(cuocHen.TrangThai)) {
        throw new Error(`Không thể gán lại cuộc hẹn ở trạng thái ${cuocHen.TrangThai}`);
      }

      // Update cuộc hẹn
      const newStatus = cuocHen.NhanVienBanHangID === null ? 'ChoXacNhan' : cuocHen.TrangThai;
      
      await connection.execute(
        `UPDATE cuochen 
         SET NhanVienBanHangID = ?,
             TrangThai = ?,
             CapNhatLuc = NOW()
         WHERE CuocHenID = ?`,
        [nhanVienBanHangId, newStatus, cuocHenId]
      );

      // Ghi audit log
      const NhatKyHeThongService = require('./NhatKyHeThongService');
      await NhatKyHeThongService.ghiNhan(
        operatorId,
        'gan_lai_cuoc_hen',
        'CuocHen',
        cuocHenId,
        cuocHen.NhanVienBanHangID,
        nhanVienBanHangId,
        null,
        null
      );

      await connection.commit();

      return {
        success: true,
        cuocHenId,
        nhanVienBanHangIdCu: cuocHen.NhanVienBanHangID,
        nhanVienBanHangIdMoi: nhanVienBanHangId,
        trangThaiMoi: newStatus
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Lỗi gán lại cuộc hẹn: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * UC-OPR-03: Lấy thống kê cuộc hẹn theo khu vực và nhân viên
   * @param {Object} filters - { tuNgay, denNgay }
   * @returns {Promise<Object>}
   */
  static async layThongKeCuocHen(filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      
      const params = [];
      let dateFilter = '';
      
      if (tuNgay && denNgay) {
        dateFilter = 'WHERE DATE(ch.ThoiGianHen) BETWEEN DATE(?) AND DATE(?)';
        params.push(tuNgay, denNgay);
      }

      // Thống kê theo trạng thái
      const [statusStats] = await db.execute(`
        SELECT 
          ch.TrangThai,
          COUNT(*) as SoLuong,
          COUNT(DISTINCT ch.KhachHangID) as SoKhachHang,
          COUNT(DISTINCT ch.NhanVienBanHangID) as SoNhanVien
        FROM cuochen ch
        ${dateFilter}
        GROUP BY ch.TrangThai
      `, params);

      // Thống kê theo nhân viên
      const [nvbhStats] = await db.execute(`
        SELECT 
          nvbh.NguoiDungID,
          nvbh.TenDayDu,
          COUNT(*) as TongCuocHen,
          SUM(CASE WHEN ch.TrangThai = 'HoanThanh' THEN 1 ELSE 0 END) as HoanThanh,
          SUM(CASE WHEN ch.TrangThai IN ('HuyBoiKhach', 'HuyBoiHeThong', 'KhachKhongDen') THEN 1 ELSE 0 END) as ThatBai
        FROM cuochen ch
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        ${dateFilter}
        GROUP BY nvbh.NguoiDungID, nvbh.TenDayDu
        ORDER BY TongCuocHen DESC
      `, params);

      return {
        theoTrangThai: statusStats,
        theoNhanVien: nvbhStats
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-OPR-03: Lấy lịch làm việc NVBH (shifts + appointments)
   * @param {Object} filters - { nhanVienId, tuNgay, denNgay }
   * @returns {Promise<Object>}
   */
  static async layLichLamViec(filters = {}) {
    try {
      const { nhanVienId, tuNgay, denNgay } = filters;
      
      const params = [];
      const conditions = [];

      if (nhanVienId) {
        conditions.push('l.NhanVienBanHangID = ?');
        params.push(parseInt(nhanVienId));
      }

      if (tuNgay && denNgay) {
        conditions.push('DATE(l.BatDau) BETWEEN DATE(?) AND DATE(?)');
        params.push(tuNgay, denNgay);
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      // Lấy ca làm việc
      const [shifts] = await db.execute(`
        SELECT 
          l.LichID,
          l.NhanVienBanHangID,
          l.KhuVucID,
          l.BatDau,
          l.KetThuc,
          l.TrangThai,
          nvbh.TenDayDu as TenNhanVien,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          COALESCE(lc.CommuneName, lp.ProvinceName) as DiaChiKhuVuc
        FROM lich l
        LEFT JOIN nguoidung nvbh ON l.NhanVienBanHangID = nvbh.NguoiDungID
        LEFT JOIN legacy_communes lc ON l.KhuVucID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON l.KhuVucID = lp.ProvinceID
        ${whereClause}
        ORDER BY l.BatDau ASC
      `, params);

      // Lấy cuộc hẹn
      const appointmentConditions = [];
      const appointmentParams = [];

      if (nhanVienId) {
        appointmentConditions.push('ch.NhanVienBanHangID = ?');
        appointmentParams.push(parseInt(nhanVienId));
      }

      if (tuNgay && denNgay) {
        appointmentConditions.push('DATE(ch.ThoiGianHen) BETWEEN DATE(?) AND DATE(?)');
        appointmentParams.push(tuNgay, denNgay);
      }

      const appointmentWhereClause = appointmentConditions.length > 0 
        ? 'WHERE ' + appointmentConditions.join(' AND ')
        : '';

      const [appointments] = await db.execute(`
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          ch.NhanVienBanHangID,
          nvbh.TenDayDu as TenNhanVien,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          da.TenDuAn
        FROM cuochen ch
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN duan da ON ch.ChuDuAnID = da.DuAnID
        ${appointmentWhereClause}
        ORDER BY ch.ThoiGianHen ASC
      `, appointmentParams);

      return {
        shifts,
        appointments
      };
    } catch (error) {
      throw new Error(`Lỗi lấy lịch làm việc: ${error.message}`);
    }
  }
}

module.exports = OperatorService;
