import axiosClient from './axiosClient';

const yeuThichApi = {
  add: (data) => axiosClient.post('/yeuthich', data), // POST /api/yeuthich  body: { NguoiDungID, TinDangID }
  remove: (userId, tinId) => axiosClient.delete(`/yeuthich/${userId}/${tinId}`), // DELETE /api/yeuthich/:userId/:tinId
  listByUser: (userId) => axiosClient.get(`/yeuthich/user/${userId}`), // GET /api/yeuthich/user/:userId
  listWithTinDetails: (userId) => axiosClient.get(`/yeuthich/user/${userId}/details`), // GET /api/yeuthich/user/:userId/details
  check: (params) => axiosClient.get('/yeuthich/check', { params }), // GET /api/yeuthich/check?userId=..&tinId=..
};

export default yeuThichApi;