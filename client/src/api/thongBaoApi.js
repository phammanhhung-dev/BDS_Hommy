import axiosClient from './axiosClient';

const thongBaoApi = {
  layDanhSach: (params) => axiosClient.get('/thong-bao', { params }), // GET /api/thong-bao
  demChuaDoc: () => axiosClient.get('/thong-bao/dem-chua-doc'), // GET /api/thong-bao/dem-chua-doc
  danhDauDaDoc: (id) => axiosClient.put(`/thong-bao/${id}/doc`), // PUT /api/thong-bao/:id/doc
  danhDauDocTatCa: () => axiosClient.put('/thong-bao/doc-tat-ca'), // PUT /api/thong-bao/doc-tat-ca
  xoa: (id) => axiosClient.delete(`/thong-bao/${id}`), // DELETE /api/thong-bao/:id
  xoaTatCa: () => axiosClient.delete('/thong-bao/xoa-tat-ca'), // DELETE /api/thong-bao/xoa-tat-ca
};

export default thongBaoApi;
