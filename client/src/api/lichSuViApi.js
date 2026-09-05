import axiosClient from "./axiosClient";

const lichSuViApi = {
  // Thêm mới lịch sử ví
  create: (data) => axiosClient.post("/lich-su-vi", data),

  // Sửa lịch sử ví theo id
  update: (id, data) => axiosClient.put(`/lich-su-vi/${id}`, data),

  // Lấy tất cả lịch sử ví
  getAll: () => axiosClient.get("/lich-su-vi"),

  // Lấy lịch sử ví theo user_id
  getByUser: (userId) => axiosClient.get(`/lich-su-vi/user/${userId}`),
};

export default lichSuViApi;
