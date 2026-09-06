const db = require('../config/db');

class PublicTinDangModel {
  static async layTatCaTinDang(filters = {}) {
    try {
      let query = 
        SELECT
          td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
          td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
          'Thue' AS LoaiGiaoDich, 'CanHo' AS LoaiBDS, 0 AS GiaTien, 0 AS DienTichDat, 0 AS DienTichSuDung,
          1 AS SoTang, 1 AS SoPhongNgu, 1 AS SoPhongTam, '??ng Nam' AS Huong, 'S? h?ng' AS PhapLy, 2024 AS NamXayDung, '??y ??' AS NoiThat,
          (
            SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as Gia,
          (
            SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as DienTich,
          td.TrangThai, td.TaoLuc, td.CapNhatLuc,
          da.TenDuAn, da.ViDo AS ViDo, da.KinhDo AS KinhDo,
          COALESCE(da.DiaChi, kv.TenKhuVuc) AS DiaChi,
          kv.TenKhuVuc AS TenKhuVuc,
          NULL AS TenTinh, NULL AS TenQuanHuyen,
          (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong,
          (SELECT COUNT(*) FROM phong_tindang pt
             JOIN phong p ON pt.PhongID = p.PhongID
             WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong') as SoPhongTrong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        WHERE td.TrangThai IN ('DaDuyet', 'DaDang')
      ;
      const params = [];

      if (filters.duAnId) {
        query += ' AND td.DuAnID = ?';
        params.push(filters.duAnId);
      }

      if (filters.keyword) {
        query += ' AND (td.TieuDe LIKE ? OR td.MoTa LIKE ?)';
        params.push(%%, %%);
      }

      query += ' ORDER BY td.TaoLuc DESC';

      if (filters.limit) {
        const limitVal = parseInt(filters.limit, 10);
        if (!isNaN(limitVal) && limitVal > 0) {
          query += ' LIMIT ?';
          params.push(limitVal);
        }
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('[PublicTinDangModel] Error in layTatCaTinDang:', error);
      throw error;
    }
  }

  static async layThongKeTrangChu() {
    try {
      const [tongTinRows] = await db.execute(
        SELECT COUNT(*) as TongTinDang
        FROM tindang
        WHERE TrangThai IN ('DaDuyet', 'DaDang')
      );

      const [tongDuAnRows] = await db.execute(
        SELECT COUNT(*) as TongDuAn FROM duan
      );

      return {
        TongTinDang: tongTinRows[0]?.TongTinDang || 0,
        TongDuAn: tongDuAnRows[0]?.TongDuAn || 0,
        DanhSachTinh: []
      };
    } catch (error) {
      console.error('[PublicTinDangModel] Error in layThongKeTrangChu:', error);
      throw error;
    }
  }

  static async layChiTietTinDang(tinDangId) {
    try {
      const [rows] = await db.execute(
        SELECT
          td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
          td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
          'Thue' AS LoaiGiaoDich, 'CanHo' AS LoaiBDS, 0 AS GiaTien, 0 AS DienTichDat, 0 AS DienTichSuDung,
          1 AS SoTang, 1 AS SoPhongNgu, 1 AS SoPhongTam, '??ng Nam' AS Huong, 'S? h?ng' AS PhapLy, 2024 AS NamXayDung, '??y ??' AS NoiThat,
          td.TrangThai, td.TaoLuc, td.CapNhatLuc, td.DuyetLuc,
          da.TenDuAn, COALESCE(da.DiaChi, kv.TenKhuVuc) AS DiaChi, da.ViDo, da.KinhDo,
          kv.TenKhuVuc AS TenKhuVuc,
          (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        WHERE td.TinDangID = ?
      , [tinDangId]);

      if (rows.length === 0) return null;

      const tinDang = rows[0];

      // Parse JSON fields
      try {
        if (typeof tinDang.URL === 'string') tinDang.URL = JSON.parse(tinDang.URL);
      } catch (e) {
        tinDang.URL = [];
      }

      try {
        if (typeof tinDang.TienIch === 'string') tinDang.TienIch = JSON.parse(tinDang.TienIch);
      } catch (e) {
        tinDang.TienIch = [];
      }

      // L?y danh s?ch ph?ng
      const [phongRows] = await db.execute(
        SELECT p.*, pt.GiaTinDang, pt.DienTichTinDang
        FROM phong_tindang pt
        INNER JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ?
      , [tinDangId]);

      tinDang.DanhSachPhong = phongRows;
      return tinDang;
    } catch (error) {
      console.error('[PublicTinDangModel] Error in layChiTietTinDang:', error);
      throw error;
    }
  }
}

module.exports = PublicTinDangModel;
