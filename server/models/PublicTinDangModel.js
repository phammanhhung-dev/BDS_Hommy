const db = require("../config/db");

class PublicTinDangModel {
  /**
   * Lấy danh sách tin đăng công khai cho trang chủ
   * 
   * Điều kiện hiển thị:
   * - Trạng thái không phải 'LuuTru'
   * - Trạng thái phải là 'DaDuyet' hoặc 'DaDang' (đã duyệt hoặc đã đăng)
   * - Phải có ít nhất 1 phòng trống (TrangThai = 'Trong')
   * 
   * @param {Object} filters - Bộ lọc tìm kiếm
   * @param {string} [filters.trangThai] - Lọc theo trạng thái cụ thể (không khuyến khích dùng, vì đã filter mặc định)
   * @param {number} [filters.duAnId] - Lọc theo dự án
   * @param {string} [filters.loaiGiaoDich] - Lọc theo loại giao dịch ('Ban' hoặc 'Thue')
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm (tiêu đề, mô tả)
   * @param {number} [filters.khuVucId] - Lọc theo khu vực (bao gồm cả children)
   * @param {string} [filters.diaChi] - Tìm kiếm theo địa chỉ
   * @param {number} [filters.limit] - Giới hạn số lượng kết quả
   * @returns {Promise<Array>} Danh sách tin đăng công khai
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layTatCaTinDang(filters = {}) {
    try {
      let query = `
        SELECT
          td.TinDangID,
          td.TieuDe, td.URL, td.MoTa,
          td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
          td.LoaiGiaoDich, td.LoaiBDS, td.GiaTien, td.DienTichDat, td.DienTichSuDung,
          td.SoTang, td.SoPhongNgu, td.SoPhongTam, td.Huong, td.PhapLy, td.NamXayDung, td.NoiThat,
          CASE
            WHEN td.LoaiGiaoDich = 'Ban' THEN td.GiaTien
            ELSE (
              CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
                ) THEN td.GiaTien
                ELSE (
                  SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
                  FROM phong_tindang pt
                  JOIN phong p ON pt.PhongID = p.PhongID
                  WHERE pt.TinDangID = td.TinDangID
                )
              END
            )
          END as Gia,
          CASE
            WHEN td.LoaiGiaoDich = 'Ban' THEN
              CASE
                WHEN td.LoaiBDS IN ('BanDat', 'DatNen', 'DatO', 'DatNongNghiep', 'NhaO', 'NhaPho', 'NhaLienKe', 'BietThu', 'Shophouse', 'MatBang', 'KhoXuong', 'CuaHangKiOt') THEN td.DienTichDat
                ELSE td.DienTichSuDung
              END
            ELSE (
              CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
                ) THEN
                  CASE
                    WHEN td.LoaiBDS IN ('BanDat', 'DatNen', 'DatO', 'DatNongNghiep', 'NhaO', 'NhaPho', 'NhaLienKe', 'BietThu', 'Shophouse', 'MatBang', 'KhoXuong', 'CuaHangKiOt') THEN td.DienTichDat
                    ELSE td.DienTichSuDung
                  END
                ELSE (
                  SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
                  FROM phong_tindang pt
                  JOIN phong p ON pt.PhongID = p.PhongID
                  WHERE pt.TinDangID = td.TinDangID
                )
              END
            )
          END as DienTich,
          td.TaoLuc, td.CapNhatLuc,
          da.TenDuAn,
          da.ViDo AS ViDo,
          da.KinhDo AS KinhDo,
          COALESCE(da.DiaChi, kv.TenKhuVuc) AS DiaChi,
          kv.TenKhuVuc AS TenKhuVuc,
          NULL AS TenTinh,
          NULL AS TenQuanHuyen,
          (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong,
          (SELECT COUNT(*) FROM phong_tindang pt
             JOIN phong p ON pt.PhongID = p.PhongID
             WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong') as SoPhongTrong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        WHERE td.TrangThai != 'LuuTru'
          AND td.TrangThai IN ('DaDuyet', 'DaDang')
          AND (td.NgayHetHan IS NULL OR td.NgayHetHan >= CURDATE())
          AND (
            td.LoaiGiaoDich = 'Ban'
            OR (
              td.LoaiGiaoDich = 'Thue'
              AND NOT EXISTS (
                SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
              )
            )
            OR (
              td.LoaiGiaoDich = 'Thue'
              AND EXISTS (
                SELECT 1
                FROM phong_tindang pt
                JOIN phong p ON pt.PhongID = p.PhongID
                WHERE pt.TinDangID = td.TinDangID
                  AND p.TrangThai = 'Trong'
              )
            )
          )
      `;
      const params = [];

      if (filters.trangThai) {
        query += " AND td.TrangThai = ?";
        params.push(filters.trangThai);
      }

      if (filters.duAnId) {
        query += " AND td.DuAnID = ?";
        params.push(filters.duAnId);
      }

      if (filters.loaiGiaoDich) {
        query += " AND td.LoaiGiaoDich = ?";
        params.push(filters.loaiGiaoDich);
      }

      if (filters.loaiBDS) {
        query += " AND td.LoaiBDS = ?";
        params.push(filters.loaiBDS);
      }

      if (filters.quanHuyen) {
        query += " AND (d.DistrictName LIKE ? OR da.DiaChi LIKE ?)";
        params.push(`%${filters.quanHuyen}%`, `%${filters.quanHuyen}%`);
      }

      if (filters.minGia) {
        const minGiaNum = parseFloat(filters.minGia);
        if (!isNaN(minGiaNum)) {
          query += " AND td.GiaTien >= ?";
          params.push(minGiaNum);
        }
      }

      if (filters.maxGia) {
        const maxGiaNum = parseFloat(filters.maxGia);
        if (!isNaN(maxGiaNum)) {
          query += " AND td.GiaTien <= ?";
          params.push(maxGiaNum);
        }
      }

      if (filters.minDienTich) {
        const minAreaNum = parseFloat(filters.minDienTich);
        if (!isNaN(minAreaNum)) {
          query += " AND td.DienTichSuDung >= ?";
          params.push(minAreaNum);
        }
      }

      if (filters.maxDienTich) {
        const maxAreaNum = parseFloat(filters.maxDienTich);
        if (!isNaN(maxAreaNum)) {
          query += " AND td.DienTichSuDung <= ?";
          params.push(maxAreaNum);
        }
      }

      if (filters.keyword) {
        query += " AND (td.TieuDe LIKE ? OR td.MoTa LIKE ? OR da.TenDuAn LIKE ?)";
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      // Filter theo KhuVucID (bao gồm cả children nếu có)
      if (filters.khuVucId) {
        const khuVucId = Number.parseInt(filters.khuVucId, 10);
        if (!isNaN(khuVucId) && khuVucId > 0) {
          try {
            // Lấy province và tất cả commune trực thuộc province được chọn
            const [childRows] = await db.execute(
              `SELECT ? AS LocationID
               UNION ALL
               SELECT CommuneID AS LocationID FROM new_communes WHERE ProvinceID = ?`,
              [khuVucId, khuVucId]
            );
            
            const khuVucIds = childRows.map((r) => r.LocationID);

            if (khuVucIds.length > 0) {
              const placeholders = khuVucIds.map(() => "?").join(",");
              query += ` AND td.KhuVucID IN (${placeholders})`;
              params.push(...khuVucIds);
            } else {
              // Fallback: chỉ tìm chính xác KhuVucID đó
              query += " AND td.KhuVucID = ?";
              params.push(khuVucId);
            }
          } catch (recursiveError) {
            // Nếu CTE không được hỗ trợ, fallback về cách đơn giản
            query += " AND td.KhuVucID = ?";
            params.push(khuVucId);
          }
        }
      }

      // Filter theo địa chỉ (fallback - tìm kiếm theo tên khu vực)
      if (filters.diaChi) {
        query += " AND (da.DiaChi LIKE ? OR kv.TenKhuVuc LIKE ?)";
        params.push(`%${filters.diaChi}%`, `%${filters.diaChi}%`);
      }

      query += " ORDER BY td.CapNhatLuc DESC";

      if (filters.limit) {
        const limitNum = Number.parseInt(filters.limit, 10) || 50;
        query += ` LIMIT ${limitNum}`;
      }

      const [rows] = await db.execute(query, params);

      const TinDangDataService = require('../services/TinDangDataService');

      // Parse quận huyện fallback & Enrich chỉ số kinh tế m² cho từng tin đăng
      rows.forEach(tinDang => {
        if (!tinDang.TenQuanHuyen && (tinDang.DiaChi || tinDang.MoTa || tinDang.TieuDe)) {
          const addressText = `${tinDang.DiaChi || ""} ${tinDang.MoTa || ""} ${tinDang.TieuDe || ""}`.toLowerCase();
          const districts = ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Gò Vấp", "Quận 12", "Bình Chánh"];
          for (const dist of districts) {
            if (addressText.includes(dist.toLowerCase()) || 
                (dist === "Bình Thạnh" && addressText.includes("binh thanh")) ||
                (dist === "Gò Vấp" && addressText.includes("go vap")) ||
                (dist === "Bình Chánh" && addressText.includes("binh chanh"))) {
              tinDang.TenQuanHuyen = dist;
              break;
            }
          }
        }

        // Tự động tính chỉ số kinh tế m² kiểu Batdongsan.com.vn
        const unitPriceM2 = TinDangDataService.tinhGiaTrenM2(tinDang.Gia || tinDang.GiaTien, tinDang.DienTich || tinDang.DienTichSuDung);
        tinDang.GiaTienTrenM2 = unitPriceM2;
        if (unitPriceM2) {
          tinDang.GiaTienTrenM2Formatted = (unitPriceM2 / 1000000).toFixed(1) + " triệu/m²";
        } else {
          tinDang.GiaTienTrenM2Formatted = null;
        }

        // Tính điểm ưu tiên hiển thị (Ranking score)
        tinDang.RankingScore = TinDangDataService.tinhDiemUuTienSearch(
          tinDang.GoiTin || 'normal',
          tinDang.TaoLuc,
          Boolean(tinDang.URL),
          false
        );
      });

      return rows;
    } catch (err) {
      throw new Error(
        `Lỗi khi lấy danh sách tin đăng công khai: ${err.message}`
      );
    }
  }

  /**
   * Lấy chi tiết tin đăng công khai (bao gồm danh sách phòng)
   * 
   * Điều kiện hiển thị:
   * - Trạng thái không phải 'LuuTru'
   * - Trạng thái phải là 'DaDuyet' hoặc 'DaDang' (đã duyệt hoặc đã đăng)
   * - Phải có ít nhất 1 phòng trống (TrangThai = 'Trong')
   * 
   * @param {number} tinDangId - ID tin đăng
   * @returns {Promise<Object|null>} Chi tiết tin đăng hoặc null nếu không tìm thấy
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layChiTietTinDang(tinDangId) {
    try {
      // Query chi tiết tin đăng
      const queryTinDang = `
      SELECT
        td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID, td.ChuDuAnID,
        td.TieuDe, td.URL, td.MoTa,
        td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
        td.LoaiGiaoDich, td.LoaiBDS, td.GiaTien, td.DienTichDat, td.DienTichSuDung,
        td.SoTang, td.SoPhongNgu, td.SoPhongTam, td.Huong, td.PhapLy, td.NamXayDung, td.NoiThat,
        td.TrangThai, td.TaoLuc, td.CapNhatLuc, td.DuyetLuc,td.KhuVucID,
        da.TenDuAn,
        COALESCE(da.DiaChi, kv.TenKhuVuc) AS DiaChi,
        da.DiaChi AS DiaChiDuAn, da.YeuCauPheDuyetChu,
        da.ViDo, da.KinhDo,
        da.SoThangCocToiThieu,
        kv.TenKhuVuc AS TenKhuVuc,
        NULL AS TenTinh,
        NULL AS TenQuanHuyen,
        (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong,
        CASE
          WHEN td.LoaiGiaoDich = 'Ban' THEN td.GiaTien
          ELSE (
            CASE
              WHEN NOT EXISTS (
                SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
              ) THEN td.GiaTien
              ELSE (
                SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
                FROM phong_tindang pt
                JOIN phong p ON pt.PhongID = p.PhongID
                WHERE pt.TinDangID = td.TinDangID
              )
            END
          )
        END as Gia,
        CASE
          WHEN td.LoaiGiaoDich = 'Ban' THEN td.DienTichDat
          ELSE (
            CASE
              WHEN NOT EXISTS (
                SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
              ) THEN td.DienTichDat
              ELSE (
                SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
                FROM phong_tindang pt
                JOIN phong p ON pt.PhongID = p.PhongID
                WHERE pt.TinDangID = td.TinDangID
              )
            END
          )
        END as DienTich
      FROM tindang td
      LEFT JOIN duan da ON td.DuAnID = da.DuAnID
      LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
      WHERE td.TinDangID = ?
        AND td.TrangThai != 'LuuTru'
        AND td.TrangThai IN ('DaDuyet', 'DaDang')
        AND (
          td.LoaiGiaoDich = 'Ban'
          OR (
            td.LoaiGiaoDich = 'Thue'
            AND NOT EXISTS (
              SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
            )
          )
          OR (
            td.LoaiGiaoDich = 'Thue'
            AND EXISTS (
              SELECT 1
              FROM phong_tindang pt
              JOIN phong p ON pt.PhongID = p.PhongID
              WHERE pt.TinDangID = td.TinDangID
                AND p.TrangThai = 'Trong'
            )
          )
        )
    `;

      const [rows] = await db.execute(queryTinDang, [tinDangId]);

      if (rows.length === 0) {
        return null;
      }

      const tinDang = rows[0];

      // Parse quận huyện fallback từ địa chỉ nếu TenQuanHuyen bị null
      if (!tinDang.TenQuanHuyen && (tinDang.DiaChi || tinDang.MoTa || tinDang.TieuDe)) {
        const addressText = `${tinDang.DiaChi || ""} ${tinDang.MoTa || ""} ${tinDang.TieuDe || ""}`.toLowerCase();
        const districts = ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Gò Vấp", "Quận 12", "Bình Chánh"];
        for (const dist of districts) {
          if (addressText.includes(dist.toLowerCase()) || 
              (dist === "Bình Thạnh" && addressText.includes("binh thanh")) ||
              (dist === "Gò Vấp" && addressText.includes("go vap")) ||
              (dist === "Bình Chánh" && addressText.includes("binh chanh"))) {
            tinDang.TenQuanHuyen = dist;
            break;
          }
        }
      }

      // Query danh sách phòng (chỉ cho tin thuê)
      if (tinDang.LoaiGiaoDich === 'Thue') {
        // Kiểm tra xem tin này có trong phong_tindang không
        const [phongMapping] = await db.execute(
          'SELECT COUNT(*) as count FROM phong_tindang WHERE TinDangID = ?',
          [tinDangId]
        );

        // Chỉ query danh sách phòng nếu có mapping phong_tindang
        if (phongMapping[0].count > 0) {
          const queryPhong = `
            SELECT
              p.PhongID, p.TenPhong,
              p.TrangThai as TrangThaiPhong,
              COALESCE(pt.GiaTinDang, p.GiaChuan) as Gia,
              COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
              p.HinhAnhPhong as AnhPhong
            FROM phong_tindang pt
            INNER JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = ? AND p.TrangThai = 'Trong'
            ORDER BY p.PhongID ASC
          `;

          const [phongRows] = await db.execute(queryPhong, [tinDangId]);
          tinDang.DanhSachPhong = phongRows;
        } else {
          // Tin kiểu mới không có phong_tindang, DanhSachPhong = []
          tinDang.DanhSachPhong = [];
        }
      } else {
        tinDang.DanhSachPhong = [];
      }

      return tinDang;
    } catch (err) {
      throw new Error(`Lỗi khi lấy chi tiết tin đăng: ${err.message}`);
    }
  }

  /**
   * Lấy thống kê số lượng tin đăng cho trang chủ
   */
  static async layThongKeTrangChu() {
    try {
      // 1. Thống kê theo loại hình BDS (LoaiBDS)
      const [loaiBdsRows] = await db.execute(`
        SELECT LoaiBDS, COUNT(*) as SoLuong
        FROM tindang
        WHERE TrangThai IN ('DaDuyet', 'DaDang')
          AND (NgayHetHan IS NULL OR NgayHetHan >= CURDATE())
        GROUP BY LoaiBDS
      `);

      // 2. Thống kê theo Tỉnh/Thành phố
      const [tinhRows] = await db.execute(`
        SELECT np.ProvinceName as TenTinh, COUNT(*) as SoLuong
        FROM tindang td
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        WHERE td.TrangThai IN ('DaDuyet', 'DaDang')
          AND (td.NgayHetHan IS NULL OR td.NgayHetHan >= CURDATE())
          AND np.ProvinceName IS NOT NULL
        GROUP BY np.ProvinceName
      `);

      // 3. Tổng số tin đăng hoạt động
      const [tongRows] = await db.execute(`
        SELECT COUNT(*) as Tong
        FROM tindang
        WHERE TrangThai IN ('DaDuyet', 'DaDang')
          AND (NgayHetHan IS NULL OR NgayHetHan >= CURDATE())
      `);

      return {
        loaiBds: loaiBdsRows,
        tinh: tinhRows,
        tong: tongRows[0]?.Tong || 0
      };
    } catch (err) {
      throw new Error(`Lỗi lấy thống kê trang chủ: ${err.message}`);
    }
  }
}

module.exports = PublicTinDangModel;
