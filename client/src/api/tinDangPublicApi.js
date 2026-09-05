import axiosClient from "./axiosClient";

const tinDangPublicApi = {
  // GET /api/public/tin-dang
  getAll: (params) => axiosClient.get("/public/tin-dang", { params }),

  // GET /api/public/tin-dang/stats
  getStats: () => axiosClient.get("/public/tin-dang/stats"),

  // PUT /api/public/tin-dang/:id
  update: (id, data) => axiosClient.put(`/public/tin-dang/${id}`, data),

  // DELETE /api/public/tin-dang/:id
  remove: (id, data) => axiosClient.delete(`/public/tin-dang/${id}`, { data }),

  // POST /api/public/tin-dang/predict-price
  predictPrice: (data) => axiosClient.post("/public/tin-dang/predict-price", data),
};

export default tinDangPublicApi;
