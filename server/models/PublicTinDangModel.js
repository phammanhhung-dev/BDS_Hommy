const db = require('../config/db');

class PublicTinDangModel {
  static async layTatCaTinDang(filters = {}) {
    try {
      let query = 'SELECT ' +
        'td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID, td.ChuDuAnID, ' +
        'td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu, ' +
        'td.LoaiGiaoDich, td.LoaiBDS, td.GiaTien, td.DienTichDat, td.DienTichSuDung, ' +
        'td.SoTang, td.SoPhongNgu, td.SoPhongTam, td.Huong, td.PhapLy, td.NamXayDung, td.NoiThat, ' +
        '(SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID) as Gia, ' +
        '(SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID) as DienTich, ' +
        'td.TrangThai, td.TaoLuc, td.CapNhatLuc, ' +
        'da.TenDuAn, da.ViDo AS ViDo, da.KinhDo AS KinhDo, ' +
        'COALESCE(da.DiaChi, CONCAT_WS(\', \', COALESCE(nc.CommuneName, lc.CommuneName), ndist.DistrictName, nprov.ProvinceName), kv.TenKhuVuc) AS DiaChi, ' +
        'COALESCE(nc.CommuneName, lc.CommuneName, kv.TenKhuVuc) AS TenKhuVuc, ' +
        'ndist.DistrictName AS TenQuanHuyen, nprov.ProvinceName AS TenTinh, ' +
        'ndist.DistrictID AS QuanHuyenID, nprov.ProvinceID AS TinhThanhID, ' +
        '(SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong, ' +
        '(SELECT COUNT(*) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = \'Trong\') as SoPhongTrong ' +
        'FROM tindang td ' +
        'LEFT JOIN duan da ON td.DuAnID = da.DuAnID ' +
        'LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID ' +
        'LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID ' +
        'LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID ' +
        'LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID ' +
        'LEFT JOIN legacy_provinces nprov ON ndist.ProvinceID = nprov.ProvinceID ' +
        'WHERE td.TrangThai IN (\'DaDuyet\', \'DaDang\')';
      
      const params = [];

      if (filters.duAnId) {
        query += ' AND td.DuAnID = ?';
        params.push(filters.duAnId);
      }

      if (filters.keyword) {
        query += ' AND (td.TieuDe LIKE ? OR td.MoTa LIKE ?)';
        params.push('%' + filters.keyword + '%', '%' + filters.keyword + '%');
      }

      if (filters.loaiGiaoDich) {
        query += ' AND td.LoaiGiaoDich = ?';
        params.push(filters.loaiGiaoDich);
      }

      if (filters.loaiBDS) {
        query += ' AND td.LoaiBDS = ?';
        params.push(filters.loaiBDS);
      }

      if (filters.minGia) {
        query += ' AND td.GiaTien >= ?';
        params.push(filters.minGia);
      }

      if (filters.maxGia) {
        query += ' AND td.GiaTien <= ?';
        params.push(filters.maxGia);
      }

      if (filters.khuVucId) {
        query += ' AND td.KhuVucID = ?';
        params.push(filters.khuVucId);
      }

      if (filters.tinhThanh) {
        query += ' AND (nprov.ProvinceName LIKE ? OR da.DiaChi LIKE ? OR kv.TenKhuVuc LIKE ?)';
        const likeStr = '%' + filters.tinhThanh + '%';
        params.push(likeStr, likeStr, likeStr);
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
        'SELECT COUNT(*) as TongTinDang FROM tindang WHERE TrangThai IN (\'DaDuyet\', \'DaDang\')'
      );

      const [tongDuAnRows] = await db.execute(
        'SELECT COUNT(*) as TongDuAn FROM duan'
      );

      const [allListings] = await db.execute(
        'SELECT COALESCE(da.DiaChi, nprov.ProvinceName, kv.TenKhuVuc, \'\') AS FullAddress, nprov.ProvinceName ' +
        'FROM tindang td ' +
        'LEFT JOIN duan da ON td.DuAnID = da.DuAnID ' +
        'LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID ' +
        'LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID ' +
        'LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID ' +
        'LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID ' +
        'LEFT JOIN legacy_provinces nprov ON ndist.ProvinceID = nprov.ProvinceID ' +
        'WHERE td.TrangThai IN (\'DaDuyet\', \'DaDang\')'
      );

      const tinhCounts = {};
      for (const row of allListings) {
        const addr = String(row.FullAddress).toLowerCase();
        let province = row.ProvinceName || "Khác";
        
        if (addr.includes('hồ chí minh') || addr.includes('hcm') || addr.includes('ho chi minh') || addr.includes('sài gòn')) {
          province = 'Hồ Chí Minh';
        } else if (addr.includes('hà nội') || addr.includes('ha noi')) {
          province = 'Hà Nội';
        } else if (addr.includes('đà nẵng') || addr.includes('da nang')) {
          province = 'Đà Nẵng';
        } else if (addr.includes('bình dương') || addr.includes('binh duong')) {
          province = 'Bình Dương';
        } else if (addr.includes('đồng nai') || addr.includes('dong nai')) {
          province = 'Đồng Nai';
        }

        tinhCounts[province] = (tinhCounts[province] || 0) + 1;
      }
      
      const tinhRows = Object.keys(tinhCounts).map(key => ({
        TenTinh: key,
        SoLuong: tinhCounts[key]
      }));

      const [loaiBdsRows] = await db.execute(
        'SELECT LoaiBDS, COUNT(*) AS SoLuong ' +
        'FROM tindang ' +
        'WHERE TrangThai IN (\'DaDuyet\', \'DaDang\') AND LoaiBDS IS NOT NULL ' +
        'GROUP BY LoaiBDS'
      );

      const tong = tongTinRows[0]?.TongTinDang || 0;
      return {
        tong,
        TongTinDang: tong,
        TongDuAn: tongDuAnRows[0]?.TongDuAn || 0,
        DanhSachTinh: tinhRows,
        loaiBds: loaiBdsRows,
        tinh: tinhRows
      };
    } catch (error) {
      console.error('[PublicTinDangModel] Error in layThongKeTrangChu:', error);
      throw error;
    }
  }

