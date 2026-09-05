import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import TrangChu from "./pages/trangchu";
import Login from "./pages/login";
import Dangky from "./pages/dangky";
import ProtectedRoute from "./components/ProtectedRoute";

// Import các components cho Chủ dự án
import DashboardChuDuAn from "./pages/ChuDuAn/Dashboard"; // ✨ Light Glass Morphism với Dashboard mới
import QuanLyTinDangChuDuAn from "./pages/ChuDuAn/QuanLyTinDang"; // Alias để tránh conflict
import ChiTietTinDang from "./pages/ChuDuAn/ChiTietTinDang"; // ✨ Light Glass Morphism Theme
import BaoCaoHieuSuat from "./pages/ChuDuAn/BaoCaoHieuSuat";
import TaoTinDang from "./pages/ChuDuAn/TaoTinDang";
import ChinhSuaTinDang from "./pages/ChuDuAn/ChinhSuaTinDang";
import QuanLyDuAn from "./pages/ChuDuAn/QuanLyDuAn"; // ✨ Quản lý dự án (UC-PROJ-01 utilities)
import QuanLyCuocHen from "./pages/ChuDuAn/QuanLyCuocHen"; // ✨ UC-PROJ-02: Quản lý cuộc hẹn
import QuanLyHopDong from "./pages/ChuDuAn/QuanLyHopDong"; // ✨ UC-PROJ-04: Quản lý hợp đồng
import TinNhan from "./pages/ChuDuAn/TinNhan"; // ✨ UC-PROJ-05: Tin nhắn Chủ dự án
import ChiTietTinNhan from "./pages/ChuDuAn/ChiTietTinNhan"; // ✨ Chi tiết cuộc hội thoại
import CaiDat from "./pages/ChuDuAn/CaiDat"; // ✨ Cài đặt tài khoản Chủ dự án
import XacThucKYC from "./pages/XacThucKYC/XacThucKYC"; // ✨ Xác thực KYC (eKYC)

import ViPage from "./pages/Vi/index"; // Ví người dùng
import HopDongCuaToi from "./pages/hopdongcuatoi/index"; // Hợp đồng của tôi - Khách hàng

// Import trang Chi Tiết Tin Đăng cho Khách hàng
import ChiTietTinDangKhachHang from "./pages/chitiettindang"; // 🎯 Soft Tech Theme - Dành cho khách hàng
import DanhSachTinDang from "./pages/DanhSachTinDang"; // 🎯 Danh sách tin đăng theo loại giao dịch
import DanhSachDuAn from "./pages/DanhSachDuAn"; // 🎯 Danh sách dự án nổi bật
import ChiTietDuAn from "./pages/ChiTietDuAn"; // 🎯 Trang chi tiết dự án công khai

// Import cho Nhân viên Bán hàng (UC-SALE-01 đến UC-SALE-07)
import LayoutNhanVienBanHang from "./components/NhanVienBanHang/LayoutNhanVienBanHang";
import DashboardNVBH from "./pages/NhanVienBanHang/Dashboard";
import LichLamViec from "./pages/NhanVienBanHang/LichLamViec";
import QuanLyCuocHenNVBH from "./pages/NhanVienBanHang/QuanLyCuocHen";
import ChiTietCuocHenNVBH from "./pages/NhanVienBanHang/ChiTietCuocHen";
import QuanLyGiaoDich from "./pages/NhanVienBanHang/QuanLyGiaoDich";
import BaoCaoThuNhap from "./pages/NhanVienBanHang/BaoCaoThuNhap";
import TinNhanNVBH from "./pages/NhanVienBanHang/TinNhan";
import ChiTietTinNhanNVBH from "./pages/NhanVienBanHang/ChiTietTinNhan";
import CaiDatNhanVienBanHang from "./pages/NhanVienBanHang/CaiDat";

// Import cho Operator (UC-OPER-01 đến UC-OPER-06)
import DashboardOperator from "./pages/Operator/DashboardOperator";
import DuyetTinDang from "./pages/Operator/DuyetTinDang";
import QuanLyDuAnOperator from "./pages/Operator/QuanLyDuAnOperator";
import QuanLyLichNVBH from "./pages/Operator/QuanLyLichNVBH";
import QuanLyNhanVien from "./pages/Operator/QuanLyNhanVien";
import QuanLyBienBan from "./pages/Operator/QuanLyBienBan";
import BaoCaoThuNhapNVDH from "./pages/Operator/BaoCaoThuNhapNVDH";

