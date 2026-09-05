/**
 * Model: ChinhSachCocModel
 * Mô tả: Quản lý Chính sách Cọc (TTL giữ chỗ, Tỷ lệ phạt, Quy tắc giải tỏa)
 * Tác giả: GitHub Copilot
 * Ngày tạo: 2025-10-16
 */

const db = require('../config/db');

class ChinhSachCocModel {
  /**
   * Lấy danh sách chính sách cọc của một Chủ dự án
   * @param {number} chuDuAnID - ID của Chủ dự án
   * @param {boolean} chiLayHieuLuc - Chỉ lấy các chính sách còn hiệu lực (default: true)
   * @returns {Promise<Array>} Danh sách chính sách cọc
   */
  static async layDanhSach(chuDuAnID, chiLayHieuLuc = true) {
    try {
      let query = `
        SELECT 
          csc.ChinhSachCocID,
          csc.ChuDuAnID,
          csc.TenChinhSach,
          csc.MoTa,
          csc.ChoPhepCocGiuCho,
          csc.TTL_CocGiuCho_Gio,
          csc.TyLePhat_CocGiuCho,
          csc.ChoPhepCocAnNinh,
          csc.SoTienCocAnNinhMacDinh,
          csc.QuyTacGiaiToa,
          csc.HieuLuc,
          csc.TaoLuc,
          csc.CapNhatLuc,
          COUNT(DISTINCT td.TinDangID) AS SoTinDangSuDung
        FROM chinhsachcoc csc
        LEFT JOIN tindang td ON td.ChinhSachCocID = csc.ChinhSachCocID
        WHERE (csc.ChuDuAnID = ? OR csc.ChinhSachCocID = 1)
      `;

      const params = [chuDuAnID];

      if (chiLayHieuLuc) {
        query += ` AND csc.HieuLuc = 1`;
      }

      query += `
        GROUP BY csc.ChinhSachCocID
        ORDER BY csc.ChinhSachCocID = 1, csc.ChuDuAnID IS NULL, csc.HieuLuc DESC, csc.TaoLuc DESC
      `;

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.layDanhSach() error:', error);
      throw error;
    }
  }

