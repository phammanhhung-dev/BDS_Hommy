/**
 * Model cho Báo cáo Thu nhập (UC-SALE-06)
 * Xử lý thống kê và tính toán hoa hồng cho Nhân viên Bán hàng
 */

const db = require('../config/db');

class BaoCaoThuNhapModel {
  /**
   * Lấy thống kê cuộc hẹn theo trạng thái
   * @param {number} nhanVienId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Object>}
   */
  static async layThongKeCuocHen(nhanVienId, filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as tongCuocHen,
          COUNT(CASE WHEN TrangThai = 'DaXacNhan' THEN 1 END) as daXacNhan,
          COUNT(CASE WHEN TrangThai = 'HoanThanh' THEN 1 END) as hoanThanh,
          COUNT(CASE WHEN TrangThai IN ('HuyBoiKhach', 'KhachKhongDen', 'HuyBoiHeThong') THEN 1 END) as daHuy,
          COUNT(CASE WHEN TrangThai = 'ChoXacNhan' THEN 1 END) as choXacNhan
        FROM cuochen
        WHERE NhanVienBanHangID = ?
      `;
      
      const params = [nhanVienId];
      
      if (filters.tuNgay && filters.denNgay) {
        query += ' AND ThoiGianHen BETWEEN ? AND ?';
        params.push(filters.tuNgay, filters.denNgay);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê giao dịch
   * @param {number} nhanVienId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Object>}
   */
  static async layThongKeGiaoDich(nhanVienId, filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(gd.GiaoDichID) as soGiaoDich,
          COALESCE(SUM(gd.SoTien), 0) as tongGiaTri,
          COUNT(CASE WHEN gd.TrangThai = 'DaGhiNhan' THEN 1 END) as daXacNhan,
          COUNT(CASE WHEN gd.TrangThai = 'DaUyQuyen' THEN 1 END) as choXacNhan
        FROM giaodich gd
        WHERE gd.GiaoDichID IN (
          SELECT DISTINCT c.GiaoDichID
          FROM coc c
          LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
          LEFT JOIN cuochen ch ON (c.TinDangID = ch.TinDangID AND c.PhongID = ch.PhongID)
          WHERE (hd.NhanVienBanHangID = ? OR ch.NhanVienBanHangID = ?)
        )
        AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
      `;
      
      const params = [nhanVienId, nhanVienId];
      
      if (filters.tuNgay && filters.denNgay) {
        query += ' AND gd.ThoiGian BETWEEN ? AND ?';
        params.push(filters.tuNgay, filters.denNgay);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê giao dịch: ${error.message}`);
    }
  }

  /**
   * Tính hoa hồng chi tiết theo kỳ
   * @param {number} nhanVienId 
   * @param {Object} kyThanhToan {tuNgay, denNgay}
   * @returns {Promise<Object>}
   */
  static async tinhHoaHong(nhanVienId, kyThanhToan) {
    try {
      // Lấy tỷ lệ hoa hồng
      const [hoSo] = await db.execute(
        'SELECT TyLeHoaHong FROM hosonhanvien WHERE NguoiDungID = ?',
        [nhanVienId]
      );
      
      const tyLeHoaHong = hoSo.length > 0 ? (hoSo[0].TyLeHoaHong || 0) : 0;
      
      // Lấy chi tiết các giao dịch tạo hoa hồng
      const [chiTiet] = await db.execute(`
        SELECT 
          gd.GiaoDichID,
          gd.SoTien,
          gd.Loai,
          gd.ThoiGian,
          MAX(ch.CuocHenID) as CuocHenID,
          MAX(ch.ThoiGianHen) as ThoiGianHen,
          MAX(kh.TenDayDu) as TenKhachHang,
          MAX(td.TieuDe) as TieuDeTinDang,
          (gd.SoTien * ? / 100) as HoaHong
        FROM giaodich gd
        INNER JOIN vi v ON gd.ViID = v.ViID
        LEFT JOIN nguoidung kh ON v.NguoiDungID = kh.NguoiDungID
        LEFT JOIN coc c ON gd.GiaoDichID = c.GiaoDichID
        LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
        LEFT JOIN cuochen ch ON (c.TinDangID = ch.TinDangID AND c.PhongID = ch.PhongID)
        LEFT JOIN tindang td ON gd.TinDangLienQuanID = td.TinDangID
        WHERE (hd.NhanVienBanHangID = ? OR ch.NhanVienBanHangID = ?)
        AND gd.TrangThai = 'DaGhiNhan'
        AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
        AND gd.ThoiGian BETWEEN ? AND ?
        GROUP BY gd.GiaoDichID, gd.SoTien, gd.Loai, gd.ThoiGian
        ORDER BY gd.ThoiGian DESC
      `, [tyLeHoaHong, nhanVienId, nhanVienId, kyThanhToan.tuNgay, kyThanhToan.denNgay]);
      
      // Tính tổng
      const tongHoaHong = chiTiet.reduce((sum, item) => sum + parseFloat(item.HoaHong), 0);
      const tongGiaTri = chiTiet.reduce((sum, item) => sum + parseFloat(item.SoTien), 0);
      
      return {
        tyLeHoaHong,
        soGiaoDich: chiTiet.length,
        tongGiaTri,
        tongHoaHong,
        hoaHongTrungBinh: chiTiet.length > 0 ? (tongHoaHong / chiTiet.length).toFixed(2) : 0,
        chiTiet
      };
    } catch (error) {
      throw new Error(`Lỗi tính hoa hồng: ${error.message}`);
    }
  }

  /**
   * Lấy cuộc hẹn theo tuần (cho chart)
   * @param {number} nhanVienId 
   * @param {number} soTuan Số tuần lấy về (mặc định 4)
   * @returns {Promise<Array>}
   */
  static async layCuocHenTheoTuan(nhanVienId, soTuan = 4) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          YEARWEEK(ThoiGianHen) as Tuan,
          DATE(DATE_SUB(ThoiGianHen, INTERVAL WEEKDAY(ThoiGianHen) DAY)) as TuanBatDau,
          COUNT(*) as SoCuocHen,
          COUNT(CASE WHEN TrangThai = 'HoanThanh' THEN 1 END) as HoanThanh,
          COUNT(CASE WHEN TrangThai IN ('HuyBoiKhach', 'KhachKhongDen', 'HuyBoiHeThong') THEN 1 END) as Huy
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND ThoiGianHen >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
        GROUP BY YEARWEEK(ThoiGianHen), DATE(DATE_SUB(ThoiGianHen, INTERVAL WEEKDAY(ThoiGianHen) DAY))
        ORDER BY Tuan ASC
      `, [nhanVienId, soTuan]);
      
      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy cuộc hẹn theo tuần: ${error.message}`);
    }
  }

  /**
   * Lấy top khách hàng (theo số cuộc hẹn/giao dịch)
   * @param {number} nhanVienId 
   * @param {Object} filters {tuNgay, denNgay, limit}
   * @returns {Promise<Array>}
   */
  static async layTopKhachHang(nhanVienId, filters = {}) {
    try {
      let query = `
        SELECT 
          kh.NguoiDungID,
          kh.TenDayDu,
          kh.SoDienThoai,
          COUNT(DISTINCT ch.CuocHenID) as SoCuocHen,
          COALESCE(gd.SoGiaoDich, 0) as SoGiaoDich,
          COALESCE(gd.TongGiaTri, 0) as TongGiaTri
        FROM nguoidung kh
        INNER JOIN cuochen ch ON kh.NguoiDungID = ch.KhachHangID
        LEFT JOIN (
          SELECT 
            v.NguoiDungID as KhachHangID,
            COUNT(DISTINCT gd.GiaoDichID) as SoGiaoDich,
            SUM(gd.SoTien) as TongGiaTri
          FROM giaodich gd
          INNER JOIN vi v ON gd.ViID = v.ViID
          INNER JOIN coc c ON gd.GiaoDichID = c.GiaoDichID
          LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
          LEFT JOIN cuochen ch ON (c.TinDangID = ch.TinDangID AND c.PhongID = ch.PhongID)
          WHERE (hd.NhanVienBanHangID = ? OR ch.NhanVienBanHangID = ?)
          AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
          GROUP BY v.NguoiDungID
        ) gd ON kh.NguoiDungID = gd.KhachHangID
        WHERE ch.NhanVienBanHangID = ?
      `;
      
      const params = [nhanVienId, nhanVienId, nhanVienId];
      
      if (filters.tuNgay && filters.denNgay) {
        query += ' AND ch.ThoiGianHen BETWEEN ? AND ?';
        params.push(filters.tuNgay, filters.denNgay);
      }
      
      query += ` 
        GROUP BY kh.NguoiDungID, kh.TenDayDu, kh.SoDienThoai, gd.SoGiaoDich, gd.TongGiaTri
        ORDER BY SoGiaoDich DESC, SoCuocHen DESC
        LIMIT ?
      `;
      params.push(filters.limit || 10);
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy top khách hàng: ${error.message}`);
    }
  }

  /**
   * Lấy hiệu suất 7 ngày gần nhất (cho dashboard chart)
   * @param {number} nhanVienId 
   * @returns {Promise<Array>}
   */
  static async layHieuSuat7Ngay(nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          DATE(ThoiGianHen) as Ngay,
          COUNT(*) as TongCuocHen,
          COUNT(CASE WHEN TrangThai = 'HoanThanh' THEN 1 END) as HoanThanh,
          COUNT(CASE WHEN TrangThai = 'DaXacNhan' THEN 1 END) as DaXacNhan
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND ThoiGianHen >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(ThoiGianHen)
        ORDER BY Ngay ASC
      `, [nhanVienId]);
      
      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy hiệu suất 7 ngày: ${error.message}`);
    }
  }
}

module.exports = BaoCaoThuNhapModel;








