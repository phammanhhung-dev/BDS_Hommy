/**
 * Model cho Nhân viên Điều hành - Quản lý Lịch làm việc NVBH
 * UC-OPER-03: Quản lý lịch làm việc tổng thể
 * Điều phối nhân sự, phân tích độ phủ, gán lại cuộc hẹn
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

class LichLamViecOperatorModel {
  /**
   * Lấy danh sách cuộc hẹn cho Operator với phân trang và bộ lọc
   * Dùng cho UC-OPER-03 - List view
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.trangThai] - Trạng thái cuộc hẹn
   * @param {string} [filters.tuNgay] - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} [filters.denNgay] - Ngày kết thúc (YYYY-MM-DD)
   * @param {number} [filters.nhanVienId] - Lọc theo NVBH phụ trách
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số dòng mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number, limit: number}>}
   */
  static async layDanhSachCuocHen(filters = {}) {
    try {
      const {
        trangThai = '',
        tuNgay = '',
        denNgay = '',
        nhanVienId = null,
        page = 1,
        limit = 20
      } = filters;

      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 20;
      const offset = (parsedPage - 1) * parsedLimit;

      const whereConditions = [];
      const params = [];

      // Chỉ lấy các trạng thái liên quan vận hành lịch
      if (trangThai) {
        whereConditions.push('ch.TrangThai = ?');
        params.push(trangThai);
      }

      if (tuNgay && denNgay) {
        whereConditions.push('DATE(ch.ThoiGianHen) BETWEEN ? AND ?');
        params.push(tuNgay, denNgay);
      }

      if (nhanVienId) {
        whereConditions.push('ch.NhanVienBanHangID = ?');
        params.push(nhanVienId);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const query = `
        SELECT
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          ch.SoLanDoiLich,
          ch.NhanVienBanHangID,
          ch.KhachHangID,
          kh.TenDayDu AS TenKhachHang,
          kh.SoDienThoai AS SoDienThoaiKhach,
          nvbh.TenDayDu AS TenNVBH,
          p.PhongID,
          p.TenPhong,
          td.TieuDe AS TieuDeTinDang,
          da.DuAnID,
          da.TenDuAn
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN tindang td ON p.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        ${whereClause}
        ORDER BY ch.ThoiGianHen DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parsedLimit, offset);

      // Dùng db.query() cho query động (WHERE clause thay đổi) - best practice
      const [rows] = await db.query(query, params);

      // Query tổng số bản ghi
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN tindang td ON p.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        ${whereClause}
      `;

      const countParams = params.slice(0, -2);
      const [countRows] = await db.query(countQuery, countParams);
      const total = countRows[0]?.total || 0;

      return {
        data: rows,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit) || 1,
        limit: parsedLimit
      };
    } catch (error) {
      console.error('[LichLamViecOperatorModel] Lỗi layDanhSachCuocHen:', error);
      throw new Error(`Lỗi lấy danh sách cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * Lấy lịch làm việc tổng hợp của tất cả NVBH (calendar view data)
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.startDate] - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} [filters.endDate] - Ngày kết thúc (YYYY-MM-DD)
   * @param {number} [filters.khuVucId] - ID khu vực
   * @param {number} [filters.nhanVienId] - ID nhân viên cụ thể
   * @returns {Promise<Array>} Danh sách lịch làm việc với thông tin nhân viên
   */
  static async layLichTongHop(filters = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        khuVucId = null,
        nhanVienId = null
      } = filters;

      let whereConditions = [];
      const params = [];

      if (startDate) {
        whereConditions.push(`DATE(ll.BatDau) >= ?`);
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`DATE(ll.KetThuc) <= ?`);
        params.push(endDate);
      }

      if (khuVucId) {
        whereConditions.push(`hs.KhuVucChinhID = ?`);
        params.push(khuVucId);
      }

      if (nhanVienId) {
        whereConditions.push(`ll.NhanVienBanHangID = ?`);
        params.push(nhanVienId);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const query = `
        SELECT 
          ll.LichID,
          ll.NhanVienBanHangID,
          ll.BatDau,
          ll.KetThuc,
          nd.TenDayDu as TenNhanVien,
          nd.SoDienThoai,
          hs.MaNhanVien,
          hs.KhuVucChinhID,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          nd.TrangThai as TrangThaiLamViec,
          COUNT(ch.CuocHenID) as SoCuocHen,
          COUNT(CASE WHEN ch.TrangThai = 'DaXacNhan' THEN 1 END) as SoCuocHenDaXacNhan
        FROM lichlamviec ll
        INNER JOIN nguoidung nd ON ll.NhanVienBanHangID = nd.NguoiDungID
        INNER JOIN hosonhanvien hs ON nd.NguoiDungID = hs.NguoiDungID
        LEFT JOIN legacy_communes lc ON hs.KhuVucChinhID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON hs.KhuVucChinhID = lp.ProvinceID
        LEFT JOIN cuochen ch ON ll.NhanVienBanHangID = ch.NhanVienBanHangID
          AND ch.ThoiGianHen BETWEEN ll.BatDau AND ll.KetThuc
        ${whereClause}
        GROUP BY ll.LichID, ll.NhanVienBanHangID, ll.BatDau, ll.KetThuc, 
                 nd.TenDayDu, nd.SoDienThoai, nd.TrangThai,
                 hs.MaNhanVien, hs.KhuVucChinhID, kv.TenKhuVuc
        ORDER BY ll.BatDau ASC
      `;

      // Dùng db.query() cho query động
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('[LichLamViecOperatorModel] Lỗi layLichTongHop:', error);
      throw new Error(`Lỗi lấy lịch tổng hợp: ${error.message}`);
    }
  }

  /**
   * Phân tích độ phủ nhân sự theo khu vực và thời gian (heatmap data)
   * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
   * @param {number} [khuVucId] - ID khu vực cụ thể (null = tất cả)
   * @returns {Promise<Array>} Dữ liệu phân tích độ phủ
   */
  static async phanTichDoPhus(startDate, endDate, khuVucId = null) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Cần cung cấp startDate và endDate');
      }

      const params = [startDate, endDate];
      let khuVucCondition = '';

      if (khuVucId) {
        khuVucCondition = 'AND hs.KhuVucChinhID = ?';
        params.push(khuVucId);
      }

      // Phân tích theo giờ trong ngày
      const query = `
        SELECT 
          DATE(ll.BatDau) as Ngay,
          HOUR(ll.BatDau) as Gio,
          COALESCE(lc.CommuneID, lp.ProvinceID) as KhuVucID,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          COUNT(DISTINCT ll.NhanVienBanHangID) as SoNhanVien,
          COUNT(DISTINCT ch.CuocHenID) as SoCuocHen,
          ROUND(
            COUNT(DISTINCT ch.CuocHenID) / NULLIF(COUNT(DISTINCT ll.NhanVienBanHangID), 0),
            2
          ) as TyLeCuocHenTrenNhanVien
        FROM lichlamviec ll
        INNER JOIN hosonhanvien hs ON ll.NhanVienBanHangID = hs.NguoiDungID
        LEFT JOIN legacy_communes lc ON hs.KhuVucChinhID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON hs.KhuVucChinhID = lp.ProvinceID
        LEFT JOIN cuochen ch ON ll.NhanVienBanHangID = ch.NhanVienBanHangID
          AND ch.ThoiGianHen BETWEEN ll.BatDau AND ll.KetThuc
        WHERE DATE(ll.BatDau) BETWEEN ? AND ?
          ${khuVucCondition}
        GROUP BY DATE(ll.BatDau), HOUR(ll.BatDau), COALESCE(lc.CommuneID, lp.ProvinceID)
        ORDER BY Ngay, Gio, COALESCE(lc.CommuneID, lp.ProvinceID)
      `;

      const [rows] = await db.execute(query, params);

      // Tính toán độ phủ (coverage score: 0-100)
      const heatmapData = rows.map(row => ({
        ...row,
        DoPhus: this._tinhDoPhus(row.SoNhanVien, row.SoCuocHen),
        MucDo: this._xacDinhMucDoPhus(row.SoNhanVien, row.SoCuocHen)
      }));

      return heatmapData;
    } catch (error) {
      console.error('[LichLamViecOperatorModel] Lỗi phanTichDoPhus:', error);
      throw new Error(`Lỗi phân tích độ phủ: ${error.message}`);
    }
  }

  /**
   * Tính độ phủ (coverage score: 0-100)
   * @private
   */
  static _tinhDoPhus(soNhanVien, soCuocHen) {
    if (soNhanVien === 0) return 0;
    
    const tyLe = soCuocHen / soNhanVien;
    
    // Giả định: 1 nhân viên xử lý tốt 3-5 cuộc hẹn/khung giờ
    if (tyLe <= 3) return 100; // Đủ nhân sự
    if (tyLe <= 5) return 70;  // Khá tốt
    if (tyLe <= 7) return 40;  // Cần bổ sung
    return 10; // Thiếu hụt nghiêm trọng
  }

  /**
   * Xác định mức độ phủ (textual)
   * @private
   */
  static _xacDinhMucDoPhus(soNhanVien, soCuocHen) {
    const doPhus = this._tinhDoPhus(soNhanVien, soCuocHen);
    
    if (doPhus >= 80) return 'Tot';
    if (doPhus >= 50) return 'TrungBinh';
    if (doPhus >= 30) return 'Yeu';
    return 'KemThieuHut';
  }

  /**
   * Lấy danh sách cuộc hẹn chưa có NVBH hoặc cần gán lại
   * @returns {Promise<Array>} Danh sách cuộc hẹn cần gán
   */
  static async layDanhSachCuocHenCanGan() {
    try {
      const query = `
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          ch.NhanVienBanHangID,
          p.PhongID,
          p.TenPhong,
          td.TinDangID,
          td.TieuDe as TieuDeTinDang,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          kh.NguoiDungID as KhachHangID,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SoDienThoaiKhachHang,
          nvbh.TenDayDu as TenNhanVienHienTai,
          hs.KhuVucChinhID as KhuVucNhanVienHienTai
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN tindang td ON p.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        LEFT JOIN hosonhanvien hs ON nvbh.NguoiDungID = hs.NguoiDungID
        WHERE ch.TrangThai IN ('DaYeuCau', 'ChoXacNhan', 'DaXacNhan')
          AND (
            ch.NhanVienBanHangID IS NULL 
            OR ch.TrangThai = 'DaYeuCau'
          )
        ORDER BY ch.ThoiGianHen ASC
        LIMIT 100
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('[LichLamViecOperatorModel] Lỗi layDanhSachCuocHenCanGan:', error);
      throw new Error(`Lỗi lấy danh sách cuộc hẹn cần gán: ${error.message}`);
    }
  }

  /**
   * Gán lại cuộc hẹn cho NVBH khác
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienBanHangIdMoi - ID NVBH mới
   * @param {number} nhanVienDieuHanhId - ID nhân viên điều hành thực hiện
   * @returns {Promise<Object>} Thông tin cuộc hẹn sau khi gán
   */
  static async ganLaiCuocHen(cuocHenId, nhanVienBanHangIdMoi, nhanVienDieuHanhId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Kiểm tra cuộc hẹn
      const [cuocHenRows] = await connection.execute(
        `SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          ch.NhanVienBanHangID as NhanVienCu,
          ch.KhachHangID,
          p.PhongID,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN tindang td ON p.TinDangID = td.TinDangID
        WHERE ch.CuocHenID = ?`,
        [cuocHenId]
      );

      if (!cuocHenRows.length) {
        throw new Error('Cuộc hẹn không tồn tại');
      }

      const cuocHen = cuocHenRows[0];

      // Kiểm tra NVBH mới tồn tại và active
      const [nvbhRows] = await connection.execute(
        `SELECT 
          nd.NguoiDungID,
          nd.TenDayDu,
          hs.TrangThaiLamViec
        FROM nguoidung nd
        INNER JOIN hosonhanvien hs ON nd.NguoiDungID = hs.NguoiDungID
        WHERE nd.NguoiDungID = ?`,
        [nhanVienBanHangIdMoi]
      );

      if (!nvbhRows.length) {
        throw new Error('Nhân viên bán hàng không tồn tại');
      }

      const nvbh = nvbhRows[0];

      if (nvbh.TrangThaiLamViec !== 'Active') {
        throw new Error(`Nhân viên ${nvbh.TenDayDu} không hoạt động`);
      }

      // Kiểm tra lịch làm việc NVBH mới có phù hợp không
      const [lichRows] = await connection.execute(
        `SELECT LichID
         FROM lichlamviec
         WHERE NhanVienBanHangID = ?
           AND ? BETWEEN BatDau AND KetThuc`,
        [nhanVienBanHangIdMoi, cuocHen.ThoiGianHen]
      );

      if (!lichRows.length) {
        throw new Error(`Nhân viên ${nvbh.TenDayDu} không có lịch làm việc vào thời điểm này`);
      }

      // Kiểm tra xung đột lịch hẹn
      const [conflictRows] = await connection.execute(
        `SELECT CuocHenID
         FROM cuochen
         WHERE NhanVienBanHangID = ?
           AND CuocHenID != ?
           AND TrangThai IN ('DaXacNhan', 'ChoXacNhan')
           AND ABS(TIMESTAMPDIFF(MINUTE, ThoiGianHen, ?)) < 60`,
        [nhanVienBanHangIdMoi, cuocHenId, cuocHen.ThoiGianHen]
      );

      if (conflictRows.length > 0) {
        throw new Error('NVBH đã có cuộc hẹn khác trong khoảng thời gian gần (< 60 phút)');
      }

      // Gán lại cuộc hẹn
      await connection.execute(
        `UPDATE cuochen 
         SET NhanVienBanHangID = ?,
             CapNhatLuc = NOW()
         WHERE CuocHenID = ?`,
        [nhanVienBanHangIdMoi, cuocHenId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nhanVienDieuHanhId,
        HanhDong: 'GAN_LAI_CUOC_HEN',
        DoiTuong: 'CuocHen',
        DoiTuongID: cuocHenId,
        ChiTiet: JSON.stringify({
          NhanVienCu: cuocHen.NhanVienCu,
          NhanVienMoi: nhanVienBanHangIdMoi,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TieuDeTinDang: cuocHen.TieuDeTinDang
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi gán
      const [updatedRows] = await connection.execute(
        `SELECT 
          ch.*,
          nvbh.TenDayDu as TenNhanVienBanHang,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        INNER JOIN nguoidung nvbh ON ch.NhanVienBanHangID = nvbh.NguoiDungID
        INNER JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN tindang td ON p.TinDangID = td.TinDangID
        WHERE ch.CuocHenID = ?`,
        [cuocHenId]
      );

      return updatedRows[0];
    } catch (error) {
      await connection.rollback();
      console.error('[LichLamViecOperatorModel] Lỗi ganLaiCuocHen:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách NVBH có lịch rảnh trong khoảng thời gian
   * @param {string} thoiGianHen - Thời gian cần tìm NVBH (YYYY-MM-DD HH:mm:ss)
   * @param {number} [khuVucId] - ID khu vực ưu tiên
   * @returns {Promise<Array>} Danh sách NVBH khả dụng
   */
  static async layDanhSachNVBHKhaDung(thoiGianHen, khuVucId = null) {
    try {
      const params = [thoiGianHen, thoiGianHen, thoiGianHen];
      let khuVucCondition = '';

      if (khuVucId) {
        khuVucCondition = 'AND hs.KhuVucChinhID = ?';
        params.push(khuVucId);
      }

      const query = `
        SELECT 
          nd.NguoiDungID,
          nd.TenDayDu,
          nd.SoDienThoai,
          hs.MaNhanVien,
          hs.KhuVucChinhID,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          ll.LichID,
          ll.BatDau,
          ll.KetThuc,
          COUNT(ch.CuocHenID) as SoCuocHenHienTai,
          (hs.KhuVucChinhID = COALESCE(?, hs.KhuVucChinhID)) as UuTienKhuVuc
        FROM nguoidung nd
        INNER JOIN hosonhanvien hs ON nd.NguoiDungID = hs.NguoiDungID
        INNER JOIN lichlamviec ll ON nd.NguoiDungID = ll.NhanVienBanHangID
        LEFT JOIN legacy_communes lc ON hs.KhuVucChinhID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON hs.KhuVucChinhID = lp.ProvinceID
        LEFT JOIN cuochen ch ON nd.NguoiDungID = ch.NhanVienBanHangID
          AND ch.TrangThai IN ('DaXacNhan', 'ChoXacNhan')
          AND ABS(TIMESTAMPDIFF(MINUTE, ch.ThoiGianHen, ?)) < 60
         WHERE nd.TrangThai = 'HoatDong'
          AND ? BETWEEN ll.BatDau AND ll.KetThuc
          ${khuVucCondition}
        GROUP BY nd.NguoiDungID, ll.LichID
        HAVING SoCuocHenHienTai < 3
        ORDER BY UuTienKhuVuc DESC, SoCuocHenHienTai ASC
        LIMIT 20
      `;

      params.unshift(khuVucId);
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('[LichLamViecOperatorModel] Lỗi layDanhSachNVBHKhaDung:', error);
      throw new Error(`Lỗi lấy danh sách NVBH khả dụng: ${error.message}`);
    }
  }
}

module.exports = LichLamViecOperatorModel;