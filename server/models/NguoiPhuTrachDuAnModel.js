const db = require("../config/db");

function toVNTime(mysqlDateStr) {
  if (!mysqlDateStr) return null;
  const d = new Date(mysqlDateStr);
  d.setHours(d.getHours() + 7); // Cộng 7 tiếng
  return d.toISOString().replace("T", " ").substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
}

class NguoiPhuTrachDuAnModel {
  /**
   * Lấy danh sách nhân viên phụ trách dự án theo khu vực
   * @param {number} khuVucId
   * @returns {Promise<Array>}
   */
  static async layDanhSachNhanVienPhuTrach(khuVucId) {
    // Lấy nhân viên có KhuVucChinhID = khuVucId
    // Join với nguoidung để lấy TrangThai (HoatDong, TamKhoa, etc.)
    const [nvRows] = await db.execute(
      `SELECT 
        hs.NguoiDungID,
        hs.KhuVucChinhID,
        hs.TyLeHoaHong,
        hs.MaNhanVien,
        nd.TenDayDu,
        nd.SoDienThoai,
        nd.TrangThai
      FROM hosonhanvien hs
      INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
      WHERE hs.KhuVucChinhID = ?
        AND nd.TrangThai = 'HoatDong'`,
      [khuVucId]
    );

    // Lấy lịch làm việc cho từng nhân viên
    const result = [];
    for (const nv of nvRows) {
      const [lichRows] = await db.execute(
        `SELECT * FROM lichlamviec WHERE NhanVienBanHangID = ? ORDER BY BatDau ASC`,
        [nv.NguoiDungID]
      );
      result.push({
        ...nv,
        lichLamViec: lichRows.map((row) => ({
          ...row,
          BatDau: toVNTime(row.BatDau),
          KetThuc: toVNTime(row.KetThuc),
        })),
      });
    }
    return result;
  }
}

module.exports = NguoiPhuTrachDuAnModel;
