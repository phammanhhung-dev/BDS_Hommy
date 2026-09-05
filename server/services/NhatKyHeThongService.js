/**
 * Service xử lý Nhật ký hệ thống (Audit Log)
 * Ghi lại tất cả các hành động quan trọng để kiểm toán
 */

const db = require('../config/db');

class NhatKyHeThongService {
  /**
   * Ghi nhận một hành động vào nhật ký hệ thống
   * Hỗ trợ cả 2 format: legacy (positional args) và mới (object)
   * 
   * Format mới (object):
   * @param {Object} data
   * @param {string} data.TacNhan - Tác nhân (Operator, ChuDuAn, NhanVienBanHang, etc.)
   * @param {number} data.NguoiDungID - ID người thực hiện
   * @param {string} data.HanhDong - Hành động
   * @param {string} data.DoiTuong - Đối tượng
   * @param {number} data.DoiTuongID - ID đối tượng
   * @param {Object} data.ChiTiet - Chi tiết (JSON)
   * @param {string} [data.DiaChiIP] - IP
   * @param {string} [data.TrinhDuyet] - User Agent
   * @param {string} [data.ChuKy] - Chữ ký số
   * 
   * Format legacy (positional):
   * @param {number} nguoiDungId ID người thực hiện hành động
   * @param {string} hanhDong Tên hành động (ví dụ: 'tao_tin_dang', 'duyet_tin_dang')
   * @param {string} doiTuong Loại đối tượng (ví dụ: 'TinDang', 'CuocHen', 'NguoiDung')
   * @param {number|null} doiTuongId ID của đối tượng (có thể null)
   * @param {Object|null} giaTriTruoc Giá trị trước khi thay đổi (JSON)
   * @param {Object|null} giaTriSau Giá trị sau khi thay đổi (JSON)
   * @param {string} diaChiIP Địa chỉ IP của người thực hiện
   * @param {string} trinhDuyet User Agent của trình duyệt
   * @param {string|null} chuKy Chữ ký số (nếu có)
   * @returns {Promise<number>} ID của bản ghi nhật ký vừa tạo
   */
  static async ghiNhan(
    nguoiDungIdOrData,
    hanhDong,
    doiTuong,
    doiTuongId = null,
    giaTriTruoc = null,
    giaTriSau = null,
    diaChiIP = '',
    trinhDuyet = '',
    chuKy = null
  ) {
    try {
      let nguoiDungId, chiTiet;

      // Detect format: nếu arg đầu tiên là object → format mới
      if (typeof nguoiDungIdOrData === 'object' && nguoiDungIdOrData !== null) {
        const data = nguoiDungIdOrData;
        nguoiDungId = data.NguoiDungID;
        hanhDong = data.HanhDong;
        doiTuong = data.DoiTuong;
        doiTuongId = data.DoiTuongID || null;
        chiTiet = data.ChiTiet || null;
        diaChiIP = data.DiaChiIP || '';
        trinhDuyet = data.TrinhDuyet || '';
        chuKy = data.ChuKy || null;
        
        // Gộp GiaTriTruoc/GiaTriSau vào ChiTiet nếu có
        giaTriTruoc = chiTiet;
        giaTriSau = null;
      } else {
        // Format legacy
        nguoiDungId = nguoiDungIdOrData;
      }

      const query = `
        INSERT INTO nhatkyhethong (
          NguoiDungID, HanhDong, DoiTuong, DoiTuongID,
          GiaTriTruoc, GiaTriSau, DiaChiIP, TrinhDuyet, ChuKy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        nguoiDungId,
        hanhDong,
        doiTuong,
        doiTuongId,
        giaTriTruoc ? JSON.stringify(giaTriTruoc) : null,
        giaTriSau ? JSON.stringify(giaTriSau) : null,
        diaChiIP,
        trinhDuyet,
        chuKy
      ]);

      return result.insertId;
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến luồng chính
      console.error('Lỗi ghi nhật ký hệ thống:', error);
      return null;
    }
  }

  /**
   * Lấy nhật ký hệ thống theo bộ lọc
   * @param {Object} filters Bộ lọc
   * @returns {Promise<Array>}
   */
  static async layNhatKy(filters = {}) {
    try {
      let query = `
        SELECT 
          nk.NhatKyID, nk.NguoiDungID, nk.HanhDong, nk.DoiTuong, nk.DoiTuongID,
          nk.GiaTriTruoc, nk.GiaTriSau, nk.DiaChiIP, nk.TrinhDuyet, 
          nk.ThoiGian, nk.ChuKy,
          nd.TenDayDu as NguoiThucHien, nd.Email
        FROM nhatkyhethong nk
        LEFT JOIN nguoidung nd ON nk.NguoiDungID = nd.NguoiDungID
        WHERE 1=1
      `;

      const params = [];

      if (filters.nguoiDungId) {
        query += ' AND nk.NguoiDungID = ?';
        params.push(filters.nguoiDungId);
      }

      if (filters.hanhDong) {
        query += ' AND nk.HanhDong = ?';
        params.push(filters.hanhDong);
      }

      if (filters.doiTuong) {
        query += ' AND nk.DoiTuong = ?';
        params.push(filters.doiTuong);
      }

      if (filters.doiTuongId) {
        query += ' AND nk.DoiTuongID = ?';
        params.push(filters.doiTuongId);
      }

      if (filters.tuNgay && filters.denNgay) {
        query += ' AND nk.ThoiGian BETWEEN ? AND ?';
        params.push(filters.tuNgay, filters.denNgay);
      }

      query += ' ORDER BY nk.ThoiGian DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const [rows] = await db.execute(query, params);
      
      // Parse JSON cho GiaTriTruoc và GiaTriSau
      return rows.map(row => ({
        ...row,
        GiaTriTruoc: row.GiaTriTruoc ? JSON.parse(row.GiaTriTruoc) : null,
        GiaTriSau: row.GiaTriSau ? JSON.parse(row.GiaTriSau) : null
      }));
    } catch (error) {
      throw new Error(`Lỗi khi lấy nhật ký hệ thống: ${error.message}`);
    }
  }

  /**
   * Các hành động thường dùng (constants)
   */
  static get HANH_DONG() {
    return {
      // Tin đăng
      TAO_TIN_DANG: 'tao_tin_dang',
      CAP_NHAT_TIN_DANG: 'cap_nhat_tin_dang',
      GUI_TIN_DANG_DE_DUYET: 'gui_tin_dang_de_duyet',
      DUYET_TIN_DANG: 'duyet_tin_dang',
      TU_CHOI_TIN_DANG: 'tu_choi_tin_dang',
      XOA_TIN_DANG: 'xoa_tin_dang',

      // Cuộc hẹn
      TAO_CUOC_HEN: 'tao_cuoc_hen',
      XAC_NHAN_CUOC_HEN: 'xac_nhan_cuoc_hen',
      HUY_CUOC_HEN: 'huy_cuoc_hen',
      DOI_LICH_CUOC_HEN: 'doi_lich_cuoc_hen',
      HOAN_THANH_CUOC_HEN: 'hoan_thanh_cuoc_hen',

      // Cọc và giao dịch
      DAT_COC_GIU_CHO: 'dat_coc_giu_cho',
      DAT_COC_AN_NINH: 'dat_coc_an_ninh',
      HOAN_COC: 'hoan_coc',
      GIAI_TOA_COC: 'giai_toa_coc',

      // Hợp đồng và bàn giao
      BAO_CAO_HOP_DONG_THUE: 'bao_cao_hop_dong_thue',
      LAP_BIEN_BAN_BAN_GIAO: 'lap_bien_ban_ban_giao',
      KY_HOP_DONG: 'ky_hop_dong',

      // Tài khoản
      DANG_NHAP_THANH_CONG: 'dang_nhap_thanh_cong',
      DANG_NHAP_THAT_BAI: 'dang_nhap_that_bai',
      DANG_KY_TAI_KHOAN: 'dang_ky_tai_khoan',
      THAY_DOI_VAI_TRO: 'thay_doi_vai_tro',
      KHOA_TAI_KHOAN: 'khoa_tai_khoan',
      MO_KHOA_TAI_KHOAN: 'mo_khoa_tai_khoan',

      // Báo cáo
      CHU_DU_AN_XEM_BAO_CAO: 'chu_du_an_xem_bao_cao',
      XEM_BAO_CAO_TAI_CHINH: 'xem_bao_cao_tai_chinh',

      // Hệ thống
      CAP_NHAT_CHINH_SACH: 'cap_nhat_chinh_sach',
      THAY_DOI_CAU_HINH: 'thay_doi_cau_hinh'
    };
  }

  /**
   * Các đối tượng thường dùng (constants)
   */
  static get DOI_TUONG() {
    return {
      TIN_DANG: 'TinDang',
      CUOC_HEN: 'CuocHen',
      NGUOI_DUNG: 'NguoiDung',
      DU_AN: 'DuAn',
      PHONG: 'Phong',
      GIAO_DICH: 'GiaoDich',
      COC: 'Coc',
      HOP_DONG: 'HopDong',
      BIEN_BAN_BAN_GIAO: 'BienBanBanGiao',
      BAO_CAO: 'BaoCao',
      CHINH_SACH: 'ChinhSach'
    };
  }
}

module.exports = NhatKyHeThongService;