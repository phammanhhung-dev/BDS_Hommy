/**
 * Model cho Gợi ý Tin đăng
 * Hỗ trợ NVBH tìm kiếm tin đăng phù hợp để gợi ý cho khách hàng
 */

const db = require('../config/db');
const KhuVuc = require('./khuVucModel');

class GoiYTinDangModel {
  /**
   * Tìm kiếm tin đăng gợi ý theo bộ lọc
   * @param {Object} filters - Bộ lọc tìm kiếm
   * @param {number|Array<number>} [filters.khuVucId] - ID khu vực (có thể là parent ID hoặc array các child IDs)
   * @param {number} [filters.giaMin] - Giá tối thiểu
   * @param {number} [filters.giaMax] - Giá tối đa
   * @param {number} [filters.dienTichMin] - Diện tích tối thiểu
   * @param {number} [filters.dienTichMax] - Diện tích tối đa
   * @param {string} [filters.tienIch] - Tiện ích (comma-separated)
   * @param {number} [filters.excludeTinDangId] - Loại trừ tin đăng này (tin đăng gốc của cuộc hẹn)
   * @param {number} [filters.limit=10] - Giới hạn số lượng
   * @returns {Promise<Array>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async timKiemGoiY(filters = {}) {
    try {
      const {
        khuVucId = null,
        giaMin = null,
        giaMax = null,
        dienTichMin = null,
        dienTichMax = null,
        tienIch = null,
        excludeTinDangId = null,
        limit = 10
      } = filters;

      // Base query - chỉ lấy tin đăng đã duyệt và có phòng trống
      let query = `
        SELECT 
          td.TinDangID, 
          td.TieuDe, 
          td.MoTa,
          td.TienIch,
          td.GiaDien, 
          td.GiaNuoc, 
          td.GiaDichVu,
          da.TenDuAn,
          da.DiaChi,
          da.ViDo,
          da.KinhDo,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          COALESCE(lc.CommuneID, lp.ProvinceID) as KhuVucID,
          (
            SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
          ) as GiaThapNhat,
          (
            SELECT MAX(COALESCE(pt.GiaTinDang, p.GiaChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
          ) as GiaCaoNhat,
          (
            SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
          ) as DienTichMin,
          (
            SELECT MAX(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
          ) as DienTichMax,
          (
            SELECT COUNT(*) 
            FROM phong_tindang pt 
            JOIN phong p ON pt.PhongID = p.PhongID 
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
          ) as SoPhongTrong,
          td.URL as HinhAnhJSON,
          (
            SELECT COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong)
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
            ORDER BY pt.ThuTuHienThi ASC
            LIMIT 1
          ) as HinhAnhPhong
        FROM tindang td
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON td.KhuVucID = lp.ProvinceID
        WHERE td.TrangThai IN ('DaDang', 'DaDuyet', 'ChoDuyet')
        AND EXISTS (
          SELECT 1 FROM phong_tindang pt 
          JOIN phong p ON pt.PhongID = p.PhongID 
          WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong'
        )
      `;

      const params = [];

      // Loại trừ tin đăng gốc
      if (excludeTinDangId) {
        query += ' AND td.TinDangID != ?';
        params.push(excludeTinDangId);
      }

      // Lọc theo khu vực - hỗ trợ cả single ID và array IDs
      if (khuVucId) {
        if (Array.isArray(khuVucId) && khuVucId.length > 0) {
          // Nếu là array, filter IN (các khu vực con)
          const placeholders = khuVucId.map(() => '?').join(',');
          query += ` AND td.KhuVucID IN (${placeholders})`;
          params.push(...khuVucId);
        } else if (!Array.isArray(khuVucId)) {
          // Nếu là single ID, filter bằng
          query += ' AND td.KhuVucID = ?';
          params.push(khuVucId);
        }
      }

      // Lọc theo giá (dựa trên giá phòng trống)
      if (giaMin !== null) {
        query += ` AND EXISTS (
          SELECT 1 FROM phong_tindang pt 
          JOIN phong p ON pt.PhongID = p.PhongID 
          WHERE pt.TinDangID = td.TinDangID 
          AND p.TrangThai = 'Trong'
          AND COALESCE(pt.GiaTinDang, p.GiaChuan) >= ?
        )`;
        params.push(giaMin);
      }

      if (giaMax !== null) {
        query += ` AND EXISTS (
          SELECT 1 FROM phong_tindang pt 
          JOIN phong p ON pt.PhongID = p.PhongID 
          WHERE pt.TinDangID = td.TinDangID 
          AND p.TrangThai = 'Trong'
          AND COALESCE(pt.GiaTinDang, p.GiaChuan) <= ?
        )`;
        params.push(giaMax);
      }

      // Lọc theo diện tích
      if (dienTichMin !== null) {
        query += ` AND EXISTS (
          SELECT 1 FROM phong_tindang pt 
          JOIN phong p ON pt.PhongID = p.PhongID 
          WHERE pt.TinDangID = td.TinDangID 
          AND p.TrangThai = 'Trong'
          AND COALESCE(pt.DienTichTinDang, p.DienTichChuan) >= ?
        )`;
        params.push(dienTichMin);
      }

      if (dienTichMax !== null) {
        query += ` AND EXISTS (
          SELECT 1 FROM phong_tindang pt 
          JOIN phong p ON pt.PhongID = p.PhongID 
          WHERE pt.TinDangID = td.TinDangID 
          AND p.TrangThai = 'Trong'
          AND COALESCE(pt.DienTichTinDang, p.DienTichChuan) <= ?
        )`;
        params.push(dienTichMax);
      }

      // Lọc theo tiện ích (LIKE pattern)
      if (tienIch) {
        const tienIchList = tienIch.split(',').map(t => t.trim()).filter(Boolean);
        if (tienIchList.length > 0) {
          const tienIchConditions = tienIchList.map(() => 'td.TienIch LIKE ?');
          query += ` AND (${tienIchConditions.join(' OR ')})`;
          tienIchList.forEach(ti => params.push(`%${ti}%`));
        }
      }

      // Sắp xếp theo số phòng trống giảm dần
      query += ' ORDER BY SoPhongTrong DESC, td.CapNhatLuc DESC';
      
      // Sử dụng string interpolation an toàn cho LIMIT (tránh lỗi với prepared statement)
      const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      query += ` LIMIT ${safeLimit}`;

      console.log('[GoiYTinDangModel] Query:', query);
      console.log('[GoiYTinDangModel] Params:', params);

      const [rows] = await db.execute(query, params);

      console.log(`[GoiYTinDangModel] Found ${rows.length} listings`);

      // Xử lý hình ảnh: Parse JSON từ HinhAnhJSON hoặc dùng HinhAnhPhong
      const processedRows = rows.map(row => {
        let hinhAnh = null;
        
        // Ưu tiên lấy từ tindang.URL (JSON array)
        if (row.HinhAnhJSON) {
          try {
            const urlArray = typeof row.HinhAnhJSON === 'string' 
              ? JSON.parse(row.HinhAnhJSON) 
              : row.HinhAnhJSON;
            if (Array.isArray(urlArray) && urlArray.length > 0) {
              hinhAnh = urlArray[0]; // Lấy ảnh đầu tiên
            }
          } catch (e) {
            console.warn(`[GoiYTinDangModel] Không thể parse JSON từ HinhAnhJSON: ${row.HinhAnhJSON}`);
          }
        }
        
        // Nếu không có từ URL, dùng ảnh phòng
        if (!hinhAnh && row.HinhAnhPhong) {
          hinhAnh = row.HinhAnhPhong;
        }
        
        // Xóa các field tạm thời
        delete row.HinhAnhJSON;
        delete row.HinhAnhPhong;
        
        // Gán lại field HinhAnh
        row.HinhAnh = hinhAnh;
        
        return row;
      });

      return processedRows;
    } catch (error) {
      console.error('[GoiYTinDangModel] timKiemGoiY error:', error);
      throw new Error(`Lỗi khi tìm kiếm gợi ý tin đăng: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách phòng trống của tin đăng
   * @param {number} tinDangId - ID tin đăng
   * @returns {Promise<Array>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layDanhSachPhongTrong(tinDangId) {
    try {
      const query = `
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai,
          p.MoTaPhong,
          p.HinhAnhPhong,
          COALESCE(pt.GiaTinDang, p.GiaChuan) as Gia,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
          pt.MoTaTinDang
        FROM phong_tindang pt
        INNER JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ? AND p.TrangThai = 'Trong'
        ORDER BY Gia ASC
      `;

      const [rows] = await db.execute(query, [tinDangId]);

      console.log(`[GoiYTinDangModel] Found ${rows.length} available rooms for TinDangID ${tinDangId}`);

      return rows;
    } catch (error) {
      console.error('[GoiYTinDangModel] layDanhSachPhongTrong error:', error);
      throw new Error(`Lỗi khi lấy danh sách phòng trống: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết tin đăng cho gợi ý (bao gồm thông tin NVBH cần)
   * @param {number} tinDangId - ID tin đăng
   * @returns {Promise<Object|null>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layChiTietTinDangGoiY(tinDangId) {
    try {
      const query = `
        SELECT 
          td.TinDangID,
          td.TieuDe,
          td.MoTa,
          td.TienIch,
          td.GiaDien,
          td.GiaNuoc,
          td.GiaDichVu,
          td.MoTaGiaDichVu,
          td.URL,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.ViDo,
          da.KinhDo,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVuc,
          COALESCE(lc.CommuneID, lp.ProvinceID) as KhuVucID,
          nd.TenDayDu as TenChuDuAn,
          nd.SoDienThoai as SdtChuDuAn
        FROM tindang td
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON td.KhuVucID = lp.ProvinceID
        LEFT JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
        WHERE td.TinDangID = ? AND td.TrangThai IN ('DaDang', 'DaDuyet')
      `;

      const [rows] = await db.execute(query, [tinDangId]);

      if (rows.length === 0) {
        return null;
      }

      const tinDang = rows[0];

      // Lấy danh sách phòng trống
      tinDang.DanhSachPhongTrong = await this.layDanhSachPhongTrong(tinDangId);

      // Lấy hình ảnh từ tindang.URL (JSON array)
      // Parse JSON nếu có, nếu không thì lấy từ phòng
      let hinhAnhList = [];
      if (tinDang.URL) {
        try {
          const urlArray = typeof tinDang.URL === 'string' ? JSON.parse(tinDang.URL) : tinDang.URL;
          if (Array.isArray(urlArray) && urlArray.length > 0) {
            hinhAnhList = urlArray.slice(0, 5).map((url, index) => ({
              DuongDan: url,
              ThuTu: index + 1
            }));
          }
        } catch (e) {
          console.warn(`[GoiYTinDangModel] Không thể parse JSON từ tindang.URL: ${tinDang.URL}`);
        }
      }
      
      // Nếu không có ảnh từ URL, lấy từ phòng đầu tiên
      if (hinhAnhList.length === 0 && tinDang.DanhSachPhongTrong && tinDang.DanhSachPhongTrong.length > 0) {
        const phongDauTien = tinDang.DanhSachPhongTrong[0];
        if (phongDauTien.HinhAnhPhong) {
          hinhAnhList = [{
            DuongDan: phongDauTien.HinhAnhPhong,
            ThuTu: 1
          }];
        }
      }
      
      tinDang.HinhAnh = hinhAnhList;

      return tinDang;
    } catch (error) {
      console.error('[GoiYTinDangModel] layChiTietTinDangGoiY error:', error);
      throw new Error(`Lỗi khi lấy chi tiết tin đăng gợi ý: ${error.message}`);
    }
  }

  /**
   * Kiểm tra phòng còn trống không
   * @param {number} phongId - ID phòng
   * @returns {Promise<boolean>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async kiemTraPhongConTrong(phongId) {
    try {
      const [rows] = await db.execute(
        'SELECT PhongID FROM phong WHERE PhongID = ? AND TrangThai = ?',
        [phongId, 'Trong']
      );

      return rows.length > 0;
    } catch (error) {
      console.error('[GoiYTinDangModel] kiemTraPhongConTrong error:', error);
      throw new Error(`Lỗi khi kiểm tra phòng: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết phòng
   * @param {number} phongId - ID phòng
   * @returns {Promise<Object|null>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layChiTietPhong(phongId) {
    try {
      const query = `
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai,
          p.GiaChuan,
          p.DienTichChuan,
          p.MoTaPhong,
          p.HinhAnhPhong,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.ViDo,
          da.KinhDo
        FROM phong p
        INNER JOIN duan da ON p.DuAnID = da.DuAnID
        WHERE p.PhongID = ?
      `;

      const [rows] = await db.execute(query, [phongId]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[GoiYTinDangModel] layChiTietPhong error:', error);
      throw new Error(`Lỗi khi lấy chi tiết phòng: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách khu vực con dựa trên ParentKhuVucID
   * @param {number} parentKhuVucId - ID khu vực cha (KhuVucPhuTrachID của NVBH)
   * @returns {Promise<Array>} Danh sách khu vực con
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layDanhSachKhuVucCon(parentKhuVucId) {
    try {
      if (!parentKhuVucId) {
        return []; // Trả về mảng rỗng nếu không có parent ID
      }

      // Use centralized KhuVuc.getChildren to respect province->commune flattening logic
      const result = await KhuVuc.getChildren(parentKhuVucId);
      // KhuVuc.getChildren returns [rows, fields] or [rows, []]
      const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      console.log(`[GoiYTinDangModel] Found ${rows.length} child areas for parent ${parentKhuVucId}`);
      return rows;
    } catch (error) {
      console.error('[GoiYTinDangModel] layDanhSachKhuVucCon error:', error);
      throw new Error(`Lỗi khi lấy danh sách khu vực con: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách tất cả khu vực (cho dropdown)
   * @returns {Promise<Array>} Danh sách khu vực
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layDanhSachKhuVuc() {
    try {
      const [rows] = await db.execute(
        `SELECT ProvinceID AS KhuVucID, ProvinceName AS TenKhuVuc, NULL AS ParentKhuVucID FROM legacy_provinces
         UNION ALL
         SELECT 
           lc.CommuneID AS KhuVucID, 
           CONCAT(lc.CommuneName, IF(nNULL IS NOT NULL AND lc.CommuneName NOT LIKE CONCAT('%(', nNULL, ')%'), CONCAT(' (', nNULL, ')'), '')) AS TenKhuVuc, 
           lc.ProvinceID AS ParentKhuVucID 
         FROM legacy_communes lc
         LEFT JOIN new_districts nd ON lc.DistrictID = nd.DistrictID
         ORDER BY TenKhuVuc`
      );
      return rows;
    } catch (error) {
      console.error('[GoiYTinDangModel] layDanhSachKhuVuc error:', error);
      throw new Error(`Lỗi khi lấy danh sách khu vực: ${error.message}`);
    }
  }
}

module.exports = GoiYTinDangModel;
