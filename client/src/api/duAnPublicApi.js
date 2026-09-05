import axiosClient from "./axiosClient";

const duAnPublicApi = {
  // GET /api/public/du-an
  getAll: (params) => axiosClient.get("/public/du-an", { params }),

  // GET /api/public/du-an/:id
  getById: (id) => axiosClient.get(`/public/du-an/${id}`),

  // PUT /api/public/du-an/:id
  update: (id, data) => axiosClient.put(`/public/du-an/${id}`, data),

  // DELETE /api/public/du-an/:id
  remove: (id, data) => axiosClient.delete(`/public/du-an/${id}`, { data }),
};

export default duAnPublicApi;
