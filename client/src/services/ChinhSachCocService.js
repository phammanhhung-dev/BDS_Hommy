/**
 * Service gọi API Chính sách Cọc
 * Endpoint: /api/chu-du-an/chinh-sach-coc
 */

import axiosClient from '../api/axiosClient';

const ChinhSachCocService = {
  /**
   * Lấy danh sách chính sách cọc (của Chủ dự án + mặc định hệ thống)
   * @param {Object} params - Query params
   * @param {boolean} params.chiLayHieuLuc - Chỉ lấy chính sách hiệu lực (default: true)
   * @returns {Promise<Array>} Danh sách chính sách cọc với SoTinDangSuDung
   */
  async layDanhSach(params = {}) {
    try {
      const response = await axiosClient.get('/chu-du-an/chinh-sach-coc', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Lỗi layDanhSach ChinhSachCoc:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một chính sách cọc
   * @param {number} chinhSachCocId - ID chính sách cọc
   * @returns {Promise<Object>} Chi tiết chính sách cọc với SoTinDangSuDung
   */
  async layChiTiet(chinhSachCocId) {
    try {
      const response = await axiosClient.get(`/chu-du-an/chinh-sach-coc/${chinhSachCocId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi layChiTiet ChinhSachCoc ID ${chinhSachCocId}:`, error);
      throw error;
    }
  },

  /**
   * Tạo mới chính sách cọc
   * @param {Object} data - Dữ liệu chính sách cọc
   * @param {string} data.TenChinhSach - Tên chính sách (required, 1-255 chars)
   * @param {string} data.MoTa - Mô tả chi tiết (optional)
   * @param {boolean} data.ChoPhepCocGiuCho - Cho phép cọc giữ chỗ (default: true)
   * @param {number} data.TTL_CocGiuCho_Gio - TTL cọc giữ chỗ (1-168 giờ)
   * @param {number} data.TyLePhat_CocGiuCho - Tỷ lệ phạt cọc giữ chỗ (0-100%)
   * @param {boolean} data.ChoPhepCocAnNinh - Cho phép cọc an ninh (default: false)
   * @param {number} data.SoTienCocAnNinhMacDinh - Số tiền cọc giữ chỗ (>= 0)
   * @param {string} data.QuyTacGiaiToa - Quy tắc giải tỏa ('BanGiao', 'TheoNgay', 'Khac')
   * @returns {Promise<Object>} Chính sách cọc vừa tạo
   */
  async taoMoi(data) {
    try {
      const response = await axiosClient.post('/chu-du-an/chinh-sach-coc', data);
      return response.data;
    } catch (error) {
      console.error('❌ Lỗi taoMoi ChinhSachCoc:', error);
      throw error;
    }
  },

  /**
   * Cập nhật chính sách cọc (partial update)
   * @param {number} chinhSachCocId - ID chính sách cọc
   * @param {Object} data - Dữ liệu cần update (partial)
   * @returns {Promise<Object>} Chính sách cọc sau khi update
   */
  async capNhat(chinhSachCocId, data) {
    try {
      const response = await axiosClient.put(`/chu-du-an/chinh-sach-coc/${chinhSachCocId}`, data);
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi capNhat ChinhSachCoc ID ${chinhSachCocId}:`, error);
      throw error;
    }
  },

  /**
   * Vô hiệu hóa chính sách cọc (soft delete)
   * @param {number} chinhSachCocId - ID chính sách cọc
   * @returns {Promise<Object>} Response success
   * @throws {Error} 409 Conflict nếu chính sách đang được sử dụng
   */
  async voHieuHoa(chinhSachCocId) {
    try {
      const response = await axiosClient.delete(`/chu-du-an/chinh-sach-coc/${chinhSachCocId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi voHieuHoa ChinhSachCoc ID ${chinhSachCocId}:`, error);
      // Xử lý riêng lỗi 409 (đang sử dụng)
      if (error.response?.status === 409) {
        throw new Error('Không thể vô hiệu hóa chính sách đang được sử dụng bởi tin đăng');
      }
      throw error;
    }
  },
};

export default ChinhSachCocService;
