const db = require("../config/db");

class BaiVietModel {
  /**
   * Lấy danh sách bài viết theo bộ lọc
   * @param {Object} filters
   * @param {string} filters.loai - Loại bài viết (TinTuc, Wiki, PhanTich)
   * @param {number} filters.limit - Giới hạn số lượng bài viết trả về
   */
  static async layDanhSachBaiViet(filters = {}) {
    try {
      let query = `
        SELECT 
          BaiVietID,
          TieuDe,
          TomTat,
          HinhAnh,
          Loai,
          DanhMuc,
          Slug,
          LuotXem,
          TaoLuc,
          CapNhatLuc
        FROM baiviet
        WHERE 1=1
      `;
      const params = [];

      if (filters.loai) {
        query += " AND Loai = ?";
        params.push(filters.loai);
      }

      if (filters.danhMuc) {
        query += " AND DanhMuc = ?";
        params.push(filters.danhMuc);
      }

      query += " ORDER BY TaoLuc DESC";

      if (filters.limit) {
        const limitNum = parseInt(filters.limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          query += ` LIMIT ${limitNum}`;
        }
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (err) {
      console.error("new Error caught in BaiVietModel", err.message);
      return [];
    }
  }

  /**
   * Lấy chi tiết bài viết theo ID hoặc Slug
   * @param {string|number} idOrSlug
   */
  static async layChiTietBaiViet(idOrSlug) {
    try {
      const isId = !isNaN(Number(idOrSlug));
      let query = `
        SELECT 
          BaiVietID,
          TieuDe,
          TomTat,
          NoiDung,
          HinhAnh,
          Loai,
          DanhMuc,
          Slug,
          LuotXem,
          TaoLuc,
          CapNhatLuc
        FROM baiviet
      `;

      if (isId) {
        query += " WHERE BaiVietID = ?";
      } else {
        query += " WHERE Slug = ?";
      }

      const [rows] = await db.execute(query, [idOrSlug]);
      
      // Tăng lượt xem bất đồng bộ khi đọc chi tiết
      if (rows.length > 0) {
        const targetId = rows[0].BaiVietID;
        db.execute("UPDATE baiviet SET LuotXem = LuotXem + 1 WHERE BaiVietID = ?", [targetId])
          .catch(e => console.error("Lỗi cập nhật lượt xem bài viết:", e));
      }

      return rows[0] || null;
    } catch (err) {
      console.error("new Error caught in BaiVietModel", err.message);
      return null;
    }
  }
}

module.exports = BaiVietModel;
