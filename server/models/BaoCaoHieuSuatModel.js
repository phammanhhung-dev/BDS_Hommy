/**
 * Model cho Báo cáo Hiệu suất
 * Quản lý các nghiệp vụ liên quan đến báo cáo và thống kê
 * Tách từ ChuDuAnModel.js theo domain-driven design
 */

const db = require('../config/db');

class BaoCaoHieuSuatModel {
  /**
   * Lấy báo cáo hiệu suất tin đăng
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {Object} filters Bộ lọc thời gian
   * @returns {Promise<Object>}
   */
  static async layBaoCaoHieuSuat(chuDuAnId, filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      let dateFilter = '';
      const params = [chuDuAnId];
      
      if (tuNgay && denNgay) {
        dateFilter = 'AND td.TaoLuc BETWEEN ? AND ?';
        params.push(tuNgay, denNgay);
      }

      // Thống kê tổng quan
      const [tongQuanRows] = await db.execute(`
        SELECT 
          COUNT(*) as TongTinDang,
          COUNT(CASE WHEN td.TrangThai = 'DaDang' THEN 1 END) as TinDangDaDang,
          COUNT(CASE WHEN td.TrangThai = 'ChoDuyet' THEN 1 END) as TinDangChoDuyet,
          COUNT(CASE WHEN td.TrangThai = 'Nhap' THEN 1 END) as TinDangNhap,
          COUNT(CASE WHEN td.TrangThai = 'TamNgung' THEN 1 END) as TinDangTamNgung,
          COUNT(CASE WHEN td.TrangThai = 'TuChoi' THEN 1 END) as TinDangTuChoi,
          COUNT(CASE WHEN td.TrangThai = 'DaDuyet' THEN 1 END) as TinDangDaDuyet,
          AVG(
            (
              SELECT AVG(COALESCE(pt.GiaTinDang, p.GiaChuan))
              FROM phong_tindang pt
              JOIN phong p ON pt.PhongID = p.PhongID
              WHERE pt.TinDangID = td.TinDangID
            )
          ) as GiaTrungBinh,
          SUM(
            (
              SELECT SUM(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
              FROM phong_tindang pt
              JOIN phong p ON pt.PhongID = p.PhongID
              WHERE pt.TinDangID = td.TinDangID
            )
          ) as TongDienTich
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.ChuDuAnID = ?
        AND td.TrangThai != 'LuuTru' ${dateFilter}
      `, params);

      // Thống kê cuộc hẹn
      const [cuocHenRows] = await db.execute(`
        SELECT 
          COUNT(*) as TongCuocHen,
          COUNT(CASE WHEN ch.TrangThai = 'DaXacNhan' THEN 1 END) as CuocHenDaXacNhan,
          COUNT(CASE WHEN ch.TrangThai = 'HoanThanh' THEN 1 END) as CuocHenHoanThanh,
          COUNT(CASE WHEN ch.TrangThai IN ('HuyBoiKhach', 'KhachKhongDen') THEN 1 END) as CuocHenHuy
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
        INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.ChuDuAnID = ? ${dateFilter}
      `, params);

      // Thống kê cọc
      const [cocRows] = await db.execute(`
        SELECT 
          COUNT(*) as TongGiaoDichCoc,
          SUM(CASE WHEN c.TrangThai = 'DaThanhToan' THEN c.SoTien ELSE 0 END) as TongTienCoc,
          SUM(
            CASE 
              WHEN c.TrangThai = 'DaThanhToan' 
                AND MONTH(c.TaoLuc) = MONTH(CURRENT_DATE())
                AND YEAR(c.TaoLuc) = YEAR(CURRENT_DATE()) 
              THEN c.SoTien 
              ELSE 0 
            END
          ) as TongTienCocThangNay,
          COUNT(CASE WHEN c.Loai = 'CocGiuCho' THEN 1 END) as CocGiuCho,
          COUNT(CASE WHEN c.Loai = 'CocAnNinh' THEN 1 END) as CocAnNinh
        FROM coc c
        INNER JOIN phong p ON c.PhongID = p.PhongID
        INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
        INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.ChuDuAnID = ? ${dateFilter}
      `, params);

      const [tuongTacRows] = await db.execute(`
        SELECT
          SUM(tktd.SoLuotXem) as TongLuotXem,
          SUM(tktd.SoYeuThich) as TongYeuThich,
          SUM(CASE WHEN tktd.Ky = CURRENT_DATE THEN tktd.SoLuotXem ELSE 0 END) as LuotXemHomNay,
          SUM(CASE WHEN tktd.Ky = CURRENT_DATE THEN tktd.SoYeuThich ELSE 0 END) as YeuThichHomNay
        FROM thongketindang tktd
        INNER JOIN tindang td ON tktd.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.ChuDuAnID = ?
        ${tuNgay && denNgay ? 'AND tktd.Ky BETWEEN ? AND ?' : ''}
      `, params);

      return {
        tongQuan: tongQuanRows[0] || {},
        cuocHen: cuocHenRows[0] || {},
        coc: cocRows[0] || {},
        tuongTac: tuongTacRows[0] || {},
        thoiGianBaoCao: {
          tuNgay: tuNgay || null,
          denNgay: denNgay || null,
          taoLuc: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy báo cáo hiệu suất: ${error.message}`);
    }
  }

  /**
   * Lấy doanh thu theo tháng (6 tháng gần nhất)
   * Sử dụng cho: Biểu đồ Line Chart trong Báo cáo
   * @param {number} chuDuAnId ID của chủ dự án
   * @returns {Promise<Array>} Array of {Thang, TongTien, SoGiaoDich, SoPhong}
   */
  static async layDoanhThuTheoThang(chuDuAnId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          DATE_FORMAT(c.TaoLuc, '%Y-%m') as Thang,
          SUM(c.SoTien) as TongTien,
          COUNT(DISTINCT c.CocID) as SoGiaoDich,
          COUNT(DISTINCT c.PhongID) as SoPhong
        FROM coc c
        INNER JOIN phong p ON c.PhongID = p.PhongID
        INNER JOIN duan d ON p.DuAnID = d.DuAnID
        WHERE d.ChuDuAnID = ?
          AND c.TrangThai = 'DaThanhToan'
          AND c.TaoLuc >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(c.TaoLuc, '%Y-%m')
        ORDER BY Thang ASC
      `, [chuDuAnId]);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy doanh thu theo tháng: ${error.message}`);
    }
  }

  /**
   * Lấy Top 5 tin đăng hiệu quả nhất (theo lượt xem)
   * Sử dụng cho: Bar Chart trong Báo cáo
   * @param {number} chuDuAnId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Array>}
   */
  static async layTopTinDang(chuDuAnId, filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      const params = [];
      let tkDateFilter = '';
      let chDateFilter = '';

      // Build WHERE clause cho thongketindang
      if (tuNgay && denNgay) {
        tkDateFilter = 'AND tk.Ky BETWEEN ? AND ?';
        chDateFilter = 'AND ch.TaoLuc BETWEEN ? AND ?';
      }

      // Build params array theo đúng thứ tự trong query
      if (tuNgay && denNgay) {
        params.push(tuNgay, denNgay, tuNgay, denNgay);
      }
      params.push(chuDuAnId);

      const [rows] = await db.execute(`
        SELECT 
          td.TinDangID,
          td.TieuDe,
          COALESCE(MIN(p.GiaChuan), 0) as Gia,
          COALESCE(SUM(tk.SoLuotXem), 0) as LuotXem,
          COALESCE(SUM(tk.SoYeuThich), 0) as LuotYeuThich,
          COUNT(DISTINCT ch.CuocHenID) as SoCuocHen
        FROM tindang td
        LEFT JOIN duan d ON td.DuAnID = d.DuAnID
        LEFT JOIN thongketindang tk ON td.TinDangID = tk.TinDangID ${tkDateFilter}
        LEFT JOIN phong_tindang pt ON td.TinDangID = pt.TinDangID
        LEFT JOIN phong p ON pt.PhongID = p.PhongID
        LEFT JOIN cuochen ch ON p.PhongID = ch.PhongID ${chDateFilter}
        WHERE td.ChuDuAnID = ?
          AND td.TrangThai IN ('DaDang', 'DaDuyet')
        GROUP BY td.TinDangID, td.TieuDe
        ORDER BY LuotXem DESC
        LIMIT 5
      `, params);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy top tin đăng: ${error.message}`);
    }
  }

  /**
   * Lấy Conversion Rate (Tỷ lệ chuyển đổi từ cuộc hẹn → hoàn thành)
   * @param {number} chuDuAnId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Object>}
   */
  static async layConversionRate(chuDuAnId, filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      const params = [];
      let dateFilter = '';

      if (tuNgay && denNgay) {
        dateFilter = 'AND ch.TaoLuc BETWEEN ? AND ?';
        params.push(chuDuAnId, tuNgay, denNgay);
      } else {
        params.push(chuDuAnId);
      }

      const [rows] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ch.CuocHenID) as tongCuocHen,
          COUNT(DISTINCT CASE WHEN ch.TrangThai = 'HoanThanh' THEN ch.CuocHenID END) as cuocHenHoanThanh,
          COALESCE(SUM(tk.SoLuotXem), 0) as tongLuotXem,
          ROUND(
            COUNT(DISTINCT CASE WHEN ch.TrangThai = 'HoanThanh' THEN ch.CuocHenID END) * 100.0 
            / NULLIF(COUNT(DISTINCT ch.CuocHenID), 0), 
            2
          ) as tyLeChuyenDoi
        FROM duan d
        LEFT JOIN phong p ON d.DuAnID = p.DuAnID
        LEFT JOIN cuochen ch ON p.PhongID = ch.PhongID ${dateFilter}
        LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
        LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID
        LEFT JOIN thongketindang tk ON td.TinDangID = tk.TinDangID
        WHERE d.ChuDuAnID = ?
      `, params);

      return rows[0] || { tongCuocHen: 0, cuocHenHoanThanh: 0, tongLuotXem: 0, tyLeChuyenDoi: 0 };
    } catch (error) {
      throw new Error(`Lỗi lấy conversion rate: ${error.message}`);
    }
  }

  /**
   * Lấy lượt xem theo giờ (Heatmap data)
   * @param {number} chuDuAnId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Array>}
   */
  static async layLuotXemTheoGio(chuDuAnId, filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      let dateFilter = '';
      const params = [chuDuAnId];

      if (tuNgay && denNgay) {
        dateFilter = 'AND tk.Ky BETWEEN ? AND ?';
        params.push(tuNgay, denNgay);
      }

      const [rows] = await db.execute(`
        SELECT 
          HOUR(tk.Ky) as Gio,
          SUM(tk.SoLuotXem) as LuotXem
        FROM thongketindang tk
        INNER JOIN tindang td ON tk.TinDangID = td.TinDangID
        LEFT JOIN duan d ON td.DuAnID = d.DuAnID
        WHERE td.ChuDuAnID = ? ${dateFilter}
        GROUP BY HOUR(tk.Ky)
        ORDER BY Gio ASC
      `, params);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy lượt xem theo giờ: ${error.message}`);
    }
  }

  /**
   * Lấy báo cáo hiệu suất ENHANCED với tất cả metrics cần thiết
   * Kết hợp các method trên để trả về đầy đủ data cho Báo cáo page
   * @param {number} chuDuAnId 
   * @param {Object} filters {tuNgay, denNgay}
   * @returns {Promise<Object>}
   */
  static async layBaoCaoHieuSuatChiTiet(chuDuAnId, filters = {}) {
    try {
      // Gọi song song tất cả queries để tối ưu performance
      const [
        tongQuan,
        doanhThuTheoThang,
        topTinDang,
        conversionRate,
        luotXemTheoGio
      ] = await Promise.all([
        this.layBaoCaoHieuSuat(chuDuAnId, filters), // Method cũ cho tổng quan
        this.layDoanhThuTheoThang(chuDuAnId),
        this.layTopTinDang(chuDuAnId, filters),
        this.layConversionRate(chuDuAnId, filters),
        this.layLuotXemTheoGio(chuDuAnId, filters)
      ]);

      // Import DuAnModel để lấy thống kê phòng
      const DuAnModel = require('./DuAnModel');
      const thongKePhong = await DuAnModel.layThongKePhong(chuDuAnId);

      return {
        // Tổng quan (từ method cũ)
        tongQuan: tongQuan.tongQuan,
        cuocHen: tongQuan.cuocHen,
        coc: tongQuan.coc,
        tuongTac: tongQuan.tuongTac,
        
        // Thống kê phòng
        thongKePhong,
        
        // Advanced analytics (methods mới)
        doanhThuTheoThang,
        topTinDang,
        conversionRate,
        luotXemTheoGio,
        
        // Metadata
        thoiGianBaoCao: {
          tuNgay: filters.tuNgay || null,
          denNgay: filters.denNgay || null,
          taoLuc: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy báo cáo chi tiết: ${error.message}`);
    }
  }
}

module.exports = BaoCaoHieuSuatModel;























