  static async layChiTietTinDang(tinDangId) {
    try {
      const query = 
        'SELECT ' +
        'td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID, td.ChuDuAnID, ' +
        'td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu, ' +
        'td.LoaiGiaoDich, td.LoaiBDS, td.GiaTien, td.DienTichDat, td.DienTichSuDung, ' +
        'td.SoTang, td.SoPhongNgu, td.SoPhongTam, td.Huong, td.PhapLy, td.NamXayDung, td.NoiThat, ' +
        'td.TrangThai, td.TaoLuc, td.CapNhatLuc, td.DuyetLuc, ' +
        'da.TenDuAn, COALESCE(da.DiaChi, CONCAT_WS(\', \', COALESCE(nc.CommuneName, lc.CommuneName), ndist.DistrictName, nprov.ProvinceName), kv.TenKhuVuc) AS DiaChi, COALESCE(da.ViDo, kv.ViDo) AS ViDo, COALESCE(da.KinhDo, kv.KinhDo) AS KinhDo, ' +
        'COALESCE(nc.CommuneName, lc.CommuneName, kv.TenKhuVuc) AS TenKhuVuc, ndist.DistrictName AS TenQuanHuyen, nprov.ProvinceName AS TenTinh, ' +
        'ndist.DistrictID AS QuanHuyenID, nprov.ProvinceID AS TinhThanhID, ' +
        'nd.TenDayDu AS NguoiDang_Ten, nd.SoDienThoai AS NguoiDang_SDT, nd.Email AS NguoiDang_Email, ' +
        '(SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong ' +
        'FROM tindang td ' +
        'LEFT JOIN duan da ON td.DuAnID = da.DuAnID ' +
        'LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID ' +
        'LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID ' +
        'LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID ' +
        'LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID ' +
        'LEFT JOIN legacy_provinces nprov ON ndist.ProvinceID = nprov.ProvinceID ' +
        'LEFT JOIN nguoidung nd ON td.ChuDuAnID = nd.NguoiDungID ' +
        'WHERE td.TinDangID = ?';
        
      const [rows] = await db.execute(query, [tinDangId]);
      
      if (rows.length === 0) return null;

      const tinDang = rows[0];

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

      const [phongRows] = await db.execute(
        'SELECT p.*, pt.GiaTinDang, pt.DienTichTinDang ' +
        'FROM phong_tindang pt ' +
        'INNER JOIN phong p ON pt.PhongID = p.PhongID ' +
        'WHERE pt.TinDangID = ?', [tinDangId]);

      tinDang.DanhSachPhong = phongRows;
      return tinDang;
    } catch (error) {
      console.error('[PublicTinDangModel] Error in layChiTietTinDang:', error);
      throw error;
    }
  }
}

module.exports = PublicTinDangModel;
