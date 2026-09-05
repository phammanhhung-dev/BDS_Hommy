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
};

export default chuDuAnApi;
