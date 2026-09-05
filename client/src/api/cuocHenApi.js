import axiosClient from "./axiosClient";

const cuocHenApi = {
  // Public
  create: (data) => axiosClient.post("/cuoc-hen", data), // POST /api/cuoc-hen
  getAll: (params) => axiosClient.get("/cuoc-hen", { params }), // GET /api/cuoc-hen
  getById: (id) => axiosClient.get(`/cuoc-hen/${id}`), // GET /api/cuoc-hen/:id
  findByKhachHang: (khachHangId) =>
    axiosClient.get(`/cuoc-hen/search/khach-hang/${khachHangId}`),
  findByNhanVien: (nhanVienId) =>
    axiosClient.get(`/cuoc-hen/search/nhan-vien/${nhanVienId}`),
  findByChuDuAn: (chuDuAnId) =>
    axiosClient.get(`/cuoc-hen/search/chu-du-an/${chuDuAnId}`),

  // Update / Delete
  update: (id, data) => axiosClient.put(`/cuoc-hen/${id}`, data), // PUT /api/cuoc-hen/:id
  remove: (id) => axiosClient.delete(`/cuoc-hen/${id}`), // DELETE /api/cuoc-hen/:id

  // Endpoints scoped for chủ dự án (nếu backend cung cấp under /api/chu-du-an)
  chuDuAn: {
    list: (params) => axiosClient.get("/chu-du-an/cuoc-hen", { params }), // GET /api/chu-du-an/cuoc-hen
    xacNhan: (id, payload = {}) =>
      axiosClient.post(`/chu-du-an/cuoc-hen/${id}/xac-nhan`, payload),
    pheDuyet: (id, payload = {}) =>
      axiosClient.post(`/chu-du-an/cuoc-hen/${id}/phe-duyet`, payload),
    tuChoi: (id, payload = {}) =>
      axiosClient.post(`/chu-du-an/cuoc-hen/${id}/tu-choi`, payload),
    bulkAction: (payload) =>
      axiosClient.post('/chu-du-an/cuoc-hen/bulk-action', payload),
    metrics: () => axiosClient.get('/chu-du-an/cuoc-hen/metrics'),
  },
};

export default cuocHenApi;