// Import trang Xem Ngay (Public) cho Gợi ý Tin đăng
import XemNgayConfirm from './pages/XemNgay/XemNgayConfirm';

// Import trang Xem Hợp đồng Cọc (Public) qua QR
import XemHopDongCoc from './pages/XemHopDongCoc/XemHopDongCoc';

// Import từ upstream
import QuanLyTaiKhoan from './pages/quanlytaikhoan';
import SearchKhuVuc from './components/SearchKhuVuc';
import QuanLyTinDang from './pages/quanlytindang';
import QuanLyKhuVuc from './pages/quanlykhuvuc';
import ThanhToan from './pages/thanhtoan';
import ThanhToanCoc from './pages/thanhtoancoc';
import Appointments from './pages/cuochencuatoi'; // đúng thư mục hiện tại
import QuanLy from './pages/quanly';
import VideoCallPopup from './components/VideoCallPopup';
import KycDebugPlayground from './pages/XacThucKYC/KycDebugPlayground';
import Blog from './pages/blog';
import ChiTietBaiViet from './pages/blog/ChiTietBaiViet';
import BangGia from './pages/bang-gia';
import DinhGiaAI from './pages/DinhGiaAI';

function App() {

  return (

    <div className="App">
      <VideoCallPopup />

      <Routes>
        <Route path='/' element={<TrangChu />} />
        <Route path='/nha-dat-ban' element={<DanhSachTinDang loaiGiaoDich="Ban" />} />
        <Route path='/nha-dat-cho-thue' element={<DanhSachTinDang loaiGiaoDich="Thue" />} />
        <Route path='/du-an' element={<DanhSachDuAn />} />
        <Route path='/du-an/:id' element={<ChiTietDuAn />} />
        <Route path='/wiki-bds' element={<Blog />} />
        <Route path='/phan-tich-danh-gia' element={<Blog />} />
        <Route path='/tin-tuc-bds' element={<Blog />} />
        <Route path='/bai-viet/:id' element={<ChiTietBaiViet />} />
        <Route path='/bang-gia' element={<BangGia />} />
        <Route path='/dinh-gia-ai' element={<DinhGiaAI />} />
        {/* <Route path='/about' element={<div>About Page</div>} /> */}
        <Route path='/login' element={<Login />} />
        <Route path='/dangky' element={<Dangky />} />

        {/* 🎯 Route cho Khách hàng - Chi tiết tin đăng công khai (Soft Tech Theme) */}
        <Route path='/tin-dang/:id' element={<ChiTietTinDangKhachHang />} />
        
        {/* 🎯 Route cho Khách hàng - Xem tin đăng gợi ý qua QR (Public) */}
        <Route path='/xem-ngay/:maQR' element={<XemNgayConfirm />} />
        
        {/* 🎯 Route cho Khách hàng - Xem hợp đồng cọc qua QR (Public) */}
        <Route path='/dat-coc/:maQR' element={<XemHopDongCoc />} />

        {/* Routes cho Nhân viên Bán hàng - Chỉ NVBH (2) và Admin (5) */}
        <Route path='/nhan-vien-ban-hang' element={
          <ProtectedRoute allowedRoles={[2, 5]}>
            <LayoutNhanVienBanHang />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardNVBH />} />
          <Route path='lich-lam-viec' element={<LichLamViec />} />
          <Route path='cuoc-hen' element={<QuanLyCuocHenNVBH />} />
          <Route path='cuoc-hen/:id' element={<ChiTietCuocHenNVBH />} />
          <Route path='giao-dich' element={<QuanLyGiaoDich />} />
          <Route path='thu-nhap' element={<BaoCaoThuNhap />} />
          <Route path='tin-nhan' element={<TinNhanNVBH />} />
          <Route path='tin-nhan/:id' element={<ChiTietTinNhanNVBH />} />
          <Route path='cai-dat' element={<CaiDatNhanVienBanHang />} />
        </Route>

        {/* Routes cho NVDH (UC-OPER-01 đến UC-OPER-06) - Chỉ NVDH (4) và Admin (5) */}
        <Route path='/nvdh' element={<ProtectedRoute allowedRoles={[4, 5]}><Navigate to='/nvdh/dashboard' replace /></ProtectedRoute>} />
        <Route path='/nvdh/dashboard' element={<ProtectedRoute allowedRoles={[4, 5]}><DashboardOperator /></ProtectedRoute>} />
        <Route path='/nvdh/duyet-tin-dang' element={<ProtectedRoute allowedRoles={[4, 5]}><DuyetTinDang /></ProtectedRoute>} />
        <Route path='/nvdh/du-an' element={<ProtectedRoute allowedRoles={[4, 5]}><QuanLyDuAnOperator /></ProtectedRoute>} />
        <Route path='/nvdh/lich-nvbh' element={<ProtectedRoute allowedRoles={[4, 5]}><QuanLyLichNVBH /></ProtectedRoute>} />
        <Route path='/nvdh/nhan-vien' element={<ProtectedRoute allowedRoles={[4, 5]}><QuanLyNhanVien /></ProtectedRoute>} />
        <Route path='/nvdh/bien-ban' element={<ProtectedRoute allowedRoles={[4, 5]}><QuanLyBienBan /></ProtectedRoute>} />
        <Route path='/nvdh/thu-nhap' element={<ProtectedRoute allowedRoles={[4, 5]}><BaoCaoThuNhapNVDH /></ProtectedRoute>} />

        {/* Routes cho Chủ dự án - Chỉ CDA (3) và Admin (5) */}
        <Route path='/chu-du-an' element={<ProtectedRoute allowedRoles={[3, 5]}><Navigate to='/chu-du-an/dashboard' replace /></ProtectedRoute>} />
        <Route path='/chu-du-an/dashboard' element={<ProtectedRoute allowedRoles={[3, 5]}><DashboardChuDuAn /></ProtectedRoute>} />
        <Route path='/chu-du-an/du-an' element={<ProtectedRoute allowedRoles={[3, 5]}><QuanLyDuAn /></ProtectedRoute>} />
        <Route path='/chu-du-an/tin-dang' element={<ProtectedRoute allowedRoles={[3, 5]}><QuanLyTinDangChuDuAn /></ProtectedRoute>} />
        <Route path='/chu-du-an/tin-dang/:id' element={<ProtectedRoute allowedRoles={[3, 5]}><ChiTietTinDang /></ProtectedRoute>} />
        <Route path='/chu-du-an/tao-tin-dang' element={<ProtectedRoute allowedRoles={[3, 5]}><TaoTinDang /></ProtectedRoute>} />
        <Route path='/chu-du-an/chinh-sua-tin-dang/:id' element={<ProtectedRoute allowedRoles={[3, 5]}><ChinhSuaTinDang /></ProtectedRoute>} />
        <Route path='/chu-du-an/bao-cao' element={<ProtectedRoute allowedRoles={[3, 5]}><BaoCaoHieuSuat /></ProtectedRoute>} />
        <Route path='/chu-du-an/cuoc-hen' element={<ProtectedRoute allowedRoles={[3, 5]}><QuanLyCuocHen /></ProtectedRoute>} />
        <Route path='/chu-du-an/hop-dong' element={<ProtectedRoute allowedRoles={[3, 5]}><QuanLyHopDong /></ProtectedRoute>} />
        <Route path='/chu-du-an/tin-nhan' element={<ProtectedRoute allowedRoles={[3, 5]}><TinNhan /></ProtectedRoute>} />
        <Route path='/chu-du-an/tin-nhan/:id' element={<ProtectedRoute allowedRoles={[3, 5]}><ChiTietTinNhan /></ProtectedRoute>} />
        <Route path='/cai-dat' element={<ProtectedRoute allowedRoles={[3, 5]}><CaiDat /></ProtectedRoute>} />
        <Route path='/xac-thuc-kyc' element={<ProtectedRoute allowedRoles={[3, 5]}><XacThucKYC /></ProtectedRoute>} />
        <Route path='/kyc-debug' element={<ProtectedRoute allowedRoles={[3, 5]}><KycDebugPlayground /></ProtectedRoute>} />

        {/* Routes từ upstream */}
        <Route path='/searchkhuvuc' element={<SearchKhuVuc />} />
        <Route path="/quanlytaikhoan" element={<QuanLyTaiKhoan />} />
        <Route path="/quanlytindang" element={<QuanLyTinDang />} />
        <Route path="/quanlykhuvuc" element={<QuanLyKhuVuc />} />
        <Route path="/thanhtoan" element={<ThanhToan />} />
        <Route path="/thanhtoancoc" element={<ThanhToanCoc />} />
        <Route path="/cuochencuatoi" element={<Appointments />} />
        <Route path="/vi" element={<ViPage />} />
        <Route path="/quan-ly" element={<ProtectedRoute allowedRoles={[1, 5]}><QuanLy /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
