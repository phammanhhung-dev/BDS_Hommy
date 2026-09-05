/**
 * 🌐 API Configuration - Dynamic Environment Detection
 * Tự động phát hiện môi trường (DevTunnel, public URL hoặc Localhost) và trả về URL phù hợp
 */

const normalizeBaseUrl = (url = '') => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

let cachedBaseUrl = null;

const detectApiBaseUrl = () => {
  // Ưu tiên cấu hình qua biến môi trường
  const envBaseUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envBaseUrl) {
    console.log('🌐 [API Config] Using VITE_API_BASE_URL:', envBaseUrl);
    return normalizeBaseUrl(envBaseUrl);
  }

  // Nếu không có window (SSR / unit test), fallback localhost
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const currentHost = window.location.hostname;

  // 🔍 DevTunnel detection (ví dụ: f7lzv3js-5173.asse.devtunnels.ms)
  if (currentHost.includes('devtunnels.ms')) {
    const tunnelMatch = currentHost.match(/^([^-]+)-/);
    const tunnelId = tunnelMatch ? tunnelMatch[1] : '';

    if (tunnelId) {
      const backendUrl = `https://${tunnelId}-5000.asse.devtunnels.ms`;
      console.log('🌐 [API Config] DevTunnel mode:', backendUrl);
      return backendUrl;
    }

    // Không bắt được tunnelId → dùng luôn host hiện tại
    return `${window.location.protocol}//${window.location.host}`;
  }

  // 🏠 Local/LAN fallback
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const fallbackPort = import.meta.env?.VITE_API_PORT || '5000';

  // Nếu đang chạy cùng port (SPA build deploy chung backend)
  if (window.location.port === fallbackPort || !window.location.port) {
    return `${protocol}://${window.location.host.replace(/\/$/, '')}`;
  }

  return `${protocol}://${currentHost}:${fallbackPort}`;
};

/**
 * Lấy Base URL cho API dựa trên môi trường hiện tại
 * @returns {string} Base URL của backend API
 */
export const getApiBaseUrl = () => {
  if (!cachedBaseUrl) {
    cachedBaseUrl = detectApiBaseUrl();
  }
  return cachedBaseUrl;
};

/**
 * Tiện ích join path với API base (tự thêm slash nếu thiếu)
 * @param {string} path Relative path (vd: "/api/chu-du-an")
 * @returns {string}
 */
export const buildApiUrl = (path = '') => {
  if (!path) return getApiBaseUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

/**
 * Lấy WebSocket URL cho Socket.IO
 * @returns {string} WebSocket URL
 */
export const getSocketUrl = () => {
  const envSocket = import.meta.env?.VITE_SOCKET_URL;
  if (envSocket) return normalizeBaseUrl(envSocket);
  return getApiBaseUrl(); // Socket.IO sử dụng cùng base URL
};

/**
 * Tạo full URL cho static files (uploads, images)
 * @param {string} path - Relative path (e.g., "/uploads/image.jpg")
 * @returns {string} Full URL
 */
export const getStaticUrl = (path) => {
  if (!path) return '';

  if (Array.isArray(path)) {
    return path.length > 0 ? getStaticUrl(path[0]) : '';
  }

  const value = String(path);

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

// Export constants (computed một lần)
export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

// 🐛 Debug: Log khi module được import
if (typeof window !== 'undefined') {
  console.log('📡 [API Config] Initialized:', {
    API_BASE_URL,
    SOCKET_URL,
    hostname: window.location.hostname
  });
}
