const db = require("../config/db");
const SEED_ARTICLES = require("./seedArticlesData");

let tableInitialized = false;


class BaiVietModel {
  /**
   * Tự động kiểm tra và khởi tạo bảng baiviet cùng dữ liệu mẫu nếu chưa có
   */
  static async ensureTableAndSeed() {
    if (tableInitialized) return;
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS baiviet (
          BaiVietID INT(11) NOT NULL AUTO_INCREMENT,
          TieuDe VARCHAR(255) NOT NULL,
          TomTat TEXT DEFAULT NULL,
          NoiDung LONGTEXT DEFAULT NULL,
          HinhAnh VARCHAR(255) DEFAULT NULL,
          Loai ENUM('TinTuc', 'Wiki', 'PhanTich') NOT NULL DEFAULT 'TinTuc',
          DanhMuc VARCHAR(100) DEFAULT NULL,
          Slug VARCHAR(255) NOT NULL,
          LuotXem INT(11) DEFAULT 0,
          NguoiVietID INT(11) DEFAULT NULL,
          TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
          CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (BaiVietID),
          UNIQUE KEY idx_slug (Slug),
          KEY idx_loai (Loai)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const [countResult] = await db.execute("SELECT COUNT(*) AS total FROM baiviet");
      if (countResult[0]?.total === 0) {
        console.log("📝 Bảng baiviet trống, đang chèn dữ liệu mẫu...");
        for (const item of SEED_ARTICLES) {
          await db.execute(
            `INSERT INTO baiviet (TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, LuotXem)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE TieuDe=VALUES(TieuDe)`,
            [item.TieuDe, item.TomTat, item.NoiDung, item.HinhAnh, item.Loai, item.DanhMuc, item.Slug, item.LuotXem || 0]
          );
        }
        console.log("✅ Đã chèn dữ liệu mẫu bài viết thành công!");
      }
      tableInitialized = true;
    } catch (err) {
      console.warn("[BaiVietModel] ensureTableAndSeed warning:", err.message);
    }
  }

  /**
   * Lấy danh sách bài viết theo bộ lọc
   * @param {Object} filters
   * @param {string} filters.loai - Loại bài viết (TinTuc, Wiki, PhanTich)
   * @param {string} filters.danhMuc - Danh mục bài viết
   * @param {number} filters.limit - Giới hạn số lượng bài viết trả về
   */
  static async layDanhSachBaiViet(filters = {}) {
    try {
      await this.ensureTableAndSeed();

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
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.error("[BaiVietModel] Lỗi query baiviet:", err.message);
    }

    // Fallback in-memory
    let fallback = [...SEED_ARTICLES];
    if (filters.loai) {
      fallback = fallback.filter(item => item.Loai === filters.loai);
    }
    if (filters.danhMuc) {
      fallback = fallback.filter(item => item.DanhMuc === filters.danhMuc);
    }
    if (filters.limit) {
      const limitNum = parseInt(filters.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        fallback = fallback.slice(0, limitNum);
      }
    }
    return fallback;
  }

  /**
   * Lấy chi tiết bài viết theo ID hoặc Slug
   * @param {string|number} idOrSlug
   */
  static async layChiTietBaiViet(idOrSlug) {
    try {
      await this.ensureTableAndSeed();

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
      
      if (rows && rows.length > 0) {
        const targetId = rows[0].BaiVietID;
        db.execute("UPDATE baiviet SET LuotXem = LuotXem + 1 WHERE BaiVietID = ?", [targetId])
          .catch(e => console.error("Lỗi cập nhật lượt xem bài viết:", e));
        return rows[0];
      }
    } catch (err) {
      console.error("[BaiVietModel] Lỗi query chi tiết bài viết:", err.message);
    }

    // Fallback in-memory
    const isId = !isNaN(Number(idOrSlug));
    const post = SEED_ARTICLES.find((a, idx) => 
      (isId && (a.BaiVietID === Number(idOrSlug) || (idx + 1) === Number(idOrSlug))) || 
      a.Slug === idOrSlug
    );
    return post || null;
  }

  /**
   * Thêm bài viết mới
   * @param {Object} data 
   */
  static async themBaiViet(data) {
    try {
      await this.ensureTableAndSeed();
      const { TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, NguoiVietID } = data;
      const query = `
        INSERT INTO baiviet (TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, NguoiVietID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [
        TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, NguoiVietID || null
      ]);
      return result.insertId;
    } catch (err) {
      console.error("[BaiVietModel] Lỗi themBaiViet:", err.message);
      throw err;
    }
  }

  /**
   * Cập nhật bài viết
   * @param {number} id 
   * @param {Object} data 
   */
  static async suaBaiViet(id, data) {
    try {
      await this.ensureTableAndSeed();
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) return true;

      const query = `UPDATE baiviet SET ${fields.join(", ")} WHERE BaiVietID = ?`;
      values.push(id);

      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("[BaiVietModel] Lỗi suaBaiViet:", err.message);
      throw err;
    }
  }

  /**
   * Xóa bài viết
   * @param {number} id 
   */
  static async xoaBaiViet(id) {
    try {
      await this.ensureTableAndSeed();
      const query = "DELETE FROM baiviet WHERE BaiVietID = ?";
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("[BaiVietModel] Lỗi xoaBaiViet:", err.message);
      throw err;
    }
  }
}

// Khởi chạy ngầm việc tạo bảng & dữ liệu mẫu
BaiVietModel.ensureTableAndSeed().catch(() => {});

module.exports = BaiVietModel;