  /**
   * Lấy chính sách cọc mặc định của hệ thống
   * @returns {Promise<Object>} Chính sách cọc mặc định (ID = 1)
   */
  static async layMacDinh() {
    try {
      const query = `
        SELECT * FROM chinhsachcoc 
        WHERE ChinhSachCocID = 1
      `;
      const [rows] = await db.query(query);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.layMacDinh() error:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một chính sách cọc
   * @param {number} chinhSachCocID - ID của chính sách cọc
   * @returns {Promise<Object>} Chi tiết chính sách cọc
   */
  static async layChiTiet(chinhSachCocID) {
    try {
      const query = `
        SELECT 
          csc.*,
          COUNT(DISTINCT td.TinDangID) AS SoTinDangSuDung
        FROM chinhsachcoc csc
        LEFT JOIN tindang td ON td.ChinhSachCocID = csc.ChinhSachCocID
        WHERE csc.ChinhSachCocID = ?
        GROUP BY csc.ChinhSachCocID
      `;
      const [rows] = await db.query(query, [chinhSachCocID]);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.layChiTiet() error:', error);
      throw error;
    }
  }

  /**
   * Tạo chính sách cọc mới
   * @param {number} chuDuAnID - ID của Chủ dự án
   * @param {Object} data - Dữ liệu chính sách cọc
   * @param {string} data.TenChinhSach - Tên chính sách (required)
   * @param {string} data.MoTa - Mô tả (optional)
   * @param {boolean} data.ChoPhepCocGiuCho - Cho phép cọc giữ chỗ (default: true)
   * @param {number} data.TTL_CocGiuCho_Gio - TTL cọc giữ chỗ (giờ) (default: 48)
   * @param {number} data.TyLePhat_CocGiuCho - Tỷ lệ phạt (%) (default: 0.00)
   * @param {boolean} data.ChoPhepCocAnNinh - Cho phép cọc an ninh (default: true)
   * @param {string} data.QuyTacGiaiToa - Quy tắc giải tỏa: 'BanGiao'|'TheoNgay'|'Khac' (default: 'BanGiao')
   * @param {boolean} data.HieuLuc - Hiệu lực (default: true)
   * @returns {Promise<number>} ID của chính sách cọc vừa tạo
   */
  static async taoMoi(chuDuAnID, data) {
    try {
      const query = `
        INSERT INTO chinhsachcoc (
          ChuDuAnID,
          TenChinhSach,
          MoTa,
          ChoPhepCocGiuCho,
          TTL_CocGiuCho_Gio,
          TyLePhat_CocGiuCho,
          ChoPhepCocAnNinh,
          SoTienCocAnNinhMacDinh,
          QuyTacGiaiToa,
          HieuLuc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        chuDuAnID,
        data.TenChinhSach,
        data.MoTa || null,
        data.ChoPhepCocGiuCho !== undefined ? data.ChoPhepCocGiuCho : 1,
        data.TTL_CocGiuCho_Gio || 48,
        data.TyLePhat_CocGiuCho || 0.00,
        data.ChoPhepCocAnNinh !== undefined ? data.ChoPhepCocAnNinh : 1,
        data.SoTienCocAnNinhMacDinh ?? null,
        data.QuyTacGiaiToa || 'BanGiao',
        data.HieuLuc !== undefined ? data.HieuLuc : 1
      ];

      const [result] = await db.query(query, params);
      return result.insertId;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.taoMoi() error:', error);
      throw error;
    }
  }

  /**
   * Cập nhật chính sách cọc
   * @param {number} chinhSachCocID - ID của chính sách cọc
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Promise<boolean>} true nếu cập nhật thành công
   */
  static async capNhat(chinhSachCocID, data) {
    try {
      // Kiểm tra chính sách có tồn tại không
      const existing = await this.layChiTiet(chinhSachCocID);
      if (!existing) {
        throw new Error('Chính sách cọc không tồn tại');
      }

      // Không cho phép cập nhật chính sách mặc định (ID = 1)
      if (chinhSachCocID === 1) {
        throw new Error('Không thể cập nhật chính sách cọc mặc định của hệ thống');
      }

      const updateFields = [];
      const params = [];

      // Chỉ cập nhật các fields có trong data
      if (data.TenChinhSach !== undefined) {
        updateFields.push('TenChinhSach = ?');
        params.push(data.TenChinhSach);
      }
      if (data.MoTa !== undefined) {
        updateFields.push('MoTa = ?');
        params.push(data.MoTa);
      }
      if (data.ChoPhepCocGiuCho !== undefined) {
        updateFields.push('ChoPhepCocGiuCho = ?');
        params.push(data.ChoPhepCocGiuCho ? 1 : 0);
      }
      if (data.TTL_CocGiuCho_Gio !== undefined) {
        updateFields.push('TTL_CocGiuCho_Gio = ?');
        params.push(data.TTL_CocGiuCho_Gio);
      }
      if (data.TyLePhat_CocGiuCho !== undefined) {
        updateFields.push('TyLePhat_CocGiuCho = ?');
        params.push(data.TyLePhat_CocGiuCho);
      }
      if (data.ChoPhepCocAnNinh !== undefined) {
        updateFields.push('ChoPhepCocAnNinh = ?');
        params.push(data.ChoPhepCocAnNinh ? 1 : 0);
      }
      if (data.SoTienCocAnNinhMacDinh !== undefined) {
        updateFields.push('SoTienCocAnNinhMacDinh = ?');
        params.push(data.SoTienCocAnNinhMacDinh);
      }
      if (data.QuyTacGiaiToa !== undefined) {
        updateFields.push('QuyTacGiaiToa = ?');
        params.push(data.QuyTacGiaiToa);
      }
      if (data.HieuLuc !== undefined) {
        updateFields.push('HieuLuc = ?');
        params.push(data.HieuLuc ? 1 : 0);
      }

      if (updateFields.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      params.push(chinhSachCocID);

      const query = `
        UPDATE chinhsachcoc 
        SET ${updateFields.join(', ')}
        WHERE ChinhSachCocID = ?
      `;

      const [result] = await db.query(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.capNhat() error:', error);
      throw error;
    }
  }

  /**
   * Vô hiệu hóa chính sách cọc (soft delete)
   * @param {number} chinhSachCocID - ID của chính sách cọc
   * @returns {Promise<boolean>} true nếu vô hiệu hóa thành công
   */
  static async voHieuHoa(chinhSachCocID) {
    try {
      // Không cho phép vô hiệu hóa chính sách mặc định
      if (chinhSachCocID === 1) {
        throw new Error('Không thể vô hiệu hóa chính sách cọc mặc định của hệ thống');
      }

      // Kiểm tra có tin đăng nào đang sử dụng không
      const chiTiet = await this.layChiTiet(chinhSachCocID);
      if (!chiTiet) {
        throw new Error('Chính sách cọc không tồn tại');
      }

      if (chiTiet.SoTinDangSuDung > 0) {
        throw new Error(
          `Không thể vô hiệu hóa chính sách cọc đang được sử dụng bởi ${chiTiet.SoTinDangSuDung} tin đăng`
        );
      }

      const query = `
        UPDATE chinhsachcoc 
        SET HieuLuc = 0
        WHERE ChinhSachCocID = ?
      `;

      const [result] = await db.query(query, [chinhSachCocID]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.voHieuHoa() error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra quyền sở hữu chính sách cọc
   * @param {number} chinhSachCocID - ID của chính sách cọc
   * @param {number} chuDuAnID - ID của Chủ dự án
   * @returns {Promise<boolean>} true nếu Chủ dự án sở hữu chính sách này
   */
  static async kiemTraQuyenSoHuu(chinhSachCocID, chuDuAnID) {
    try {
      // Chính sách mặc định (ID = 1) thuộc hệ thống, mọi người đều có thể sử dụng
      if (chinhSachCocID === 1) {
        return true;
      }

      const query = `
        SELECT COUNT(*) AS count
        FROM chinhsachcoc
        WHERE ChinhSachCocID = ? AND ChuDuAnID = ?
      `;

      const [rows] = await db.query(query, [chinhSachCocID, chuDuAnID]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('❌ ChinhSachCocModel.kiemTraQuyenSoHuu() error:', error);
      throw error;
    }
  }
}

module.exports = ChinhSachCocModel;
