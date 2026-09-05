/**
 * Operator API Service
 * Tổng hợp các API calls cho Operator (UC-OPER-01 đến UC-OPER-06)
 */

import axios from 'axios';

import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Axios instance với auth token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor để thêm auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== UC-OPER-01: Duyệt Tin đăng ====================
export const tinDangOperatorApi = {
  /**
   * Lấy danh sách tin đăng chờ duyệt
   */
  getDanhSachChoDuyet: (params) => api.get('/api/operator/tin-dang/cho-duyet', { params }),

  /**
   * Xem chi tiết tin đăng
   */
  getChiTiet: (id) => api.get(`/api/operator/tin-dang/${id}/chi-tiet`),

  /**
   * Duyệt tin đăng
   */
  duyetTin: (id) => api.put(`/api/operator/tin-dang/${id}/duyet`),
  duyetTinDang: (tinDangId, operatorId) => api.put(`/api/operator/tin-dang/${tinDangId}/duyet`, {operatorId}), // Alias for compatibility

  /**
   * Từ chối tin đăng
   */
  tuChoiTin: (id, data) => api.put(`/api/operator/tin-dang/${id}/tu-choi`, data),
  tuChoiTinDang: (tinDangId, lyDo, operatorId) => api.put(`/api/operator/tin-dang/${tinDangId}/tu-choi`, {lyDo, operatorId}), // Alias

  /**
   * Lấy thống kê tin đăng
   */
  getThongKe: () => api.get('/api/operator/tin-dang/thong-ke')
};

// ==================== UC-OPER-02: Quản lý Dự án ====================
export const duAnOperatorApi = {
  /**
   * Lấy danh sách dự án
   */
  getDanhSach: (params) => api.get('/api/operator/du-an', { params }),

  /**
   * Lấy chi tiết dự án
   */
  getChiTiet: (id) => api.get(`/api/operator/du-an/${id}`),

  /**
   * Tạm ngưng dự án
   */
  tamNgung: (id, data) => api.put(`/api/operator/du-an/${id}/tam-ngung`, data),

  /**
   * Kích hoạt dự án
   */
  kichHoat: (id) => api.put(`/api/operator/du-an/${id}/kich-hoat`),

  /**
   * Banned dự án
   */
  banned: (id, data) => api.put(`/api/operator/du-an/${id}/banned`, data),

  /**
   * Xử lý yêu cầu mở lại
   */
  xuLyYeuCauMoLai: (id, data) => api.put(`/api/operator/du-an/${id}/xu-ly-yeu-cau`, data),

  /**
   * Lấy thống kê dự án
   */
  getThongKe: () => api.get('/api/operator/du-an/thong-ke'),

  /**
   * Quản trị viên hệ thống tạo dự án
   */
  taoDuAn: (data) => api.post('/api/operator/du-an', data),

  /**
   * Quản trị viên hệ thống cập nhật dự án
   */
  capNhatDuAn: (id, data) => api.put(`/api/operator/du-an/${id}`, data),

  /**
   * Duyệt hoa hồng dự án
   */
  duyetHoaHong: (id) => api.post(`/api/operator/du-an/${id}/duyet-hoa-hong`),

  /**
   * Từ chối hoa hồng dự án
   */
  tuChoiHoaHong: (id, data) => api.post(`/api/operator/du-an/${id}/tu-choi-hoa-hong`, data)
};

// ==================== UC-OPER-03: Quản lý Lịch NVBH ====================
export const lichLamViecOperatorApi = {
  /**
   * Lấy lịch tháng
   */
  getLichThang: (year, month) => api.get('/api/operator/lich-lam-viec/tong-hop', {
    params: { year, month }
  }),

  /**
   * Lấy lịch tổng hợp
   */
  getLichTongHop: (params) => api.get('/api/operator/lich-lam-viec/tong-hop', { params }),

  /**
   * Lấy heatmap độ phủ
   */
  getHeatmap: (params) => api.get('/api/operator/lich-lam-viec/heatmap', { params }),

  /**
   * Lấy NVBH khả dụng
   */
  getNVBHKhaDung: (params) => api.get('/api/operator/lich-lam-viec/nvbh-kha-dung', { params }),

  /**
   * Lấy danh sách cuộc hẹn cần gán
   */
  getCuocHenCanGan: () => api.get('/api/operator/cuoc-hen/can-gan'),

  /**
   * Gán lại cuộc hẹn
   */
  ganLaiCuocHen: (id, data) => api.put(`/api/operator/cuoc-hen/${id}/gan-lai`, data)
};

