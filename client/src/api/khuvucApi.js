import axiosClient from './axiosClient';

const khuvucApi = {
  getAll: (params) => axiosClient.get('/khuvucs', { params }),       // GET /api/khuvucs
  getTree: () => axiosClient.get('/khuvucs/tree'),                  // GET /api/khuvucs/tree
  getById: (id) => axiosClient.get(`/khuvucs/${id}`),
  getChildren: (parentId = null) =>
    axiosClient.get('/khuvucs', {
      params: {
        parentId: parentId ?? 'root'
      }
    }),
  getNhanVien: (id) => axiosClient.get(`/khuvucs/${id}/nhan-vien`),
  create: (data) => axiosClient.post('/khuvucs', data),
  update: (id, data) => axiosClient.put(`/khuvucs/${id}`, data),
  remove: (id) => axiosClient.delete(`/khuvucs/${id}`),
};

export default khuvucApi;