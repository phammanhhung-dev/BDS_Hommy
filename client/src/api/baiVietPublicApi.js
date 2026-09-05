import axiosClient from "./axiosClient";

const baiVietPublicApi = {
  // GET /api/public/bai-viet
  getAll: (params) => axiosClient.get("/public/bai-viet", { params }),

  // GET /api/public/bai-viet/:idOrSlug
  getDetail: (idOrSlug) => axiosClient.get(`/public/bai-viet/${idOrSlug}`),
};

export default baiVietPublicApi;
