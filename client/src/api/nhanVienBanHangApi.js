/**
 * API Service cho Nhân viên Bán hàng
 * Tích hợp với 19 backend endpoints
 */

import axios from 'axios';

import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();
const NVBH_BASE = `${API_BASE_URL}/api/nhan-vien-ban-hang`;

// Axios instance với token authentication
const apiClient = axios.create({
  baseURL: NVBH_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor để thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ==================== LỊCH LÀM VIỆC (UC-SALE-01) ====================

/**
 * Lấy danh sách lịch làm việc
 * @param {Object} filters - {tuNgay, denNgay}
 */
export const layLichLamViec = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/lich-lam-viec?${params.toString()}`);
};

/**
 * Tạo ca làm việc mới
 * @param {Object} data - {batDau, ketThuc}
 */
export const taoLichLamViec = async (data) => {
  return apiClient.post('/lich-lam-viec', data);
};

/**
 * Cập nhật ca làm việc
 * @param {number} lichId
 * @param {Object} data - {batDau, ketThuc}
 */
export const capNhatLichLamViec = async (lichId, data) => {
  return apiClient.put(`/lich-lam-viec/${lichId}`, data);
};

/**
 * Xóa ca làm việc
 * @param {number} lichId
 */
export const xoaLichLamViec = async (lichId) => {
  return apiClient.delete(`/lich-lam-viec/${lichId}`);
};

// ==================== CUỘC HẸN (UC-SALE-02, UC-SALE-03, UC-SALE-05) ====================

/**
 * Lấy danh sách cuộc hẹn
 * @param {Object} filters - {trangThai, tuNgay, denNgay, limit}
 */
export const layDanhSachCuocHen = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/cuoc-hen?${params.toString()}`);
};

/**
 * Xem chi tiết cuộc hẹn
 * @param {number} cuocHenId
 */
export const xemChiTietCuocHen = async (cuocHenId) => {
  return apiClient.get(`/cuoc-hen/${cuocHenId}`);
};

/**
 * Xác nhận cuộc hẹn
 * @param {number} cuocHenId
 * @param {string} ghiChu
 */
export const xacNhanCuocHen = async (cuocHenId, ghiChu = '') => {
  return apiClient.put(`/cuoc-hen/${cuocHenId}/xac-nhan`, { ghiChu });
};

/**
 * Đổi lịch cuộc hẹn
 * @param {number} cuocHenId
 * @param {Object} data - {thoiGianHenMoi, lyDo}
 */
export const doiLichCuocHen = async (cuocHenId, data) => {
  return apiClient.put(`/cuoc-hen/${cuocHenId}/doi-lich`, data);
};

/**
 * Hủy cuộc hẹn
 * @param {number} cuocHenId
 * @param {string} lyDoHuy
 */
export const huyCuocHen = async (cuocHenId, lyDoHuy) => {
  return apiClient.put(`/cuoc-hen/${cuocHenId}/huy`, { lyDoHuy });
};

/**
 * Báo cáo kết quả cuộc hẹn
 * @param {number} cuocHenId
 * @param {Object} data - {ketQua, khachQuanTam, lyDoThatBai, keHoachFollowUp, ghiChu}
 */
export const baoCaoKetQuaCuocHen = async (cuocHenId, data) => {
  return apiClient.post(`/cuoc-hen/${cuocHenId}/bao-cao-ket-qua`, data);
};

// ==================== GIAO DỊCH/CỌC (UC-SALE-04) ====================

/**
 * Lấy danh sách giao dịch
 * @param {Object} filters - {loai, trangThai, tuNgay, denNgay, limit}
 */
export const layDanhSachGiaoDich = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/giao-dich?${params.toString()}`);
};

/**
 * Xem chi tiết giao dịch
 * @param {number} giaoDichId
 */
export const xemChiTietGiaoDich = async (giaoDichId) => {
  return apiClient.get(`/giao-dich/${giaoDichId}`);
};

/**
 * Xác nhận cọc
 * @param {number} giaoDichId
 * @param {FormData|Object} data
 */
export const xacNhanCoc = async (giaoDichId, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiClient.post(
    `/giao-dich/${giaoDichId}/xac-nhan-coc`,
    data,
    isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  );
};

/**
 * Hoàn trả cọc
 * @param {number} giaoDichId
 * @param {Object} data - {soTienHoanTra, lyDoHoanTra, phuongThucHoanTra, ghiChu}
 */
export const hoanTraCoc = async (giaoDichId, data) => {
  return apiClient.post(`/giao-dich/${giaoDichId}/hoan-tra`, data);
};

/**
 * Tải biên nhận giao dịch (blob)
 * @param {number} giaoDichId
 */
export const taiBienNhan = async (giaoDichId) => {
  return apiClient.get(`/giao-dich/${giaoDichId}/bien-nhan`, {
    responseType: 'blob'
  });
};

// ==================== BÁO CÁO THU NHẬP (UC-SALE-06) ====================

/**
 * Lấy báo cáo thu nhập
 * @param {Object} filters - {tuNgay, denNgay}
 */
export const layBaoCaoThuNhap = async (filters) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/bao-cao/thu-nhap?${params.toString()}`);
};

/**
 * Lấy thống kê hiệu suất
 * @param {Object} filters - {tuNgay, denNgay}
 */
