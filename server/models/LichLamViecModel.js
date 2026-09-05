/**
 * Model cho Lịch làm việc (UC-SALE-01)
 * Quản lý ca làm việc của Nhân viên Bán hàng
 */

const db = require('../config/db');

/**
 * @typedef {Object} LichLamViec
 * @property {number} LichID
 * @property {number} NhanVienBanHangID
 * @property {string} BatDau - Thời gian bắt đầu ca
 * @property {string} KetThuc - Thời gian kết thúc ca
 */

class LichLamViecModel {
  /**
   * Lấy danh sách lịch làm việc của nhân viên
   * @param {number} nhanVienId ID của nhân viên
   * @param {Object} filters Bộ lọc (tuNgay, denNgay)
   * @returns {Promise<LichLamViec[]>}
   */
  static async layLichLamViec(nhanVienId, filters = {}) {
    try {
      let query = `
        SELECT 
          llv.LichID,
          llv.NhanVienBanHangID,
          llv.BatDau,
          llv.KetThuc,
          COUNT(ch.CuocHenID) as SoCuocHen,
          COUNT(CASE WHEN ch.TrangThai = 'DaXacNhan' THEN 1 END) as SoDaXacNhan
        FROM lichlamviec llv
        LEFT JOIN cuochen ch ON ch.NhanVienBanHangID = llv.NhanVienBanHangID
          AND ch.ThoiGianHen BETWEEN llv.BatDau AND llv.KetThuc
        WHERE llv.NhanVienBanHangID = ?
      `;
      
      const params = [nhanVienId];
      
      if (filters.tuNgay) {
        query += ' AND llv.BatDau >= ?';
        params.push(filters.tuNgay);
      }
      
      if (filters.denNgay) {
        query += ' AND llv.KetThuc <= ?';
        params.push(filters.denNgay);
      }
      
      query += ' GROUP BY llv.LichID ORDER BY llv.BatDau ASC';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy lịch làm việc: ${error.message}`);
    }
  }

  /**
   * Lấy lịch làm việc theo tuần
   * @param {number} nhanVienId 
   * @param {Date} weekStart Ngày đầu tuần
   * @returns {Promise<LichLamViec[]>}
   */
  static async layLichTheoTuan(nhanVienId, weekStart) {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      return await this.layLichLamViec(nhanVienId, {
        tuNgay: weekStart,
        denNgay: weekEnd
      });
    } catch (error) {
      throw new Error(`Lỗi lấy lịch theo tuần: ${error.message}`);
    }
  }

  /**
   * Tạo ca làm việc mới
   * @param {number} nhanVienId 
   * @param {Object} data {batDau, ketThuc}
   * @returns {Promise<number>} LichID mới
   */
  static async taoLichLamViec(nhanVienId, data) {
    try {
      const [result] = await db.execute(
        'INSERT INTO lichlamviec (NhanVienBanHangID, BatDau, KetThuc) VALUES (?, ?, ?)',
        [nhanVienId, data.batDau, data.ketThuc]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Lỗi tạo lịch làm việc: ${error.message}`);
    }
  }

  /**
   * Cập nhật ca làm việc
   * @param {number} lichId 
   * @param {number} nhanVienId 
   * @param {Object} data {batDau, ketThuc}
   * @returns {Promise<boolean>}
   */
  static async capNhatLichLamViec(lichId, nhanVienId, data) {
    try {
      const [result] = await db.execute(
        'UPDATE lichlamviec SET BatDau = ?, KetThuc = ? WHERE LichID = ? AND NhanVienBanHangID = ?',
        [data.batDau, data.ketThuc, lichId, nhanVienId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Lỗi cập nhật lịch làm việc: ${error.message}`);
    }
  }

  /**
   * Xóa ca làm việc
   * @param {number} lichId 
   * @param {number} nhanVienId 
   * @returns {Promise<boolean>}
   */
  static async xoaLichLamViec(lichId, nhanVienId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM lichlamviec WHERE LichID = ? AND NhanVienBanHangID = ?',
        [lichId, nhanVienId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Lỗi xóa lịch làm việc: ${error.message}`);
    }
  }

  /**
   * Kiểm tra xung đột lịch
   * @param {number} nhanVienId 
   * @param {string} batDau 
   * @param {string} ketThuc 
   * @param {number} excludeLichId ID ca cần loại trừ (dùng khi update)
   * @returns {Promise<boolean>} true nếu có xung đột
   */
  static async kiemTraXungDot(nhanVienId, batDau, ketThuc, excludeLichId = null) {
    try {
      let query = `
        SELECT COUNT(*) as soLuong
        FROM lichlamviec
        WHERE NhanVienBanHangID = ?
        AND (
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau >= ? AND KetThuc <= ?)
        )
      `;
      
      const params = [nhanVienId, ketThuc, batDau, ketThuc, ketThuc, batDau, ketThuc];
      
      if (excludeLichId) {
        query += ' AND LichID != ?';
        params.push(excludeLichId);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].soLuong > 0;
    } catch (error) {
      throw new Error(`Lỗi kiểm tra xung đột lịch: ${error.message}`);
    }
  }

  /**
   * Đếm cuộc hẹn trong ca làm việc
   * @param {number} lichId 
   * @returns {Promise<number>}
   */
  static async demCuocHenTrongCa(lichId) {
    try {
      const [rows] = await db.execute(`
        SELECT COUNT(*) as soLuong
        FROM cuochen ch
        INNER JOIN lichlamviec llv ON ch.NhanVienBanHangID = llv.NhanVienBanHangID
        WHERE llv.LichID = ?
        AND ch.ThoiGianHen BETWEEN llv.BatDau AND llv.KetThuc
        AND ch.TrangThai NOT IN ('HuyBoiKhach', 'HuyBoiHeThong')
      `, [lichId]);
      
      return rows[0].soLuong;
    } catch (error) {
      throw new Error(`Lỗi đếm cuộc hẹn: ${error.message}`);
    }
  }
}

module.exports = LichLamViecModel;








