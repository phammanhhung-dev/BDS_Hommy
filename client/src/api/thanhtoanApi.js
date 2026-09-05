import axiosClient from './axiosClient';

const thanhtoanApi = {
  getTransactions: (params) => axiosClient.get('/transactions', { params }),
};

export default thanhtoanApi;