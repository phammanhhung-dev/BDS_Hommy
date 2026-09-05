import axiosClient from './axiosClient';

const tinDangApi = {
  getAll: (params) => axiosClient.get('/tindangs', { params }), // GET /api/tindangs
  getById: (id) => axiosClient.get(`/tindangs/${id}`),          // GET /api/tindangs/:id
  create: (data) => axiosClient.post('/tindangs', data),        // POST /api/tindangs
  update: (id, data) => axiosClient.put(`/tindangs/${id}`, data), // PUT /api/tindangs/:id
  remove: (id) => axiosClient.delete(`/tindangs/${id}`),        // DELETE /api/tindangs/:id
  approve: (id, data) => axiosClient.post(`/tindangs/${id}/approve`, data), // POST /api/tindangs/:id/approve
};

export default tinDangApi;
