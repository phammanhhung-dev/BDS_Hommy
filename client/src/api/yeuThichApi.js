import axiosClient from './axiosClient';

const yeuThichApi = {
  toggle: (data) => axiosClient.post('/yeuthich/toggle', data), // POST /api/yeuthich/toggle body: { NguoiDungID, TinDangID }
  add: (data) => axiosClient.post('/yeuthich', data), // POST /api/yeuthich  body: { NguoiDungID, TinDangID }
  remove: (userId, tinId) => {
    if (typeof userId === 'object' && userId !== null) {
      const uId = userId.NguoiDungID || userId.userId;
      const tId = userId.TinDangID || userId.tinId;
      return axiosClient.delete(`/yeuthich/${uId}/${tId}`);
    }
    return axiosClient.delete(`/yeuthich/${userId}/${tinId}`);
  },
  listByUser: (userId) => axiosClient.get(`/yeuthich/user/${userId}`), // GET /api/yeuthich/user/:userId
  listWithTinDetails: (userId) => axiosClient.get(`/yeuthich/user/${userId}/details`), // GET /api/yeuthich/user/:userId/details
  check: (params) => axiosClient.get('/yeuthich/check', { params }), // GET /api/yeuthich/check?userId=..&tinId=..
};

export default yeuThichApi;