// ==================== UC-OPER-03: Cuộc hẹn (list view cho Operator) ====================
export const cuocHenOperatorApi = {
  /**
   * Lấy danh sách cuộc hẹn với phân trang + bộ lọc
   */
  getDanhSach: (params) => api.get('/api/operator/cuoc-hen', { params }),

  /**
   * Lấy danh sách cuộc hẹn cần gán (alias)
   */
  getCuocHenCanGan: () => api.get('/api/operator/cuoc-hen/can-gan'),

  /**
   * Gán lại cuộc hẹn (alias)
   */
  ganLaiCuocHen: (id, data) => api.put(`/api/operator/cuoc-hen/${id}/gan-lai`, data)
};

// ==================== UC-OPER-04&05: Quản lý Nhân viên ====================
export const nhanVienApi = {
  /**
   * Lấy danh sách nhân viên
   */
  getDanhSach: (params) => api.get('/api/operator/nhan-vien', { params }),

  /**
   * Lấy danh sách nhân viên khả dụng (cho gán cuộc hẹn)
   */
  getDanhSachKhaDung: (params) => api.get('/api/operator/nhan-vien/kha-dung', { params }),

  /**
   * Lấy chi tiết nhân viên
   */
  getChiTiet: (id) => api.get(`/api/operator/nhan-vien/${id}`),

  /**
   * Tạo nhân viên mới
   */
  taoMoi: (data) => api.post('/api/operator/nhan-vien', data),

  /**
   * Cập nhật hồ sơ
   */
  capNhat: (id, data) => api.put(`/api/operator/nhan-vien/${id}`, data),

  /**
   * Kích hoạt/Vô hiệu hóa nhân viên
   */
  capNhatTrangThai: (id, data) => api.put(`/api/operator/nhan-vien/${id}/trang-thai`, data),

  /**
   * Lấy thống kê nhân viên
   */
  getThongKe: () => api.get('/api/operator/nhan-vien/thong-ke'),

  /**
   * Lấy thông tin khu vực mặc định (KhuVucChinhID, KhuVucPhuTrachID) của Operator hiện tại
   * Dùng để mặc định cho nhân viên mới
   * @returns {Promise<Object>} Thông tin khu vực mặc định
   */
  getKhuVucMacDinh: () => api.get('/api/operator/nhan-vien/khu-vuc/mac-dinh'),

  /**
   * Lấy thông tin khu vực phụ trách của nhân viên
   * @param {number} nhanVienId - ID nhân viên
   * @returns {Promise<Object>} Thông tin khu vực chính và phụ trách
   */
  getKhuVucPhuTrach: (nhanVienId) => api.get(`/api/operator/nhan-vien/${nhanVienId}/khu-vuc`)
};

// ==================== UC-OPER-06: Biên bản Bàn giao ====================
export const bienBanApi = {
  /**
   * Lấy danh sách biên bản
   */
  getDanhSach: (params) => api.get('/api/operator/bien-ban', { params }),

  /**
   * Lấy danh sách phòng cần bàn giao
   */
  getDanhSachCanBanGiao: (params) => api.get('/api/operator/bien-ban/can-ban-giao', { params }),

  /**
   * Lấy chi tiết biên bản
   */
  getChiTiet: (id) => api.get(`/api/operator/bien-ban/${id}`),

  /**
   * Tạo biên bản mới
   */
  taoMoi: (data) => api.post('/api/operator/bien-ban', data),

  /**
   * Cập nhật biên bản
   */
  capNhat: (id, data) => api.put(`/api/operator/bien-ban/${id}`, data),

  /**
   * Ký biên bản
   */
  ky: (id, data) => api.put(`/api/operator/bien-ban/${id}/ky`, data),

  /**
   * Lấy thống kê biên bản
   */
  getThongKe: () => api.get('/api/operator/bien-ban/thong-ke')
};

// ==================== Quản lý Nội dung Hệ thống ====================
export const noiDungHeThongApi = {
  /**
   * Lấy danh sách nội dung hệ thống
   */
  getDanhSach: (params) => api.get('/api/operator/noi-dung-he-thong', { params }),

  /**
   * Lấy nội dung theo ID
   */
  getChiTiet: (id) => api.get(`/api/operator/noi-dung-he-thong/${id}`),

  /**
   * Tạo nội dung mới
   */
  taoMoi: (data) => api.post('/api/operator/noi-dung-he-thong', data),

  /**
   * Cập nhật nội dung
   */
  capNhat: (id, data) => api.put(`/api/operator/noi-dung-he-thong/${id}`, data),

  /**
   * Xóa nội dung
   */
  xoa: (id) => api.delete(`/api/operator/noi-dung-he-thong/${id}`)
};

