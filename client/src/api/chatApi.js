import axiosClient from './axiosClient';

const chatApi = {
  createConversation: (payload) => axiosClient.post('/chat/conversations', payload),
};

export default chatApi;
