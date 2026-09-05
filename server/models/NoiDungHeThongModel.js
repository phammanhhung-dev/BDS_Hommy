/**
 * Model cho Nội dung Hệ thống
 * Quản lý các chính sách, điều khoản, hướng dẫn
 */

const db = require('../config/db');

/**
 * @typedef {Object} NoiDungHeThong
 * @property {number} NoiDungID
 * @property {string} LoaiNoiDung - POLICY_PRIVACY, TERMS_USAGE, POLICY_PAYMENT, GUIDE_BOOKING
 * @property {string} TieuDe
 * @property {string} NoiDung
 * @property {string} PhienBan
 * @property {number} CapNhatBoiID
 * @property {Date} CapNhatLuc
 */

class NoiDungHeThongModel {
  /**
   * Lấy danh sách nội dung hệ thống
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.loaiNoiDung] - Loại nội dung
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  static async layDanhSach(filters = {}) {
    try {
      const {
        loaiNoiDung = null,
        keyword = '',
        page = 1,
        limit = 20
      } = filters;

      const parsedLimit = Number(limit);
      const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

      const parsedPage = Number(page);
      const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

      const offset = (safePage - 1) * safeLimit;

      // Build WHERE conditions
      let whereConditions = [];
      const params = [];

      if (loaiNoiDung) {
        whereConditions.push('n.LoaiNoiDung = ?');
        params.push(loaiNoiDung);
      }

      if (keyword && keyword.trim()) {
        whereConditions.push('(n.TieuDe LIKE ? OR n.NoiDung LIKE ?)');
        const searchKeyword = `%${keyword.trim()}%`;
        params.push(searchKeyword, searchKeyword);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM noidunghethong n
        ${whereClause}
      `;
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Data query
      const dataQuery = `
        SELECT 
          n.NoiDungID,
          n.LoaiNoiDung,
          n.TieuDe,
          n.NoiDung,
          n.PhienBan,
          n.CapNhatBoiID,
          n.CapNhatLuc,
          nd.TenDayDu AS TenNguoiCapNhat
        FROM noidunghethong n
        LEFT JOIN nguoidung nd ON n.CapNhatBoiID = nd.NguoiDungID
        ${whereClause}
        ORDER BY n.CapNhatLuc DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `;
      const [rows] = await db.execute(dataQuery, params);

      const totalPages = Math.ceil(total / safeLimit);

      return {
        data: rows,
        total,
        page: safePage,
        totalPages,
        limit: safeLimit
      };
    } catch (error) {
      console.error('[NoiDungHeThongModel] Lỗi layDanhSach:', error);
      throw new Error(`Lỗi lấy danh sách nội dung hệ thống: ${error.message}`);
    }
  }

  /**
   * Lấy nội dung theo ID
   * @param {number} noiDungID
   * @returns {Promise<NoiDungHeThong|null>}
   */
  static async layTheoID(noiDungID) {
    try {
      const query = `
        SELECT 
          n.NoiDungID,
          n.LoaiNoiDung,
          n.TieuDe,
          n.NoiDung,
          n.PhienBan,
          n.CapNhatBoiID,
          n.CapNhatLuc,
          nd.TenDayDu AS TenNguoiCapNhat
        FROM noidunghethong n
        LEFT JOIN nguoidung nd ON n.CapNhatBoiID = nd.NguoiDungID
        WHERE n.NoiDungID = ?
      `;
      const [rows] = await db.execute(query, [noiDungID]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[NoiDungHeThongModel] Lỗi layTheoID:', error);
      throw new Error(`Lỗi lấy nội dung hệ thống: ${error.message}`);
    }
  }

  /**
   * Tạo nội dung mới
   * @param {Object} data
   * @param {string} data.LoaiNoiDung
   * @param {string} data.TieuDe
   * @param {string} data.NoiDung
   * @param {string} data.PhienBan
   * @param {number} capNhatBoiID
   * @returns {Promise<NoiDungHeThong>}
   */
  static async taoMoi(data, capNhatBoiID) {
    try {
      const { LoaiNoiDung, TieuDe, NoiDung, PhienBan = '1.0' } = data;

      const query = `
        INSERT INTO noidunghethong 
        (LoaiNoiDung, TieuDe, NoiDung, PhienBan, CapNhatBoiID, CapNhatLuc)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await db.execute(query, [
        LoaiNoiDung,
        TieuDe,
        NoiDung,
        PhienBan,
        capNhatBoiID
      ]);

      return await this.layTheoID(result.insertId);
    } catch (error) {
      console.error('[NoiDungHeThongModel] Lỗi taoMoi:', error);
      throw new Error(`Lỗi tạo nội dung hệ thống: ${error.message}`);
    }
  }

  /**
   * Cập nhật nội dung
   * @param {number} noiDungID
   * @param {Object} data
   * @param {string} [data.LoaiNoiDung]
   * @param {string} [data.TieuDe]
   * @param {string} [data.NoiDung]
   * @param {string} [data.PhienBan]
   * @param {number} capNhatBoiID
   * @returns {Promise<NoiDungHeThong>}
   */
  static async capNhat(noiDungID, data, capNhatBoiID) {
    try {
      const { LoaiNoiDung, TieuDe, NoiDung, PhienBan } = data;

      const updates = [];
      const params = [];

      // Chuyển đổi undefined thành null để tránh lỗi MySQL
      if (LoaiNoiDung !== undefined) {
        updates.push('LoaiNoiDung = ?');
        params.push(LoaiNoiDung === null || LoaiNoiDung === undefined ? null : LoaiNoiDung);
      }
      if (TieuDe !== undefined) {
        updates.push('TieuDe = ?');
        params.push(TieuDe === null || TieuDe === undefined ? null : TieuDe);
      }
      if (NoiDung !== undefined) {
        updates.push('NoiDung = ?');
        params.push(NoiDung === null || NoiDung === undefined ? null : NoiDung);
      }
      if (PhienBan !== undefined) {
        updates.push('PhienBan = ?');
        params.push(PhienBan === null || PhienBan === undefined ? null : PhienBan);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      // Đảm bảo capNhatBoiID không phải undefined
      if (capNhatBoiID === undefined || capNhatBoiID === null) {
        throw new Error('CapNhatBoiID không được để trống');
      }

      updates.push('CapNhatBoiID = ?', 'CapNhatLuc = NOW()');
      params.push(capNhatBoiID);
      
      // noiDungID phải là tham số cuối cùng cho WHERE clause
      params.push(noiDungID);

      const query = `
        UPDATE noidunghethong
        SET ${updates.join(', ')}
        WHERE NoiDungID = ?
      `;
      await db.execute(query, params);

      return await this.layTheoID(noiDungID);
    } catch (error) {
      console.error('[NoiDungHeThongModel] Lỗi capNhat:', error);
      throw new Error(`Lỗi cập nhật nội dung hệ thống: ${error.message}`);
    }
  }

  /**
   * Xóa nội dung
   * @param {number} noiDungID
   * @returns {Promise<boolean>}
   */
  static async xoa(noiDungID) {
    try {
      const query = `DELETE FROM noidunghethong WHERE NoiDungID = ?`;
      const [result] = await db.execute(query, [noiDungID]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[NoiDungHeThongModel] Lỗi xoa:', error);
      throw new Error(`Lỗi xóa nội dung hệ thống: ${error.message}`);
    }
  }
}

module.exports = NoiDungHeThongModel;

