/**
 * UC-SALE-03: Chi tiết Cuộc hẹn
 * View detail với timeline, map, actions, confirmations
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineHome,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLightBulb,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineBanknotes
} from 'react-icons/hi2';
import {
  xemChiTietCuocHen,
  xacNhanCuocHen,
  doiLichCuocHen,
  huyCuocHen
} from '../../api/nhanVienBanHangApi';
import { getApiBaseUrl, getStaticUrl } from '../../config/api';
import { formatDate, formatCurrency, formatPhone } from '../../utils/nvbhHelpers';
import StatusBadge from '../../components/NhanVienBanHang/StatusBadge';
import ActivityTimeline from '../../components/NhanVienBanHang/ActivityTimeline';
import LoadingSkeleton from '../../components/NhanVienBanHang/LoadingSkeleton';
import ErrorBanner from '../../components/NhanVienBanHang/ErrorBanner';
import ModalBaoCaoKetQua from '../../components/NhanVienBanHang/ModalBaoCaoKetQua';
import ModalGoiYPhongKhac from '../../components/NhanVienBanHang/ModalGoiYPhongKhac/ModalGoiYPhongKhac';
import PreviewTinDangSheet from '../../components/NhanVienBanHang/PreviewTinDangSheet';
import ModalQRXemNgay from '../../components/NhanVienBanHang/ModalQRXemNgay';
import ModalKhachHangDatCoc from '../../components/NhanVienBanHang/ModalKhachHangDatCoc/ModalKhachHangDatCoc';
import './ChiTietCuocHen.css';

const ChiTietCuocHen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGoiYModal, setShowGoiYModal] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDatCocModal, setShowDatCocModal] = useState(false); // Modal đặt cọc cho khách hàng
  const [selectedTinDangForPreview, setSelectedTinDangForPreview] = useState(null);
  const [qrData, setQrData] = useState(null); // { cuocHenId, tinDangId, phongId, tinDangInfo, phongInfo }
  const [actionLoading, setActionLoading] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  // State để quản lý expanded/collapsed cho từng phòng khác
  const [expandedPhongIds, setExpandedPhongIds] = useState(new Set());

  // Load appointment details
  useEffect(() => {
    loadAppointment();
    
    // Check for action param from navigation
    const action = searchParams.get('action');
    if (action === 'reschedule') {
      setShowRescheduleModal(true);
    }
  }, [id, searchParams]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await xemChiTietCuocHen(id);
      
      if (response.success) {
        setAppointment(response.data);
      }
    } catch (err) {
      console.error('[ChiTietCuocHen] Load error:', err);
      setError(err.message || 'Không thể tải chi tiết cuộc hẹn');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleConfirm = async () => {
    if (!window.confirm('Xác nhận cuộc hẹn này?')) return;
    
    try {
      setActionLoading(true);
      const response = await xacNhanCuocHen(id);
      
      if (response.success) {
        alert('Đã xác nhận cuộc hẹn thành công');
        loadAppointment();
      }
    } catch (err) {
      console.error('[ChiTietCuocHen] Confirm error:', err);
      alert('Không thể xác nhận: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (newDate) => {
    try {
      setActionLoading(true);
      const response = await doiLichCuocHen(id, {
        thoiGianHenMoi: newDate,
        lyDo: 'Theo yêu cầu'
      });
      
      if (response.success) {
        alert('Đã đổi lịch thành công');
        setShowRescheduleModal(false);
        loadAppointment();
      }
    } catch (err) {
      console.error('[ChiTietCuocHen] Reschedule error:', err);
      alert('Không thể đổi lịch: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason) => {
    try {
      setActionLoading(true);
      const response = await huyCuocHen(id, reason);
      
      if (response.success) {
        alert('Đã hủy cuộc hẹn');
        setShowCancelModal(false);
        loadAppointment();
      }
    } catch (err) {
      console.error('[ChiTietCuocHen] Cancel error:', err);
      alert('Không thể hủy: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportResult = () => {
    setShowReportModal(true);
  };

  const handleBack = () => {
    navigate('/nhan-vien-ban-hang/cuoc-hen');
  };

  const handleChatWithCustomer = async () => {
    if (!appointment.KhachHangID) {
      alert('Không tìm thấy thông tin khách hàng');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        NguCanhID: appointment.CuocHenID,
        NguCanhLoai: 'CuocHen',
        ThanhVienIDs: [appointment.KhachHangID],
        TieuDe: `Cuộc hẹn #${appointment.CuocHenID} - ${appointment.TenKhachHang || 'Khách hàng'}`
      };

      const response = await fetch(`${getApiBaseUrl()}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        navigate(`/nhan-vien-ban-hang/tin-nhan/${result.data.CuocHoiThoaiID}`);
      } else {
        alert(`❌ Không thể tạo cuộc trò chuyện: ${result.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('[ChiTietCuocHen] Error opening chat with customer:', error);
      alert('❌ Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const handleChatWithOwner = async () => {
    if (!appointment.ChuDuAnID) {
      alert('Không tìm thấy thông tin chủ dự án');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        NguCanhID: appointment.CuocHenID,
        NguCanhLoai: 'CuocHen',
        ThanhVienIDs: [appointment.ChuDuAnID],
        TieuDe: `Cuộc hẹn #${appointment.CuocHenID} - ${appointment.TenDuAn || 'Dự án'}`
      };

      const response = await fetch(`${getApiBaseUrl()}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        navigate(`/nhan-vien-ban-hang/tin-nhan/${result.data.CuocHoiThoaiID}`);
      } else {
        alert(`❌ Không thể tạo cuộc trò chuyện: ${result.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('[ChiTietCuocHen] Error opening chat with owner:', error);
      alert('❌ Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  // Handler cho xem chi tiết tin đăng gợi ý
  const handleViewDetail = (tinDang) => {
    setSelectedTinDangForPreview(tinDang);
    setShowPreviewSheet(true);
  };

  // Handler cho tạo QR từ preview sheet
  const handleCreateQRFromPreview = (data) => {
    // data = { tinDangId, phongId, tinDang, phong }
    setQrData({
      cuocHenId: appointment.CuocHenID,
      tinDangId: data.tinDangId,
      phongId: data.phongId,
      tinDangInfo: data.tinDang,
      phongInfo: data.phong
    });
    setShowPreviewSheet(false);
    setShowQRModal(true);
  };

  // Handler cho tạo QR trực tiếp từ kết quả tìm kiếm
  const handleCreateQR = (tinDang) => {
    // Mở preview sheet trước để chọn phòng
    setSelectedTinDangForPreview(tinDang);
    setShowPreviewSheet(true);
  };

  // Handler khi QR được tạo thành công
  const handleQRSuccess = () => {
    setShowQRModal(false);
    setShowGoiYModal(false);
    setQrData(null);
    // Có thể reload appointment để cập nhật thông tin
    // loadAppointment();
  };

  if (loading) {
    return (
      <div className="nvbh-chi-tiet-cuoc-hen">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="nvbh-chi-tiet-cuoc-hen">
        <ErrorBanner
          message={error}
          onRetry={loadAppointment}
          onDismiss={() => navigate('/nhan-vien-ban-hang/cuoc-hen')}
        />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="nvbh-chi-tiet-cuoc-hen">
        <ErrorBanner
          message="Không tìm thấy cuộc hẹn"
          onDismiss={() => navigate('/nhan-vien-ban-hang/cuoc-hen')}
        />
      </div>
    );
  }

  // Chuẩn hóa trạng thái để so sánh an toàn (tránh lệch hoa thường hoặc khoảng trắng)
  const trangThaiCuocHen = (appointment.TrangThai || '').trim().toLowerCase();
  const trangThaiPhong = (appointment.TrangThaiPhong || '').trim().toLowerCase();

  const canConfirm = trangThaiCuocHen === 'choxacnhan';
  const canReschedule = ['daxacnhan', 'dayeucau'].includes(trangThaiCuocHen);
  const canCancel = ['choxacnhan', 'daxacnhan', 'dayeucau'].includes(trangThaiCuocHen);
  const canReport = trangThaiCuocHen === 'daxacnhan';
  const canGoiY = ['daxacnhan', 'dangdienra'].includes(trangThaiCuocHen); // Có thể gợi ý khi cuộc hẹn đã xác nhận hoặc đang diễn ra
  // Có thể đặt cọc khi cuộc hẹn đã xác nhận/đang diễn ra và phòng còn trống
  const canDatCoc = ['daxacnhan', 'dangdienra'].includes(trangThaiCuocHen) && trangThaiPhong === 'trong';

  // Parse coordinates for map
  const hasCoordinates = appointment.ToaDo && appointment.ToaDo.lat && appointment.ToaDo.lng;

  return (
    <div className="nvbh-chi-tiet-cuoc-hen">
      {/* Header */}
      <div className="nvbh-chi-tiet-cuoc-hen__header">
        <button
          className="nvbh-chi-tiet-cuoc-hen__back"
          onClick={handleBack}
          aria-label="Quay lại"
        >
          <HiOutlineArrowLeft />
          Quay lại
        </button>
        <h1 className="nvbh-chi-tiet-cuoc-hen__title">Chi tiết Cuộc hẹn</h1>
        <StatusBadge status={appointment.TrangThai} size="md" showDot />
      </div>

      {/* Content Grid */}
      <div className="nvbh-chi-tiet-cuoc-hen__grid">
        {/* Appointment Info Card */}
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <HiOutlineCalendarDays />
            <h2>Thông tin Cuộc hẹn</h2>
          </div>
          <div className="nvbh-card__body">
            <div className="nvbh-info-row">
              <span className="nvbh-info-row__label">
                <HiOutlineClock />
                Thời gian hẹn:
              </span>
              <span className="nvbh-info-row__value">
                {formatDate(appointment.ThoiGianHen, 'datetime')}
              </span>
            </div>
            <div className="nvbh-info-row">
              <span className="nvbh-info-row__label">Số lần đổi lịch:</span>
              <span className="nvbh-info-row__value">{appointment.SoLanDoiLich || 0}</span>
            </div>
            {appointment.PhuongThucVao && (
              <div className="nvbh-info-row">
                <span className="nvbh-info-row__label">Phương thức vào:</span>
                <span className="nvbh-info-row__value">{appointment.PhuongThucVao}</span>
              </div>
            )}
            {appointment.GhiChuKetQua && !appointment.BaoCaoKetQua && (
              <div className="nvbh-info-row">
                <span className="nvbh-info-row__label">Ghi chú kết quả (cũ):</span>
                <p className="nvbh-info-row__note">{appointment.GhiChuKetQua}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <HiOutlineUser />
            <h2>Thông tin Khách hàng</h2>
          </div>
          <div className="nvbh-card__body">
            <div className="nvbh-customer-info">
              <div className="nvbh-customer-info__avatar">
                {appointment.TenKhachHang?.[0] || 'K'}
              </div>
              <div className="nvbh-customer-info__details">
                <h3>{appointment.TenKhachHang || 'Khách hàng'}</h3>
                <div className="nvbh-info-row">
                  <HiOutlinePhone />
                  <a href={`tel:${appointment.SDTKhachHang}`}>
                    {formatPhone(appointment.SDTKhachHang)}
                  </a>
                </div>
                {appointment.EmailKhachHang && (
                  <div className="nvbh-info-row">
                    <HiOutlineEnvelope />
                    <a href={`mailto:${appointment.EmailKhachHang}`}>{appointment.EmailKhachHang}</a>
                  </div>
                )}
                <button
                  className="nvbh-btn nvbh-btn--secondary nvbh-btn--sm"
                  onClick={handleChatWithCustomer}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  <HiOutlineChatBubbleLeftRight />
                  Trò chuyện với khách hàng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Owner Info Card */}
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <HiOutlineHome />
            <h2>Thông tin Chủ dự án</h2>
          </div>
          <div className="nvbh-card__body">
            <div className="nvbh-customer-info">
              <div className="nvbh-customer-info__avatar">
                {appointment.TenChuDuAn?.[0] || appointment.TenDuAn?.[0] || 'C'}
              </div>
              <div className="nvbh-customer-info__details">
                <h3>{appointment.TenChuDuAn || appointment.TenDuAn || 'Chủ dự án'}</h3>
                {appointment.SoDienThoaiChuDuAn && (
                  <div className="nvbh-info-row">
                    <HiOutlinePhone />
                    <a href={`tel:${appointment.SoDienThoaiChuDuAn}`}>
                      {formatPhone(appointment.SoDienThoaiChuDuAn)}
                    </a>
                  </div>
                )}
                {appointment.EmailChuDuAn && (
                  <div className="nvbh-info-row">
                    <HiOutlineEnvelope />
                    <a href={`mailto:${appointment.EmailChuDuAn}`}>{appointment.EmailChuDuAn}</a>
                  </div>
                )}
                <button
                  className="nvbh-btn nvbh-btn--secondary nvbh-btn--sm"
                  onClick={handleChatWithOwner}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  <HiOutlineChatBubbleLeftRight />
                  Trò chuyện với chủ dự án
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room Details Card */}
        <div className="nvbh-card nvbh-card--full">
          <div className="nvbh-card__header">
            <HiOutlineHome />
            <h2>Thông tin Phòng, Tin đăng & Dự án</h2>
            <button
              className="nvbh-info-toggle-btn"
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              aria-label={isInfoExpanded ? 'Thu gọn' : 'Mở rộng'}
              aria-expanded={isInfoExpanded}
            >
              {isInfoExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </button>
          </div>
          <div className={`nvbh-card__body nvbh-info-content ${isInfoExpanded ? 'nvbh-info-content--expanded' : 'nvbh-info-content--collapsed'}`}>
            {/* === THÔNG TIN PHÒNG === */}
            <div className="nvbh-info-section">
              <h3 className="nvbh-info-section__title">
                <HiOutlineHome className="nvbh-info-section__icon" />
                Thông tin Phòng
              </h3>
              
              <div className="nvbh-info-grid">
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Tên phòng:</span>
                  <span className="nvbh-info-row__value nvbh-info-row__value--bold">
                    {appointment.TieuDePhong || 'N/A'}
                  </span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Trạng thái phòng:</span>
                  <span className={`nvbh-status-badge nvbh-status-badge--${
                    appointment.TrangThaiPhong === 'Trong' ? 'success' :
                    appointment.TrangThaiPhong === 'GiuCho' ? 'warning' :
                    appointment.TrangThaiPhong === 'DaThue' ? 'info' : 'default'
                  }`}>
                    {appointment.TrangThaiPhong === 'Trong' ? '🟢 Trống' :
                     appointment.TrangThaiPhong === 'GiuCho' ? '🟡 Giữ chỗ' :
                     appointment.TrangThaiPhong === 'DaThue' ? '🔵 Đã thuê' :
                     appointment.TrangThaiPhong === 'DonDep' ? '🟠 Dọn dẹp' : appointment.TrangThaiPhong}
                  </span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Giá thuê:</span>
                  <span className="nvbh-info-row__value nvbh-info-row__value--price">
                    {formatCurrency(appointment.GiaPhong)}/tháng
                  </span>
                  {appointment.GiaChuanPhong && appointment.GiaChuanPhong !== appointment.GiaPhong && (
                    <span className="nvbh-info-row__note">
                      (Giá chuẩn: {formatCurrency(appointment.GiaChuanPhong)})
                    </span>
                  )}
                </div>
                
                {appointment.DienTich && (
                  <div className="nvbh-info-row">
                    <span className="nvbh-info-row__label">Diện tích:</span>
                    <span className="nvbh-info-row__value">
                      {appointment.DienTich}m²
                      {appointment.DienTichChuanPhong && appointment.DienTichChuanPhong !== appointment.DienTich && (
                        <span className="nvbh-info-row__note">
                          {' '}(Chuẩn: {appointment.DienTichChuanPhong}m²)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {appointment.MoTaPhongHienThi && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Mô tả phòng:</span>
                    <p className="nvbh-info-row__note">{appointment.MoTaPhongHienThi}</p>
                  </div>
                )}
              </div>
            </div>

            {/* === DANH SÁCH PHÒNG KHÁC (nếu có) === */}
            {appointment.DanhSachPhongKhac && appointment.DanhSachPhongKhac.length > 0 && (
              <div className="nvbh-info-section">
                <h3 className="nvbh-info-section__title">
                  <HiOutlineHome className="nvbh-info-section__icon" />
                  Phòng khác trong tin đăng ({appointment.DanhSachPhongKhac.length} phòng)
                </h3>
                
                <div className="nvbh-phong-khac-list">
                  {appointment.DanhSachPhongKhac.map((phong) => {
                    const isExpanded = expandedPhongIds.has(phong.PhongID);
                    return (
                      <div key={phong.PhongID} className="nvbh-phong-khac-item">
                        <div 
                          className="nvbh-phong-khac-item__header"
                          onClick={() => {
                            const newExpanded = new Set(expandedPhongIds);
                            if (isExpanded) {
                              newExpanded.delete(phong.PhongID);
                            } else {
                              newExpanded.add(phong.PhongID);
                            }
                            setExpandedPhongIds(newExpanded);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="nvbh-phong-khac-item__header-content">
                            <span className="nvbh-phong-khac-item__title">{phong.TenPhong}</span>
                            <span className={`nvbh-status-badge nvbh-status-badge--${
                              phong.TrangThaiPhong === 'Trong' ? 'success' :
                              phong.TrangThaiPhong === 'GiuCho' ? 'warning' :
                              phong.TrangThaiPhong === 'DaThue' ? 'info' : 'default'
                            }`}>
                              {phong.TrangThaiPhong === 'Trong' ? '🟢 Trống' :
                               phong.TrangThaiPhong === 'GiuCho' ? '🟡 Giữ chỗ' :
                               phong.TrangThaiPhong === 'DaThue' ? '🔵 Đã thuê' :
                               phong.TrangThaiPhong === 'DonDep' ? '🟠 Dọn dẹp' : phong.TrangThaiPhong}
                            </span>
                            <span className="nvbh-phong-khac-item__price">
                              {formatCurrency(phong.GiaPhong)}/tháng
                            </span>
                          </div>
                          <button
                            className="nvbh-info-toggle-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newExpanded = new Set(expandedPhongIds);
                              if (isExpanded) {
                                newExpanded.delete(phong.PhongID);
                              } else {
                                newExpanded.add(phong.PhongID);
                              }
                              setExpandedPhongIds(newExpanded);
                            }}
                            aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                          </button>
                        </div>
                        
                        <div className={`nvbh-phong-khac-item__content ${isExpanded ? 'nvbh-info-content--expanded' : 'nvbh-info-content--collapsed'}`}>
                          <div className="nvbh-info-grid">
                            {phong.DienTich && (
                              <div className="nvbh-info-row">
                                <span className="nvbh-info-row__label">Diện tích:</span>
                                <span className="nvbh-info-row__value">
                                  {phong.DienTich}m²
                                  {phong.DienTichChuanPhong && phong.DienTichChuanPhong !== phong.DienTich && (
                                    <span className="nvbh-info-row__note">
                                      {' '}(Chuẩn: {phong.DienTichChuanPhong}m²)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            
                            {phong.GiaChuanPhong && phong.GiaChuanPhong !== phong.GiaPhong && (
                              <div className="nvbh-info-row">
                                <span className="nvbh-info-row__label">Giá chuẩn:</span>
                                <span className="nvbh-info-row__value">
                                  {formatCurrency(phong.GiaChuanPhong)}/tháng
                                </span>
                              </div>
                            )}
                            
                            {phong.MoTaPhong && (
                              <div className="nvbh-info-row nvbh-info-row--full">
                                <span className="nvbh-info-row__label">Mô tả:</span>
                                <p className="nvbh-info-row__note">{phong.MoTaPhong}</p>
                              </div>
                            )}
                            
                            {phong.HinhAnhPhong && phong.HinhAnhPhong.length > 0 && (
                              <div className="nvbh-info-row nvbh-info-row--full">
                                <span className="nvbh-info-row__label">Hình ảnh:</span>
                                <div className="nvbh-room__images-grid" style={{ marginTop: '0.5rem' }}>
                                  {phong.HinhAnhPhong.slice(0, 3).map((img, index) => (
                                    <img
                                      key={index}
                                      src={getStaticUrl(img)}
                                      alt={`${phong.TenPhong} ${index + 1}`}
                                      className="nvbh-room__image"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === THÔNG TIN TIN ĐĂNG === */}
            <div className="nvbh-info-section">
              <h3 className="nvbh-info-section__title">
                <HiOutlineDocumentText className="nvbh-info-section__icon" />
                Thông tin Tin đăng
              </h3>
              
              <div className="nvbh-info-grid">
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Mã tin đăng:</span>
                  <span className="nvbh-info-row__value">#{appointment.TinDangID}</span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Tiêu đề:</span>
                  <span className="nvbh-info-row__value nvbh-info-row__value--bold">
                    {appointment.TieuDeTinDang || 'N/A'}
                  </span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Trạng thái:</span>
                  <span className={`nvbh-status-badge nvbh-status-badge--${
                    appointment.TrangThaiTinDang === 'DaDang' ? 'success' :
                    appointment.TrangThaiTinDang === 'DaDuyet' ? 'info' :
                    appointment.TrangThaiTinDang === 'ChoDuyet' ? 'warning' :
                    appointment.TrangThaiTinDang === 'TamNgung' ? 'danger' : 'default'
                  }`}>
                    {appointment.TrangThaiTinDang === 'DaDang' ? '✅ Đã đăng' :
                     appointment.TrangThaiTinDang === 'DaDuyet' ? '✓ Đã duyệt' :
                     appointment.TrangThaiTinDang === 'ChoDuyet' ? '⏳ Chờ duyệt' :
                     appointment.TrangThaiTinDang === 'TamNgung' ? '⏸ Tạm ngưng' :
                     appointment.TrangThaiTinDang === 'TuChoi' ? '❌ Từ chối' :
                     appointment.TrangThaiTinDang === 'LuuTru' ? '📦 Lưu trữ' : appointment.TrangThaiTinDang}
                  </span>
                </div>
                
                {appointment.MoTaTinDang && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Mô tả:</span>
                    <p className="nvbh-info-row__note">{appointment.MoTaTinDang}</p>
                  </div>
                )}
                
                {/* Tiện ích */}
                {appointment.TienIch && appointment.TienIch.length > 0 && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Tiện ích:</span>
                    <div className="nvbh-tien-ich-list">
                      {appointment.TienIch.map((tienIch, index) => (
                        <span key={index} className="nvbh-tien-ich-badge">
                          {tienIch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Giá điện, nước, dịch vụ */}
                <div className="nvbh-info-row nvbh-info-row--full">
                  <span className="nvbh-info-row__label">Chi phí phụ:</span>
                  <div className="nvbh-chi-phi-list">
                    {appointment.GiaDien && (
                      <div className="nvbh-chi-phi-item">
                        <span className="nvbh-chi-phi-item__label">⚡ Điện:</span>
                        <span className="nvbh-chi-phi-item__value">
                          {formatCurrency(appointment.GiaDien)}/kWh
                        </span>
                      </div>
                    )}
                    {appointment.GiaNuoc && (
                      <div className="nvbh-chi-phi-item">
                        <span className="nvbh-chi-phi-item__label">💧 Nước:</span>
                        <span className="nvbh-chi-phi-item__value">
                          {formatCurrency(appointment.GiaNuoc)}/m³
                        </span>
                      </div>
                    )}
                    {appointment.GiaDichVu && (
                      <div className="nvbh-chi-phi-item">
                        <span className="nvbh-chi-phi-item__label">🔧 Dịch vụ:</span>
                        <span className="nvbh-chi-phi-item__value">
                          {formatCurrency(appointment.GiaDichVu)}/tháng
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {appointment.MoTaGiaDichVu && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Chi tiết phí dịch vụ:</span>
                    <p className="nvbh-info-row__note">{appointment.MoTaGiaDichVu}</p>
                  </div>
                )}
              </div>
            </div>

            {/* === THÔNG TIN DỰ ÁN === */}
            <div className="nvbh-info-section">
              <h3 className="nvbh-info-section__title">
                <HiOutlineBuildingOffice className="nvbh-info-section__icon" />
                Thông tin Dự án
              </h3>
              
              <div className="nvbh-info-grid">
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Mã dự án:</span>
                  <span className="nvbh-info-row__value">#{appointment.DuAnID}</span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Tên dự án:</span>
                  <span className="nvbh-info-row__value nvbh-info-row__value--bold">
                    {appointment.TenDuAn || 'N/A'}
                  </span>
                </div>
                
                <div className="nvbh-info-row">
                  <span className="nvbh-info-row__label">Trạng thái:</span>
                  <span className={`nvbh-status-badge nvbh-status-badge--${
                    appointment.TrangThaiDuAn === 'HoatDong' ? 'success' :
                    appointment.TrangThaiDuAn === 'NgungHoatDong' ? 'danger' : 'default'
                  }`}>
                    {appointment.TrangThaiDuAn === 'HoatDong' ? '✅ Hoạt động' :
                     appointment.TrangThaiDuAn === 'NgungHoatDong' ? '⛔ Ngưng hoạt động' :
                     appointment.TrangThaiDuAn === 'LuuTru' ? '📦 Lưu trữ' : appointment.TrangThaiDuAn}
                  </span>
                </div>
                
                <div className="nvbh-info-row nvbh-info-row--full">
                  <span className="nvbh-info-row__label">Địa chỉ:</span>
                  <div className="nvbh-info-row__value">
                    <HiOutlineMapPin className="nvbh-info-row__icon" />
                    {appointment.DiaChiPhong || 'N/A'}
                  </div>
                </div>
                
                {appointment.PhuongThucVaoDuAn && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Phương thức vào:</span>
                    <p className="nvbh-info-row__note nvbh-info-row__note--highlight">
                      🔑 {appointment.PhuongThucVaoDuAn}
                    </p>
                  </div>
                )}
                
                {/* Bảng hoa hồng */}
                {appointment.BangHoaHong && appointment.BangHoaHong.length > 0 && (
                  <div className="nvbh-info-row nvbh-info-row--full">
                    <span className="nvbh-info-row__label">Bảng hoa hồng:</span>
                    <div className="nvbh-hoa-hong-list">
                      {appointment.BangHoaHong.map((hh, index) => (
                        <div key={index} className="nvbh-hoa-hong-item">
                          <span className="nvbh-hoa-hong-item__label">
                            {hh.soThang} tháng cọc:
                          </span>
                          <span className="nvbh-hoa-hong-item__value">
                            {hh.tyLe}%
                          </span>
                        </div>
                      ))}
                      {appointment.SoThangCocToiThieu && (
                        <div className="nvbh-hoa-hong-note">
                          * Áp dụng từ {appointment.SoThangCocToiThieu} tháng cọc trở lên
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Room Images */}
            {appointment.HinhAnhPhong && appointment.HinhAnhPhong.length > 0 && (
              <div className="nvbh-room__images">
                <h4 className="nvbh-room__images-title">Hình ảnh phòng</h4>
                <div className="nvbh-room__images-grid">
                  {appointment.HinhAnhPhong.map((img, index) => (
                    <img
                      key={index}
                      src={getStaticUrl(img)}
                      alt={`Phòng ${index + 1}`}
                      className="nvbh-room__image"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {hasCoordinates && (
          <div className="nvbh-card nvbh-card--full">
            <div className="nvbh-card__header">
              <HiOutlineMapPin />
              <h2>Vị trí</h2>
            </div>
            <div className="nvbh-card__body nvbh-card__body--no-padding">
              <div className="nvbh-map">
                <MapContainer
                  center={[appointment.ToaDo.lat, appointment.ToaDo.lng]}
                  zoom={15}
                  style={{ height: '300px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[appointment.ToaDo.lat, appointment.ToaDo.lng]}>
                    <Popup>{appointment.DiaChiPhong}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="nvbh-card nvbh-card--full">
          <div className="nvbh-card__header">
            <HiOutlineClock />
            <h2>Lịch sử hoạt động</h2>
          </div>
          <div className="nvbh-card__body">
            {appointment.ActivityLog && appointment.ActivityLog.length > 0 ? (
              <ActivityTimeline activities={appointment.ActivityLog} />
            ) : (
              <div className="nvbh-timeline-empty">
                <p>Chưa có lịch sử hoạt động</p>
              </div>
            )}

            {/* Báo cáo kết quả */}
            {appointment.BaoCaoKetQua && (
              <div className="nvbh-bao-cao-ket-qua">
                <div className="nvbh-bao-cao-ket-qua__header">
                  <h4 className="nvbh-bao-cao-ket-qua__title">
                    📋 Kết quả cuộc hẹn
                  </h4>
                  {appointment.BaoCaoKetQua.thoiGianBaoCao && (
                    <span className="nvbh-bao-cao-ket-qua__time">
                      🕐 {formatDate(appointment.BaoCaoKetQua.thoiGianBaoCao, 'datetime')}
                    </span>
                  )}
                </div>
                
                <div className="nvbh-bao-cao-item">
                  <span className="nvbh-bao-cao-item__label">Kết quả</span>
                  <div className="nvbh-bao-cao-item__value">
                    <span className={`nvbh-bao-cao-badge nvbh-bao-cao-badge--${
                      appointment.BaoCaoKetQua.ketQua === 'thanh_cong' ? 'success' : 'fail'
                    }`}>
                      {appointment.BaoCaoKetQua.ketQua === 'thanh_cong' ? '✓ Thành công' : '✕ Thất bại'}
                    </span>
                  </div>
                </div>
                
                <div className="nvbh-bao-cao-item">
                  <span className="nvbh-bao-cao-item__label">Khách hàng quan tâm</span>
                  <div className="nvbh-bao-cao-item__value">
                    {appointment.BaoCaoKetQua.khachQuanTam ? 'Có' : 'Không'}
                  </div>
                </div>
                
                {appointment.BaoCaoKetQua.lyDoThatBai && (
                  <div className="nvbh-bao-cao-item">
                    <span className="nvbh-bao-cao-item__label">Lý do thất bại</span>
                    <div className="nvbh-bao-cao-item__value">
                      {appointment.BaoCaoKetQua.lyDoThatBai}
                    </div>
                  </div>
                )}
                
                {appointment.BaoCaoKetQua.keHoachFollowUp && (
                  <div className="nvbh-bao-cao-item">
                    <span className="nvbh-bao-cao-item__label">Kế hoạch follow-up</span>
                    <div className="nvbh-bao-cao-item__value">
                      {appointment.BaoCaoKetQua.keHoachFollowUp}
                    </div>
                  </div>
                )}
                
                {appointment.BaoCaoKetQua.ghiChu && (
                  <div className="nvbh-bao-cao-item">
                    <span className="nvbh-bao-cao-item__label">Ghi chú</span>
                    <div className="nvbh-bao-cao-item__value">
                      {appointment.BaoCaoKetQua.ghiChu}
                    </div>
                  </div>
                )}
                
                {appointment.BaoCaoKetQua.slaWarning && (
                  <div className="nvbh-bao-cao-sla-warning">
                    ⚠️ {appointment.BaoCaoKetQua.slaWarning}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="nvbh-chi-tiet-cuoc-hen__actions">
        {canConfirm && (
          <button
            className="nvbh-btn nvbh-btn--primary"
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            Xác nhận cuộc hẹn
          </button>
        )}
        {canReschedule && (
          <button
            className="nvbh-btn nvbh-btn--secondary"
            onClick={() => setShowRescheduleModal(true)}
            disabled={actionLoading}
          >
            Đổi lịch
          </button>
        )}
        {canReport && (
          <button
            className="nvbh-btn nvbh-btn--secondary"
            onClick={handleReportResult}
            disabled={actionLoading}
          >
            Báo cáo kết quả
          </button>
        )}
        {canGoiY && (
          <button
            className="nvbh-btn nvbh-btn--accent"
            onClick={() => setShowGoiYModal(true)}
            disabled={actionLoading}
          >
            <HiOutlineLightBulb />
            Gợi ý tin đăng khác
          </button>
        )}
        {canDatCoc && (
          <button
            className="nvbh-btn nvbh-btn--success"
            onClick={() => setShowDatCocModal(true)}
            disabled={actionLoading}
          >
            <HiOutlineBanknotes />
            Khách hàng đặt cọc
          </button>
        )}
        {canCancel && (
          <button
            className="nvbh-btn nvbh-btn--danger"
            onClick={() => setShowCancelModal(true)}
            disabled={actionLoading}
          >
            Hủy cuộc hẹn
          </button>
        )}
      </div>

      {/* Modals */}
      {showRescheduleModal && (
        <RescheduleModal
          onConfirm={handleReschedule}
          onClose={() => setShowRescheduleModal(false)}
          currentDate={appointment.ThoiGianHen}
        />
      )}

      {showCancelModal && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showReportModal && (
        <ModalBaoCaoKetQua
          appointment={appointment}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={() => {
            setShowReportModal(false);
            loadAppointment();
          }}
        />
      )}

      {showGoiYModal && (
        <ModalGoiYPhongKhac
          isOpen={showGoiYModal}
          onClose={() => setShowGoiYModal(false)}
          cuocHenId={appointment.CuocHenID}
          tinDangHienTai={{
            TinDangID: appointment.TinDangID,
            KhuVucID: appointment.KhuVucID,
            TieuDe: appointment.TieuDePhong,
            GiaPhong: appointment.GiaPhong, // Giá phòng hiện tại (ưu tiên GiaTinDang > GiaChuan)
            GiaChuanPhong: appointment.GiaChuanPhong, // Giá chuẩn từ phong
            DienTich: appointment.DienTich, // Diện tích phòng hiện tại (ưu tiên DienTichTinDang > DienTichChuan)
            DienTichChuanPhong: appointment.DienTichChuanPhong // Diện tích chuẩn từ phong
          }}
          onViewDetail={handleViewDetail}
          onCreateQR={handleCreateQR}
        />
      )}

      {/* Preview Tin Đăng Sheet */}
      {showPreviewSheet && selectedTinDangForPreview && (
        <PreviewTinDangSheet
          isOpen={showPreviewSheet}
          onClose={() => {
            setShowPreviewSheet(false);
            setSelectedTinDangForPreview(null);
          }}
          tinDangId={selectedTinDangForPreview.TinDangID}
          onCreateQR={handleCreateQRFromPreview}
        />
      )}

      {/* QR Modal */}
      {showQRModal && qrData && (
        <ModalQRXemNgay
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setQrData(null);
          }}
          cuocHenId={qrData.cuocHenId}
          tinDangId={qrData.tinDangId}
          phongId={qrData.phongId}
          tinDangInfo={qrData.tinDangInfo}
          phongInfo={qrData.phongInfo}
          onSuccess={handleQRSuccess}
        />
      )}

      {/* Modal Khách hàng đặt cọc */}
      {showDatCocModal && appointment && (
        <ModalKhachHangDatCoc
          isOpen={showDatCocModal}
          onClose={() => setShowDatCocModal(false)}
          cuocHenId={appointment.CuocHenID}
          appointment={appointment}
          onSuccess={() => {
            setShowDatCocModal(false);
            loadAppointment();
          }}
        />
      )}
    </div>
  );
};

// Reschedule Modal
const RescheduleModal = ({ onConfirm, onClose, currentDate }) => {
  const [newDate, setNewDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newDate) return;
    onConfirm(newDate);
  };

  return (
    <div className="nvbh-modal-overlay" role="dialog" aria-modal="true">
      <div className="nvbh-modal">
        <h2>Đổi lịch cuộc hẹn</h2>
        <form onSubmit={handleSubmit}>
          <div className="nvbh-form-group">
            <label htmlFor="current-date">Thời gian hiện tại:</label>
            <input
              id="current-date"
              type="text"
              value={formatDate(currentDate, 'datetime')}
              disabled
            />
          </div>
          <div className="nvbh-form-group">
            <label htmlFor="new-date">Thời gian mới:</label>
            <input
              id="new-date"
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="nvbh-modal__actions">
            <button type="button" className="nvbh-btn nvbh-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="nvbh-btn nvbh-btn--primary">
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Cancel Modal
const CancelModal = ({ onConfirm, onClose }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onConfirm(reason);
  };

  return (
    <div className="nvbh-modal-overlay" role="dialog" aria-modal="true">
      <div className="nvbh-modal">
        <h2>Hủy cuộc hẹn</h2>
        <form onSubmit={handleSubmit}>
          <div className="nvbh-form-group">
            <label htmlFor="cancel-reason">Lý do hủy:</label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              placeholder="Nhập lý do hủy cuộc hẹn..."
            />
          </div>
          <div className="nvbh-modal__actions">
            <button type="button" className="nvbh-btn nvbh-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="nvbh-btn nvbh-btn--danger">
              Xác nhận hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChiTietCuocHen;