// ==================== Dashboard ====================
export const dashboardOperatorApi = {
  /**
   * Lấy metrics tổng quan (cũ - cho card Nhân viên và Biên bản)
   */
  getMetrics: async () => {
    const [tinDangRes, duAnRes, nhanVienRes, bienBanRes] = await Promise.all([
      tinDangOperatorApi.getThongKe(),
      duAnOperatorApi.getThongKe(),
      nhanVienApi.getThongKe(),
      bienBanApi.getThongKe()
    ]);

    return {
      tinDang: tinDangRes.data?.data || tinDangRes.data || tinDangRes,
      duAn: duAnRes.data?.data || duAnRes.data || duAnRes,
      nhanVien: nhanVienRes.data?.data || nhanVienRes.data || nhanVienRes,
      bienBan: bienBanRes.data?.data || bienBanRes.data || bienBanRes
    };
  },

  /**
   * 1. GET /api/operator/dashboard/stats
   * Tổng quan: tin đăng, cuộc hẹn 7 ngày, doanh thu tháng
   */
  getStats: () => api.get('/api/operator/dashboard/stats'),

  /**
   * 2. GET /api/operator/dashboard/revenue-chart
   * Doanh thu 6 tháng gần nhất
   */
  getRevenueChart: () => api.get('/api/operator/dashboard/revenue-chart'),

  /**
   * 3. GET /api/operator/dashboard/occupancy
   * Tỷ lệ lấp đầy theo dự án
   */
  getOccupancy: () => api.get('/api/operator/dashboard/occupancy'),

  /**
   * 4. GET /api/operator/dashboard/status-distribution
   * Phân bố trạng thái tin đăng
   */
  getStatusDistribution: () => api.get('/api/operator/dashboard/status-distribution'),

  /**
   * 5. GET /api/operator/dashboard/recent-listings?limit=5
   * Tin đăng mới nhất
   */
  getRecentListings: (limit = 5) => api.get('/api/operator/dashboard/recent-listings', { params: { limit } }),

  /**
   * 6. GET /api/operator/dashboard/upcoming-appointments
   * Cuộc hẹn trong 7 ngày tới
   */
  getUpcomingAppointments: () => api.get('/api/operator/dashboard/upcoming-appointments'),

  /**
   * Lấy tất cả dashboard data mới (6 endpoints song song)
   */
  getDashboardData: async () => {
    const [statsRes, revenueRes, occupancyRes, statusRes, recentRes, appointmentsRes] = await Promise.all([
      dashboardOperatorApi.getStats(),
      dashboardOperatorApi.getRevenueChart(),
      dashboardOperatorApi.getOccupancy(),
      dashboardOperatorApi.getStatusDistribution(),
      dashboardOperatorApi.getRecentListings(5),
      dashboardOperatorApi.getUpcomingAppointments()
    ]);

    return {
      stats: statsRes.data?.data || statsRes.data,
      revenueChart: revenueRes.data?.data || revenueRes.data,
      occupancy: occupancyRes.data?.data || occupancyRes.data,
      statusDistribution: statusRes.data?.data || statusRes.data,
      recentListings: recentRes.data?.data || recentRes.data,
      upcomingAppointments: appointmentsRes.data?.data || appointmentsRes.data
    };
  }
};

// ==================== NVDH: Báo cáo thu nhập và dữ liệu quản lý trực tiếp ====================
export const nhanVienDieuHanhApi = {
  /**
   * Lấy báo cáo thu nhập NVDH
   */
  getBaoCaoThuNhap: (params) => api.get('/api/nhan-vien-dieu-hanh/bao-cao-thu-nhap', { params }),

  /**
   * Lấy danh sách NVBH dưới quyền
   */
  getDanhSachNVBH: () => api.get('/api/nhan-vien-dieu-hanh/danh-sach-nvbh'),

  /**
   * Lấy chi tiết thu nhập của một NVBH
   */
  getThuNhapNVBH: (nhanVienId, params) => api.get(`/api/nhan-vien-dieu-hanh/nvbh/${nhanVienId}/thu-nhap`, { params }),

  /**
   * Xem chi tiết hoa hồng hợp đồng
   */
  getHoaHongHopDong: (hopDongId) => api.get(`/api/nhan-vien-dieu-hanh/hop-dong/${hopDongId}/hoa-hong`),

  /**
   * Preview hoa hồng
   */
  previewHoaHong: (params) => api.get('/api/nhan-vien-dieu-hanh/preview-hoa-hong', { params })
};

// Export default object chứa tất cả APIs (đổi tên Việt hóa: NVDH)
const nvdhApi = {
  tinDang: tinDangOperatorApi,
  duAn: duAnOperatorApi,
  lichLamViec: lichLamViecOperatorApi,
  cuocHen: cuocHenOperatorApi,
  nhanVien: nhanVienApi,
  bienBan: bienBanApi,
  noiDungHeThong: noiDungHeThongApi,
  dashboard: dashboardOperatorApi,
  nhanVienDieuHanh: nhanVienDieuHanhApi
};

// Giữ alias cũ để tương thích tạm thời, nhưng ưu tiên dùng nvdhApi
const operatorApi = nvdhApi;

// Export cả 2 (ưu tiên dùng nvdhApi)
export { nvdhApi, operatorApi };
export default nvdhApi;

