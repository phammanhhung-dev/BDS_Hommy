import axiosClient from './axiosClient';

const chuDuAnApi = {
  getProjectRooms: (duAnId, params = {}) =>
    axiosClient.get(`/chu-du-an/du-an/${duAnId}/phong`, { params }),

  createProjectRoom: (duAnId, data) =>
    axiosClient.post(`/chu-du-an/du-an/${duAnId}/phong`, data),

  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('anh', file));
    return axiosClient.post('/chu-du-an/upload-anh', formData);
  },

  getContracts: (params = {}) =>
    axiosClient.get('/chu-du-an/hop-dong', { params }),

  // THÔNG BÁO
  layDanhSachThongBao: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosClient.get(`/chu-du-an/thong-bao?${params.toString()}`);
    return response.data;
  },

  demThongBaoChuaDoc: async () => {
    const response = await axiosClient.get('/chu-du-an/thong-bao/dem-chua-doc');
    return response.data;
  },

  danhDauDaDoc: async (thongBaoId) => {
    const response = await axiosClient.put(`/chu-du-an/thong-bao/${thongBaoId}/doc`);
    return response.data;
  },

  danhDauDocTatCa: async () => {
    const response = await axiosClient.put('/chu-du-an/thong-bao/doc-tat-ca');
    return response.data;
  }
};

export default chuDuAnApi;
