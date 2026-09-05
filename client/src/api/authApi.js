import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/login", data),
  register: (data) => axiosClient.post("/register", data),
};

export default authApi;
