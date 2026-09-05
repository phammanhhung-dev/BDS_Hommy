const MOCK_DEV_TOKEN = 'mock-token-for-development';

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

export const isJwtExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

export const getPreferredAuthToken = () => {
  let storedToken = localStorage.getItem('token') || localStorage.getItem('authToken') || '';

  if (!storedToken) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      storedToken = user.token || '';
    } catch {
      // Ignore JSON parse error
    }
  }

  // Nếu người dùng đã từng đăng nhập có token, luôn dùng token đó để backend xác thực
  // Nếu token hết hạn, backend trả 401 và axiosClient sẽ điều hướng về /login
  if (storedToken) {
    return storedToken;
  }

  if (import.meta.env?.DEV) {
    return MOCK_DEV_TOKEN;
  }

  return '';
};

export const getAuthHeaderValue = () => {
  const token = getPreferredAuthToken();
  return token ? `Bearer ${token}` : '';
};
