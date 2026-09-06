const db = require("../config/db");

class PublicDuAnModel {
  static async layTatCaDuAn(filters = {}) {
    try {
      let query = `
        SELECT 
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.TrangThai,
          da.YeuCauPheDuyetChu,
          da.PhuongThucVao,
          da.ViDo,
          da.KinhDo,
          da.TaoLuc,
          da.CapNhatLuc,
          NULL AS ThongTinMoRong,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai != 'LuuTru') as SoTinDang,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai IN ('DaDang','DaDuyet','ChoDuyet')) as TinDangHoatDong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID) as TongPhong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'Trong') as PhongTrong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'GiuCho') as PhongGiuCho,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'DaThue') as PhongDaThue,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'DonDep') as PhongDonDep
        FROM duan da
        WHERE 1=1
      `;
      const params = [];

      if (filters.trangThai) {
        query += " AND da.TrangThai = ?";
        params.push(filters.trangThai);
      }

      if (filters.keyword) {
        query += " AND (da.TenDuAn LIKE ? OR da.DiaChi LIKE ?)";
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      query += " ORDER BY da.CapNhatLuc DESC";

      if (filters.limit) {
        const limitNum = Number.parseInt(filters.limit, 10) || 50;
        query += ` LIMIT ${limitNum}`;
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (err) {
      throw new Error(`Lỗi khi lấy danh sách dự án công khai: ${err.message}`);
    }
  }

  static async layDuAnTheoId(duAnId) {
    try {
      const query = `
        SELECT 
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.TrangThai,
          da.YeuCauPheDuyetChu,
          da.PhuongThucVao,
          da.ViDo,
          da.KinhDo,
          da.TaoLuc,
          da.CapNhatLuc,
          NULL AS ThongTinMoRong,
          COALESCE(u.TenDayDu, 'Ban Quản Lý Dự Án') as TenChuDuAn,
          u.SoDienThoai as SdtChuDuAn,
          u.Email as EmailChuDuAn,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai != 'LuuTru') as SoTinDang,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai IN ('DaDang','DaDuyet','ChoDuyet')) as TinDangHoatDong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID) as TongPhong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'Trong') as PhongTrong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'GiuCho') as PhongGiuCho,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'DaThue') as PhongDaThue
        FROM duan da
        LEFT JOIN nguoidung u ON da.ChuDuAnID = u.NguoiDungID
        WHERE da.DuAnID = ?
      `;

      const [rows] = await db.execute(query, [duAnId]);
      if (rows.length === 0) return null;

      const duAn = rows[0];

      // Lấy danh sách tin đăng thuộc dự án này
      const [tinDangs] = await db.execute(
        `SELECT 
          td.TinDangID, td.TieuDe, td.GiaTien as GiaThue, td.DienTichSuDung as DienTich, 
          td.LoaiGiaoDich, td.LoaiBDS, td.TrangThai, td.TaoLuc, td.URL as HinhAnhDauTien,
          da.DiaChi
        FROM tindang td 
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.DuAnID = ? AND td.TrangThai IN ('DaDang', 'DaDuyet')
        ORDER BY td.TaoLuc DESC`,
        [duAnId]
      );

      // Lấy danh sách phòng thuộc dự án này
      const [phongs] = await db.execute(
        `SELECT PhongID, TenPhong as MaPhong, GiaChuan as GiaThue, DienTichChuan as DienTich, TrangThai 
        FROM phong 
        WHERE DuAnID = ? 
        ORDER BY PhongID ASC`,
        [duAnId]
      );

      return {
        ...duAn,
        tinDangs,
        phongs
      };
    } catch (err) {
      throw new Error(`Lỗi khi lấy chi tiết dự án công khai: ${err.message}`);
    }
  }
}

module.exports = PublicDuAnModel;
