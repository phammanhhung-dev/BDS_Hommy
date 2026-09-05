/**
 * Service API công khai cho Khách hàng
 * Xử lý các API calls không yêu cầu authentication
 */

// Base URL từ environment hoặc config
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl(); // ❌ Bỏ trailing slash
const PUBLIC_API_PREFIX = '/api/public';

/**
 * Utility function để xử lý response
 */
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    // Nếu response không phải JSON (ví dụ: HTML error page)
    if (error.name === 'SyntaxError') {
      throw new Error(`Server trả về response không phải JSON. Status: ${response.status}`);
    }
    throw error;
  }
};

/**
 * Service cho Tin đăng công khai (không cần auth)
 */
export const PublicTinDangService = {
  /**
   * Lấy danh sách tin đăng công khai
   * @param {Object} filters - Bộ lọc (KhuVucID, keyword, limit, etc.)
   * @returns {Promise<Object>} Response với danh sách tin đăng
   */
  async layDanhSachTinDangCongKhai(filters = {}) {
    try {
      // 🔧 TẠM THỜI: Bỏ onlyPublic để test - lấy tất cả tin đăng
      // Luôn thêm onlyPublic=true để chỉ lấy tin đã duyệt/đang đăng
      // const queryParams = new URLSearchParams({ onlyPublic: 'true' });
      
      const queryParams = new URLSearchParams(); // TẠM THỜI bỏ filter
      console.log('⚠️ [PublicService] Testing mode: NOT filtering by onlyPublic');
      
      // Thêm các filters khác
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}${PUBLIC_API_PREFIX}/tin-dang?${queryParams}`;
      console.log('🔗 Public API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Không cần Authorization header cho public endpoint
        }
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tin đăng công khai:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết tin đăng công khai
   * @param {number} tinDangId - ID tin đăng
   * @returns {Promise<Object>} Chi tiết tin đăng
   */
  async layChiTietTinDang(tinDangId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${PUBLIC_API_PREFIX}/tin-dang/${tinDangId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết tin đăng:', error);
      throw error;
    }
  }
};

/**
 * Service cho Dự án công khai
 */
export const PublicDuAnService = {
  /**
   * Lấy danh sách dự án công khai
   */
  async layDanhSach(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${API_BASE_URL}${PUBLIC_API_PREFIX}/du-an?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dự án:', error);
      throw error;
    }
  }
};

/**
 * Utility functions
 */
export const PublicUtils = {
  /**
   * Format số tiền VND
   */
  formatCurrency(amount) {
    if (!amount) return '-';
    const n = Number(amount);
    if (isNaN(n)) return amount;
    return n.toLocaleString('vi-VN') + ' VND';
  },

  /**
   * Format ngày tháng
   */
  formatDate(date, options = {}) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', options);
  },

  /**
   * Format ngày giờ
   */
  formatDateTime(datetime) {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('vi-VN');
  },

  /**
   * Parse URL từ tin đăng (hỗ trợ nhiều format)
   */
  parseImageUrls(urlField) {
    const placeholder = '/assets/images/no-image-400x300.svg';
    
    if (!urlField) return [placeholder];
    
    // Nếu đã là array
    if (Array.isArray(urlField)) {
      return urlField.length > 0 ? urlField : [placeholder];
    }
    
    // Nếu là string, thử parse JSON
    if (typeof urlField === 'string') {
      const trimmed = urlField.trim();
      
      try {
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
          const parsed = JSON.parse(trimmed);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
          
          if (parsed?.images && Array.isArray(parsed.images) && parsed.images.length > 0) {
            return parsed.images;
          }
        }
      } catch (e) {
        // Không phải JSON, tiếp tục xử lý như string
      }
      
      // Thử tìm URL đầu tiên trong string
      const urlMatch = trimmed.match(/https?:\/\/[^",\]\s]+/);
      if (urlMatch) {
        return [urlMatch[0]];
      }
      
      // Nếu bắt đầu bằng http hoặc /
      if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
        return [trimmed];
      }
    }
    
    return [placeholder];
  },

  /**
   * Lấy ảnh đầu tiên từ URL field
   */
  getFirstImage(tin) {
    const urls = this.parseImageUrls(tin?.URL);
    return urls[0];
  }
};

/**
 * Service cho Cuộc hẹn công khai (không cần auth)
 */
export const PublicCuocHenService = {
  /**
   * UC-CUST-03: Tạo cuộc hẹn xem phòng
   * @param {Object} data - Dữ liệu cuộc hẹn
   * @param {number} data.PhongID - ID phòng
   * @param {number} data.KhachHangID - ID khách hàng
   * @param {string} data.ThoiGianHen - Thời gian hẹn (MySQL datetime: 'YYYY-MM-DD HH:MM:SS')
   * @param {string} [data.GhiChu] - Ghi chú từ khách hàng
   * @returns {Promise<Object>} Response với CuocHenID
   */
  async taoMoi(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuoc-hen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi tạo cuộc hẹn:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách cuộc hẹn của khách hàng
   * @param {number} khachHangId - ID khách hàng
   * @returns {Promise<Object>} Danh sách cuộc hẹn
   */
  async layDanhSachTheoKhachHang(khachHangId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cuoc-hen/search/khach-hang/${khachHangId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc hẹn:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết cuộc hẹn
   * @param {number} cuocHenId - ID cuộc hẹn
   * @returns {Promise<Object>} Chi tiết cuộc hẹn
   */
  async layChiTiet(cuocHenId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuoc-hen/${cuocHenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết cuộc hẹn:', error);
      throw error;
    }
  }
};

// Default export cho backward compatibility
export default {
  PublicTinDangService,
  PublicDuAnService,
  PublicCuocHenService,
  PublicUtils
};
