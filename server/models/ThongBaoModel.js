/**
 * Model cho Thông báo
 * Quản lý thông báo cho Nhân viên Bán hàng
 */

const db = require('../config/db');

/**
 * @typedef {Object} ThongBao
 * @property {number} ThongBaoID
 * @property {number} NguoiNhanID
 * @property {string} Kenh - 'in-app', 'email', 'sms'
 * @property {string} TieuDe
 * @property {string} NoiDung
 * @property {Object} Payload - JSON object chứa dữ liệu bổ sung
 * @property {string} TrangThai - 'ChuaDoc', 'DaDoc', 'DaXoa'
 * @property {number} SoLanThu
 * @property {Date} TaoLuc
 * @property {Date} GuiLuc
 */

class ThongBaoModel {
  /**
   * Tạo thông báo mới
   * @param {Object} data - Dữ liệu thông báo
   * @param {number} data.NguoiNhanID
   * @param {string} [data.Kenh='in-app']
   * @param {string} data.TieuDe
   * @param {string} data.NoiDung
   * @param {Object} [data.Payload={}]
   * @param {string} [data.TrangThai='ChuaDoc']
   * @returns {Promise<{ThongBaoID: number}>}
   */
  static async taoMoi(data) {
    try {
      const {
        NguoiNhanID,
        Kenh = 'in-app',
        TieuDe,
        NoiDung,
        Payload = {},
        TrangThai = 'ChuaDoc'
      } = data;

      if (!NguoiNhanID || !TieuDe || !NoiDung) {
        throw new Error('Thiếu thông tin bắt buộc: NguoiNhanID, TieuDe, NoiDung');
      }

      const [result] = await db.execute(
        `INSERT INTO thongbao 
        (NguoiNhanID, Kenh, TieuDe, NoiDung, Payload, TrangThai, GuiLuc) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          NguoiNhanID,
          Kenh,
          TieuDe,
          NoiDung,
          JSON.stringify(Payload),
          TrangThai
        ]
      );

      return { ThongBaoID: result.insertId };
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi tạo thông báo:', error);
      throw new Error(`Lỗi khi tạo thông báo: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách thông báo với pagination
   * @param {number} nguoiDungId - ID người dùng
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.trangThai] - 'ChuaDoc', 'DaDoc', 'DaXoa'
   * @param {string} [filters.loai] - Loại thông báo từ Payload.type
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số lượng mỗi trang
   * @returns {Promise<{data: Array<ThongBao>, total: number, page: number, limit: number}>}
   */
  static async seedSampleNotifications(nguoiDungId) {
    try {
      const now = Date.now();
      const samples = [
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Đăng nhập thành công',
          NoiDung: 'Tài khoản của bạn vừa đăng nhập thành công vào hệ thống Hommy Website.',
          Payload: JSON.stringify({ type: 'tin-dang', subType: 'dang_nhap', icon: '🔐' }),
          TrangThai: 'ChuaDoc',
          TaoLuc: new Date(now - 3 * 60 * 1000)
        },
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Nạp tiền vào ví thành công',
          NoiDung: 'Số tiền 500.000 ₫ đã được nạp thành công vào Ví Hommy qua chuyển khoản QR.',
          Payload: JSON.stringify({ type: 'tai-chinh', subType: 'nap_tien', amount: 500000, icon: '💰', url: '/vi' }),
          TrangThai: 'ChuaDoc',
          TaoLuc: new Date(now - 2 * 3600 * 1000)
        },
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Tin đăng #1024 đã được duyệt',
          NoiDung: 'Tin đăng "Căn hộ cao cấp 2PN Quận 1" đã được kiểm duyệt thành công và hiển thị công khai.',
          Payload: JSON.stringify({ type: 'tin-dang', subType: 'tin_dang_duyet', tinDangId: 1024, icon: '🏠', url: '/chu-du-an/tin-dang' }),
          TrangThai: 'DaDoc',
          TaoLuc: new Date(now - 24 * 3600 * 1000)
        },
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Ưu đãi thành viên mới: Tặng Voucher VIP 20%',
          NoiDung: 'Chào mừng bạn đến với Hommy! Nhập mã HOMMY20OFF để được giảm 20% khi thanh toán gói tin VIP.',
          Payload: JSON.stringify({ type: 'khuyen-mai', subType: 'voucher', code: 'HOMMY20OFF', icon: '🎁', url: '/vi' }),
          TrangThai: 'ChuaDoc',
          TaoLuc: new Date(now - 2 * 86400 * 1000)
        },
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Thanh toán dịch vụ tin VIP',
          NoiDung: 'Đã trừ 100.000 ₫ từ Ví Hommy cho dịch vụ Đăng tin VIP Nổi bật 7 ngày.',
          Payload: JSON.stringify({ type: 'tai-chinh', subType: 'thanh_toan', amount: 100000, icon: '💳', url: '/vi' }),
          TrangThai: 'DaDoc',
          TaoLuc: new Date(now - 3 * 86400 * 1000)
        },
        {
          NguoiNhanID: nguoiDungId,
          Kenh: 'in-app',
          TieuDe: 'Chương trình Ưu đãi nạp tiền tháng 9',
          NoiDung: 'Tặng ngay 10% giá trị khi nạp từ 500.000 ₫ vào Ví Hommy áp dụng đến 30/09.',
          Payload: JSON.stringify({ type: 'khuyen-mai', subType: 'uu_dai_nap', icon: '🎉', url: '/vi' }),
          TrangThai: 'DaDoc',
          TaoLuc: new Date(now - 5 * 86400 * 1000)
        }
      ];

      for (const item of samples) {
        await db.execute(
          `INSERT INTO thongbao (NguoiNhanID, Kenh, TieuDe, NoiDung, Payload, TrangThai, TaoLuc, GuiLuc)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [item.NguoiNhanID, item.Kenh, item.TieuDe, item.NoiDung, item.Payload, item.TrangThai, item.TaoLuc]
        );
      }
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi seed thông báo mẫu:', error);
    }
  }

  static async layDanhSach(nguoiDungId, filters = {}) {
    try {
      const {
        trangThai,
        loai,
        page = 1,
        limit = 20
      } = filters;

      // Đảm bảo limit và offset là số nguyên hợp lệ
      const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const safePage = Math.max(1, parseInt(page) || 1);
      const safeOffset = (safePage - 1) * safeLimit;

      // Kiểm tra nếu người dùng chưa có thông báo nào -> Seed thông báo mẫu
      const [checkRows] = await db.execute(
        `SELECT COUNT(*) as total FROM thongbao WHERE NguoiNhanID = ? AND TrangThai != 'DaXoa'`,
        [nguoiDungId]
      );

      if (checkRows[0]?.total === 0) {
        await this.seedSampleNotifications(nguoiDungId);
      }

      let query = `
        SELECT 
          ThongBaoID, NguoiNhanID, Kenh, TieuDe, NoiDung, 
          Payload, TrangThai, SoLanThu, TaoLuc, GuiLuc
        FROM thongbao
        WHERE NguoiNhanID = ? AND TrangThai != 'DaXoa'
      `;

      const params = [nguoiDungId];

      if (trangThai) {
        query += ' AND TrangThai = ?';
        params.push(trangThai);
      }

      // Count total - dùng query riêng để đếm
      const countQuery = `
        SELECT COUNT(*) as total
        FROM thongbao
        WHERE NguoiNhanID = ? AND TrangThai != 'DaXoa'
        ${trangThai ? 'AND TrangThai = ?' : ''}
      `;

      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Add pagination - sử dụng string interpolation an toàn cho LIMIT/OFFSET
      query += ` ORDER BY TaoLuc DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await db.execute(query, params);

      // Parse Payload JSON
      const data = rows.map(row => ({
        ...row,
        Payload: typeof row.Payload === 'string' 
          ? JSON.parse(row.Payload || '{}') 
          : row.Payload
      }));

      // Filter by loai if specified (from Payload.type)
      const filteredData = loai
        ? data.filter(item => item.Payload?.type === loai)
        : data;

      return {
        data: filteredData,
        total: loai ? filteredData.length : total,
        page: safePage,
        limit: safeLimit
      };
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi lấy danh sách thông báo:', error);
      throw new Error(`Lỗi khi lấy danh sách thông báo: ${error.message}`);
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   * @param {number} thongBaoId - ID thông báo
   * @param {number} nguoiDungId - ID người dùng
   * @returns {Promise<boolean>}
   */
  static async danhDauDaDoc(thongBaoId, nguoiDungId) {
    try {
      const [result] = await db.execute(
        `UPDATE thongbao 
        SET TrangThai = 'DaDoc' 
        WHERE ThongBaoID = ? AND NguoiNhanID = ?`,
        [thongBaoId, nguoiDungId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi đánh dấu đã đọc:', error);
      throw new Error(`Lỗi khi đánh dấu đã đọc: ${error.message}`);
    }
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * @param {number} nguoiDungId - ID người dùng
   * @returns {Promise<number>} - Số lượng thông báo đã cập nhật
   */
  static async danhDauDocTatCa(nguoiDungId) {
    try {
      const [result] = await db.execute(
        `UPDATE thongbao 
        SET TrangThai = 'DaDoc' 
        WHERE NguoiNhanID = ? AND TrangThai = 'ChuaDoc'`,
        [nguoiDungId]
      );

      return result.affectedRows;
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi đánh dấu tất cả đã đọc:', error);
      throw new Error(`Lỗi khi đánh dấu tất cả đã đọc: ${error.message}`);
    }
  }

  /**
   * Đếm số thông báo chưa đọc
   * @param {number} nguoiDungId - ID người dùng
   * @returns {Promise<number>}
   */
  static async demChuaDoc(nguoiDungId) {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) as count 
        FROM thongbao 
        WHERE NguoiNhanID = ? AND TrangThai = 'ChuaDoc'`,
        [nguoiDungId]
      );

      return rows[0]?.count || 0;
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi đếm thông báo chưa đọc:', error);
      throw new Error(`Lỗi khi đếm thông báo chưa đọc: ${error.message}`);
    }
  }

  /**
   * Lấy thông báo theo ID
   * @param {number} thongBaoId - ID thông báo
   * @param {number} nguoiDungId - ID người dùng (để kiểm tra quyền)
   * @returns {Promise<ThongBao|null>}
   */
  static async layTheoID(thongBaoId, nguoiDungId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          ThongBaoID, NguoiNhanID, Kenh, TieuDe, NoiDung, 
          Payload, TrangThai, SoLanThu, TaoLuc, GuiLuc
        FROM thongbao
        WHERE ThongBaoID = ? AND NguoiNhanID = ?`,
        [thongBaoId, nguoiDungId]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        ...row,
        Payload: typeof row.Payload === 'string' 
          ? JSON.parse(row.Payload || '{}') 
          : row.Payload
      };
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi lấy thông báo theo ID:', error);
      throw new Error(`Lỗi khi lấy thông báo: ${error.message}`);
    }
  }

  /**
   * Xóa một thông báo (soft-delete)
   * @param {number} thongBaoId - ID thông báo
   * @param {number} nguoiDungId - ID người dùng
   * @returns {Promise<boolean>}
   */
  static async xoa(thongBaoId, nguoiDungId) {
    try {
      const [result] = await db.execute(
        `UPDATE thongbao 
        SET TrangThai = 'DaXoa' 
        WHERE ThongBaoID = ? AND NguoiNhanID = ?`,
        [thongBaoId, nguoiDungId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi xóa thông báo:', error);
      throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
    }
  }

  /**
   * Xóa tất cả thông báo của người dùng (soft-delete)
   * @param {number} nguoiDungId - ID người dùng
   * @returns {Promise<number>}
   */
  static async xoaTatCa(nguoiDungId) {
    try {
      const [result] = await db.execute(
        `UPDATE thongbao 
        SET TrangThai = 'DaXoa' 
        WHERE NguoiNhanID = ? AND TrangThai != 'DaXoa'`,
        [nguoiDungId]
      );

      return result.affectedRows;
    } catch (error) {
      console.error('[ThongBaoModel] Lỗi xóa tất cả thông báo:', error);
      throw new Error(`Lỗi khi xóa tất cả thông báo: ${error.message}`);
    }
  }
}

module.exports = ThongBaoModel;