export const layThongKeHieuSuat = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/bao-cao/thong-ke?${params.toString()}`);
};

/**
 * Lấy cuộc hẹn theo tuần (cho chart)
 * @param {number} soTuan
 */
export const layCuocHenTheoTuan = async (soTuan = 4) => {
  return apiClient.get(`/bao-cao/cuoc-hen-theo-tuan?soTuan=${soTuan}`);
};

// ==================== THÔNG BÁO ====================

/**
 * Lấy danh sách thông báo với pagination
 * @param {Object} filters - {trangThai, loai, page, limit}
 */
export const layDanhSachThongBao = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiClient.get(`/thong-bao?${params.toString()}`);
};

/**
 * Đếm số thông báo chưa đọc
 */
export const demThongBaoChuaDoc = async () => {
  return apiClient.get('/thong-bao/dem-chua-doc');
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {number} thongBaoId
 */
export const danhDauDaDoc = async (thongBaoId) => {
  return apiClient.put(`/thong-bao/${thongBaoId}/doc`);
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const danhDauDocTatCa = async () => {
  return apiClient.put('/thong-bao/doc-tat-ca');
};

// ==================== DASHBOARD ====================

/**
 * Lấy metrics dashboard
 */
export const layDashboard = async () => {
  return apiClient.get('/dashboard');
};

/**
 * Lấy hồ sơ nhân viên
 */
export const layHoSo = async () => {
  return apiClient.get('/ho-so');
};

/**
 * Cập nhật hồ sơ
 * @param {Object} data - {ghiChu}
 */
export const capNhatHoSo = async (data) => {
  return apiClient.put('/ho-so', data);
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  if (format === 'full') {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  if (format === 'date') {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString('vi-VN');
};

/**
 * Get week start date (Sunday)
 */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Get week end date (Saturday)
 */
export const getWeekEnd = (date = new Date()) => {
  const start = getWeekStart(date);
  return new Date(start.setDate(start.getDate() + 6));
};

/**
 * Get month start date
 */
export const getMonthStart = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get month end date
 */
export const getMonthEnd = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// ==================== GỢI Ý TIN ĐĂNG (QR Xem Ngay) ====================

/**
 * Tìm kiếm tin đăng gợi ý theo bộ lọc
 * @param {Object} filters - Bộ lọc tìm kiếm
 * @param {number} [filters.cuocHenId] - ID cuộc hẹn hiện tại
 * @param {number} [filters.khuVucId] - ID khu vực
 * @param {number} [filters.giaMin] - Giá tối thiểu
 * @param {number} [filters.giaMax] - Giá tối đa
 * @param {number} [filters.dienTichMin] - Diện tích tối thiểu
 * @param {number} [filters.dienTichMax] - Diện tích tối đa
 * @param {string} [filters.tienIch] - Tiện ích (comma-separated)
 * @param {number} [filters.limit] - Giới hạn số lượng
 */
export const timKiemGoiY = async (filters = {}) => {
  return apiClient.post('/goi-y/tim-kiem', filters);
};

/**
 * Lấy chi tiết tin đăng gợi ý (bao gồm danh sách phòng trống)
 * @param {number} tinDangId - ID tin đăng
 */
export const layChiTietTinDangGoiY = async (tinDangId) => {
  return apiClient.get(`/goi-y/tin-dang/${tinDangId}`);
};

/**
 * Tạo QR "Xem Ngay" cho khách
 * @param {Object} data - Dữ liệu tạo QR
 * @param {number} [data.cuocHenId] - ID cuộc hẹn (optional)
 * @param {number} data.tinDangId - ID tin đăng
 * @param {number} data.phongId - ID phòng được chọn
 */
export const taoQRXemNgay = async (data) => {
  return apiClient.post('/goi-y/tao-qr', data);
};

/**
 * Tạo QR đặt cọc cho khách hàng quét
 * @param {Object} data - Dữ liệu tạo QR
 * @param {number} data.cuocHenId - ID cuộc hẹn
 * @param {number} data.tinDangId - ID tin đăng
 * @param {number} data.phongId - ID phòng được chọn
 * @param {number} data.soThangKy - Số tháng ký hợp đồng
 * @param {number} data.soTienCoc - Số tiền cọc ước tính
 */
export const taoQRDatCoc = async (data) => {
  return apiClient.post('/goi-y/tao-qr-dat-coc', data);
};

/**
 * Kiểm tra trạng thái QR (polling fallback)
 * @param {string} maQR - Mã QR
 */
export const kiemTraTrangThaiQR = async (maQR) => {
  return apiClient.get(`/goi-y/trang-thai/${maQR}`);
};

/**
 * Lấy danh sách khu vực con dựa trên KhuVucPhuTrachID của NVBH
 * @returns {Promise<Array>} Danh sách khu vực con
 */
export const layDanhSachKhuVuc = async () => {
  return apiClient.get('/goi-y/khu-vuc');
};

export default {
  // Lịch làm việc
  layLichLamViec,
  taoLichLamViec,
  capNhatLichLamViec,
  xoaLichLamViec,
  
  // Cuộc hẹn
  layDanhSachCuocHen,
  xemChiTietCuocHen,
  xacNhanCuocHen,
  doiLichCuocHen,
  huyCuocHen,
  baoCaoKetQuaCuocHen,
  
  // Giao dịch
  layDanhSachGiaoDich,
  xemChiTietGiaoDich,
  xacNhanCoc,
  hoanTraCoc,
  taiBienNhan,
  
  // Báo cáo
  layBaoCaoThuNhap,
  layThongKeHieuSuat,
  layCuocHenTheoTuan,
  
  // Dashboard
  layDashboard,
  layHoSo,
  capNhatHoSo,
  
  // Thông báo
  layDanhSachThongBao,
  demThongBaoChuaDoc,
  danhDauDaDoc,
  danhDauDocTatCa,
  
  // Gợi ý tin đăng
  timKiemGoiY,
  layChiTietTinDangGoiY,
  taoQRXemNgay,
  taoQRDatCoc,
  kiemTraTrangThaiQR,
  
  // Helpers
  formatCurrency,
  formatDate,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd
};


