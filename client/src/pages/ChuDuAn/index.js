/**
 * Export tất cả components của Chủ dự án
 * Tổ chức theo use cases trong đặc tả v1.2
 */

// UC-PROJ-03: Dashboard tổng quan
export { default as DashboardChuDuAn } from './Dashboard';

// UC-PROJ-01: Quản lý tin đăng
export { default as QuanLyTinDang } from './QuanLyTinDang';
export { default as ChiTietTinDang } from './ChiTietTinDang';
export { default as TaoTinDang } from './TaoTinDang';
export { default as ChinhSuaTinDang } from './ChinhSuaTinDang';
export { default as QuanLyNhap } from './QuanLyNhap';

// UC-PROJ-03: Báo cáo hiệu suất
export { default as BaoCaoHieuSuat } from './BaoCaoHieuSuat';

// UC-PROJ-01/Utilities: Quản lý Dự án
export { default as QuanLyDuAn } from './QuanLyDuAn';

// Settings: Cài đặt tài khoản
export { default as CaiDat } from './CaiDat';

// UC-PROJ-02: Quản lý cuộc hẹn
export { default as QuanLyCuocHen } from './QuanLyCuocHen';

// TODO: Các components khác sẽ được bổ sung
// UC-PROJ-04: Báo cáo hợp đồng cho thuê
// UC-PROJ-05: Nhắn tin
