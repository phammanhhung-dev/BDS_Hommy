import axiosClient from "./axiosClient";

const viApi = {
  // Lấy tất cả ví
  getAll: () => axiosClient.get("/vi"),

  // Lấy ví theo người dùng (id là NguoiDungID)
  getByUser: (id) => axiosClient.get(`/vi/${id}`),

  // Thanh toán cọc
  thanhToanCoc: (data) => axiosClient.post('/vi/thanh-toan-coc', data),
};

export default viApi;
