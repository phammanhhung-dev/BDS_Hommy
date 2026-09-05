import axiosClient from "./axiosClient";

const hopDongApi = {
  /**
   * Sinh snapshot hợp đồng từ server
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  generate(payload) {
    return axiosClient.post('/hop-dong/generate', payload);
  },

  /**
   * Ghi nhận xác nhận đặt cọc
   * @param {number} tinDangId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  confirmDeposit(tinDangId, data) {
    return axiosClient.post(`/hop-dong/${tinDangId}/confirm-deposit`, data);
  },

  /**
   * Lấy hợp đồng của khách hàng hiện tại
   */
  getCustomerContracts(params = {}) {
    return axiosClient.get('/hop-dong/khach-hang', { params });
  },

  /**
   * Lấy hợp đồng của chủ dự án
   */
  getChuDuAnContracts(params = {}) {
    return axiosClient.get('/chu-du-an/hop-dong', { params });
  },

  /**
   * Lấy hợp đồng admin/operator
   */
  getAdminContracts(params = {}) {
    return axiosClient.get('/admin/hop-dong', { params });
  },

  /**
   * Yêu cầu hủy hợp đồng bởi khách hàng
   */
  requestCancel(hopDongId) {
    return axiosClient.post(`/hop-dong/${hopDongId}/xin-huy`);
  },

  /**
   * Admin/Operator xác nhận hủy hợp đồng
   */
  confirmCancel(hopDongId) {
    return axiosClient.post(`/admin/hop-dong/${hopDongId}/xac-nhan-huy`);
  }
};

export default hopDongApi;

