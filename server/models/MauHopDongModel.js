/**
 * @fileoverview Model quản lý bảng MauHopDong
 * Chỉ chịu trách nhiệm CRUD dữ liệu template hợp đồng
 */

const db = require('../config/db');

class MauHopDongModel {
  /**
   * Lấy chi tiết mẫu hợp đồng theo ID
   * @param {number} mauHopDongId
   * @returns {Promise<Object|null>}
   */
  static async layTheoId(mauHopDongId) {
    if (!mauHopDongId || Number.isNaN(Number(mauHopDongId))) {
      throw new Error('MauHopDongID không hợp lệ');
    }

    try {
      const [rows] = await db.execute(
        `
          SELECT 
            MauHopDongID,
            TieuDe,
            NoiDungMau,
            FileURL,
            PhienBan,
            TrangThai,
            TaoBoiAdminID,
            TaoLuc,
            CapNhatLuc
          FROM mauhopdong
          WHERE MauHopDongID = ?
        `,
        [mauHopDongId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Lỗi truy vấn MauHopDong: ${error.message}`);
    }
  }

  /**
   * Lấy mẫu đang hoạt động (active) mới nhất
   * @returns {Promise<Object|null>}
   */
  static async layMauHoatDongMoiNhat() {
    try {
      const [rows] = await db.execute(
        `
          SELECT 
            MauHopDongID,
            TieuDe,
            NoiDungMau,
            FileURL,
            PhienBan,
            TrangThai,
            TaoBoiAdminID,
            TaoLuc,
            CapNhatLuc
          FROM mauhopdong
          WHERE TrangThai IN ('Active', 'xacthuc')
          ORDER BY CapNhatLuc DESC
          LIMIT 1
        `
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Lỗi lấy mẫu hợp đồng hoạt động: ${error.message}`);
    }
  }
}

module.exports = MauHopDongModel;

