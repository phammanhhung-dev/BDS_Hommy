import axiosClient from "./axiosClient";

/**
 * Lấy danh sách người phụ trách dự án theo ID dự án
 * @param {number|string} duAnId
 * @returns {Promise<Object>} Response từ backend
 */
const nguoiPhuTrachDuAnApi = {
  getByDuAnId: (duAnId) => axiosClient.get(`/nguoi-phu-trach-du-an/${duAnId}`),
};

export default nguoiPhuTrachDuAnApi;
