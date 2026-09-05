import axiosClient from "./axiosClient";

const viApi = {
  // Lấy tất cả ví
  getAll: () => axiosClient.get("/vi"),

  // Lấy ví theo người dùng (id là NguoiDungID)
  getByUser: (id) => axiosClient.get(`/vi/${id}`),
};

export default viApi;
