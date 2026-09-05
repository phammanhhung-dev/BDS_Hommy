/**
 * @fileoverview Model cung cấp thông tin người dùng phục vụ hợp đồng
 */

const db = require('../config/db');

class NguoiDungModel {
  /**
   * Lấy hồ sơ cơ bản của người dùng để điền hợp đồng
   * @param {number} nguoiDungId
   * @returns {Promise<Object|null>}
   */
  static async layHoSoHopDong(nguoiDungId) {
    if (!nguoiDungId || Number.isNaN(Number(nguoiDungId))) {
      throw new Error('NguoiDungID không hợp lệ');
    }

    try {
      const [rows] = await db.execute(
        `
          SELECT 
            NguoiDungID,
            TenDayDu,
            Email,
            SoDienThoai,
            DiaChi,
            NgaySinh,
            SoCCCD,
            NgayCapCCCD
          FROM nguoidung
          WHERE NguoiDungID = ? AND TrangThai = 'HoatDong'
        `,
        [nguoiDungId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Lỗi truy vấn người dùng: ${error.message}`);
    }
  }
}

module.exports = NguoiDungModel;

