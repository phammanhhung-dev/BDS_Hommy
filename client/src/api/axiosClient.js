import axios from "axios";
import { getApiBaseUrl } from '../config/api';
import { getAuthHeaderValue } from '../utils/authToken';

const axiosClient = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // 20s timeout để tránh treo UI vĩnh viễn
  withCredentials: true, // ✅ Cho phép gửi cookies/credentials qua CORS
});

// 🐛 Debug: Log base URL khi khởi tạo
console.log('🔗 [axiosClient] Base URL:', axiosClient.defaults.baseURL);

// Interceptor: Tự động thêm token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAuthHeaderValue().replace(/^Bearer\s+/i, '');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý response và lỗi
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu token hết hạn (401), logout user
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) { window.location.href = '/login'; }
    }

    // Ghi log lỗi hoặc xử lý lỗi chung
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
