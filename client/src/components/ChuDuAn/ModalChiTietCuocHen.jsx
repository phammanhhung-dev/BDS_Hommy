import React from 'react';
import './ModalChiTietCuocHen.css';
import { 
  HiOutlineXMark, 
  HiOutlineClock, 
  HiOutlineUser, 
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineKey,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlineTag
} from 'react-icons/hi2';

/**
 * Modal Chi tiết Cuộc hẹn
 * Hiển thị đầy đủ thông tin cuộc hẹn và lịch sử
 */
function ModalChiTietCuocHen({ cuocHen, onClose, onPheDuyet, onTuChoi, onOpenChat }) {
  if (!cuocHen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mapLoaiBDS = (loai) => {
    const map = {
      CanHo: 'Căn hộ chung cư',
      NhaPho: 'Nhà phố',
      BietThu: 'Biệt thự',
      DatO: 'Đất ở',
      DatNen: 'Đất nền',
      NhaNguyenCan: 'Nhà nguyên căn',
      Shophouse: 'Shophouse / Thương mại',
      PhongTro: 'Phòng trọ',
      MatBang: 'Mặt bằng kinh doanh',
      VanPhong: 'Văn phòng'
    };
    return map[loai] || loai || 'Bất động sản';
  };

  const formatPrice = (value, loaiGiaoDich) => {
    if (!value || Number(value) === 0) return 'Thỏa thuận';
    const num = Number(value);
    let readable = '';
    if (num >= 1_000_000_000) {
      const ty = (num / 1_000_000_000).toFixed(num % 1_000_000_000 === 0 ? 0 : 2);
      readable = `${ty} tỷ`;
    } else if (num >= 1_000_000) {
      const trieu = (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1);
      readable = `${trieu} triệu`;
    }

    if (loaiGiaoDich === 'ChoThue') {
      return readable 
        ? `${readable}/tháng (${num.toLocaleString('vi-VN')} ₫)` 
        : `${num.toLocaleString('vi-VN')} ₫/tháng`;
    }

    if (readable) {
      return `${readable} (${num.toLocaleString('vi-VN')} ₫)`;
    }
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  const formatTrangThaiBDS = (trangThaiPhong, trangThaiTinDang) => {
    if (trangThaiPhong) {
      const mapPhong = {
        Trong: 'Còn trống',
        DangThue: 'Đang thuê',
        DaDatCoc: 'Đã đặt cọc',
        BaoTri: 'Đang bảo trì'
      };
      return mapPhong[trangThaiPhong] || trangThaiPhong;
    }
    const mapTin = {
      DaDuyet: 'Đang mở bán / Hiển thị',
      DaDang: 'Đang đăng',
      ChoDuyet: 'Chờ duyệt',
      DaBan: 'Đã bán',
      DaCoc: 'Đã đặt cọc',
      TamDung: 'Tạm dừng',
      HetHan: 'Hết hạn'
    };
    return mapTin[trangThaiTinDang] || trangThaiTinDang || 'Đang hoạt động';
  };

  const formatTrangThai = (trangThai, pheDuyet) => {
    // Ưu tiên hiển thị trạng thái phê duyệt
    if (pheDuyet === 'ChoPheDuyet') return { text: 'Chờ phê duyệt của bạn', class: 'modal-chi-tiet-cuoc-hen__status-badge--warning' };
    if (pheDuyet === 'TuChoi') return { text: 'Đã từ chối', class: 'modal-chi-tiet-cuoc-hen__status-badge--danger' };
    if (pheDuyet === 'DaPheDuyet') {
      // Nếu đã phê duyệt, hiển thị trạng thái thực tế
      const statusMap = {
        'ChoXacNhan': { text: 'Chờ xác nhận', class: 'modal-chi-tiet-cuoc-hen__status-badge--warning' },
        'DaXacNhan': { text: 'Đã xác nhận', class: 'modal-chi-tiet-cuoc-hen__status-badge--success' },
        'HoanThanh': { text: 'Hoàn thành', class: 'modal-chi-tiet-cuoc-hen__status-badge--info' },
        'HuyBoiKhach': { text: 'Khách hủy', class: 'modal-chi-tiet-cuoc-hen__status-badge--gray' },
        'KhachKhongDen': { text: 'Khách không đến', class: 'modal-chi-tiet-cuoc-hen__status-badge--danger' }
      };
      return statusMap[trangThai] || { text: trangThai, class: '' };
    }
    
    // Fallback
    const statusMap = {
      'ChoXacNhan': { text: 'Chờ xác nhận', class: 'modal-chi-tiet-cuoc-hen__status-badge--warning' },
      'DaXacNhan': { text: 'Đã xác nhận', class: 'modal-chi-tiet-cuoc-hen__status-badge--success' },
      'HoanThanh': { text: 'Hoàn thành', class: 'modal-chi-tiet-cuoc-hen__status-badge--info' },
      'HuyBoiKhach': { text: 'Khách hủy', class: 'modal-chi-tiet-cuoc-hen__status-badge--gray' },
      'KhachKhongDen': { text: 'Khách không đến', class: 'modal-chi-tiet-cuoc-hen__status-badge--danger' }
    };
    return statusMap[trangThai] || { text: trangThai, class: '' };
  };

  const status = formatTrangThai(cuocHen.TrangThai, cuocHen.PheDuyetChuDuAn);

  return (
    <div className="modal-chi-tiet-cuoc-hen__overlay" onClick={onClose}>
      <div className="modal-chi-tiet-cuoc-hen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-chi-tiet-cuoc-hen__header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="modal-chi-tiet-cuoc-hen__header-icon modal-chi-tiet-cuoc-hen__header-icon--info">
              <HiOutlineCalendar />
            </div>
            <div>
              <h2 className="modal-chi-tiet-cuoc-hen__title">Chi tiết Cuộc hẹn</h2>
              <p className="modal-chi-tiet-cuoc-hen__subtitle">Mã cuộc hẹn: #{cuocHen.CuocHenID}</p>
            </div>
          </div>
          <button className="modal-chi-tiet-cuoc-hen__close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-chi-tiet-cuoc-hen__body">
          {/* Status Badge */}
          <div className="modal-chi-tiet-cuoc-hen__status-banner">
            <span className={`modal-chi-tiet-cuoc-hen__status-badge ${status.class}`}>
              {status.text}
            </span>
            {cuocHen.PheDuyetChuDuAn === 'ChoPheDuyet' && (
              <span className="modal-chi-tiet-cuoc-hen__status-note">⏰ Cuộc hẹn đang chờ bạn phê duyệt</span>
            )}
          </div>

          {/* Thông tin Cuộc hẹn */}
          <div className="modal-chi-tiet-cuoc-hen__detail-section">
            <h3 className="modal-chi-tiet-cuoc-hen__section-title">📅 Thông tin Cuộc hẹn</h3>
            <div className="modal-chi-tiet-cuoc-hen__detail-grid">
              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineClock />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Thời gian hẹn</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{formatDate(cuocHen.ThoiGianHen)}</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineCalendar />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Đã đổi lịch</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.SoLanDoiLich || 0} / 3 lần</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineClock />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Tạo lúc</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{formatDate(cuocHen.TaoLuc)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin Khách hàng */}
          <div className="modal-chi-tiet-cuoc-hen__detail-section">
            <h3 className="modal-chi-tiet-cuoc-hen__section-title">👤 Thông tin Khách hàng</h3>
            <div className="modal-chi-tiet-cuoc-hen__detail-grid">
              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineUser />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Họ tên</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TenKhachHang || 'N/A'}</div>
                  {onOpenChat && cuocHen.KhachHangID && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(cuocHen, 'khachHang')}
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #10b981',
                        background: '#ecfdf5',
                        color: '#059669',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600'
                      }}
                    >
                      <HiOutlineChatBubbleLeftRight /> Nhắn tin với Khách
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlinePhone />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Số điện thoại</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    <a href={`tel:${cuocHen.SDTKhachHang || ''}`} className="modal-chi-tiet-cuoc-hen__phone-link">
                      {cuocHen.SDTKhachHang || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineEnvelope />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Email</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    {cuocHen.EmailKhachHang || cuocHen.Email || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineCheck />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Xác minh KYC</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    {cuocHen.TrangThaiXacMinhKhach === 'DaXacMinh' ? (
                      <span className="modal-chi-tiet-cuoc-hen__kyc-badge--success">✅ Đã xác minh</span>
                    ) : (
                      <span className="modal-chi-tiet-cuoc-hen__kyc-badge--pending">⏳ Chưa xác minh</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin Bất động sản / Dự án */}
          <div className="modal-chi-tiet-cuoc-hen__detail-section">
            <h3 className="modal-chi-tiet-cuoc-hen__section-title">
              {cuocHen.TenPhong ? '🏠 Thông tin Phòng & Bất động sản' : '🏢 Thông tin Bất động sản & Dự án'}
            </h3>
            <div className="modal-chi-tiet-cuoc-hen__detail-grid">
              <div className="modal-chi-tiet-cuoc-hen__detail-item modal-chi-tiet-cuoc-hen__detail-item--full-width">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineHomeModern />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Tin đăng</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TieuDeTinDang || 'N/A'}</div>
                </div>
              </div>

              {cuocHen.TenDuAn && cuocHen.TenDuAn !== cuocHen.TieuDeTinDang && (
                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineBuildingOffice2 />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Dự án</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TenDuAn}</div>
                  </div>
                </div>
              )}

              {cuocHen.TenPhong ? (
                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineHome />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Phòng</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TenPhong}</div>
                  </div>
                </div>
              ) : (
                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineTag />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Loại Bất động sản</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">{mapLoaiBDS(cuocHen.LoaiBDS)}</div>
                  </div>
                </div>
              )}

              {(cuocHen.DienTichSuDung || cuocHen.DienTichDat) && (
                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineHome />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Diện tích</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">
                      {cuocHen.DienTichSuDung || cuocHen.DienTichDat} m²
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineBanknotes />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">
                    {cuocHen.LoaiGiaoDich === 'Ban' ? 'Giá bán' : cuocHen.LoaiGiaoDich === 'ChoThue' ? 'Giá thuê' : 'Mức giá'}
                  </div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value" style={{ color: '#059669', fontWeight: '700' }}>
                    {formatPrice(cuocHen.Gia, cuocHen.LoaiGiaoDich)}
                  </div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineCheck />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">
                    {cuocHen.TenPhong ? 'Trạng thái phòng' : 'Trạng thái BĐS'}
                  </div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    <span className="room-badge" style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      {formatTrangThaiBDS(cuocHen.TrangThaiPhong, cuocHen.TrangThaiTinDang)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item modal-chi-tiet-cuoc-hen__detail-item--full-width">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineMapPin />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Địa chỉ</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    {cuocHen.DiaChi || 'Đang cập nhật'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nhân viên phụ trách */}
          {cuocHen.TenNhanVien && (
            <div className="modal-chi-tiet-cuoc-hen__detail-section">
              <h3 className="modal-chi-tiet-cuoc-hen__section-title">👨‍💼 Nhân viên Phụ trách</h3>
              <div className="modal-chi-tiet-cuoc-hen__detail-grid">
                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineUser />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Họ tên</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TenNhanVien}</div>
                    {onOpenChat && cuocHen.NhanVienBanHangID && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(cuocHen, 'nhanVien')}
                        style={{
                          marginTop: '4px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #3b82f6',
                          background: '#eff6ff',
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                      >
                        <HiOutlineChatBubbleLeftRight /> Nhắn tin với NV
                      </button>
                    )}
                  </div>
                </div>

                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlinePhone />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Số điện thoại</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">
                      {cuocHen.SDTNhanVien || cuocHen.SoDienThoaiNV ? (
                        <a href={`tel:${cuocHen.SDTNhanVien || cuocHen.SoDienThoaiNV}`} className="modal-chi-tiet-cuoc-hen__phone-link">
                          {cuocHen.SDTNhanVien || cuocHen.SoDienThoaiNV}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>

                {cuocHen.EmailNhanVien && (
                  <div className="modal-chi-tiet-cuoc-hen__detail-item">
                    <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                      <HiOutlineEnvelope />
                    </div>
                    <div>
                      <div className="modal-chi-tiet-cuoc-hen__detail-label">Email</div>
                      <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.EmailNhanVien}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hướng dẫn vào dự án */}
          {cuocHen.PhuongThucVao && (
            <div className="modal-chi-tiet-cuoc-hen__detail-section">
              <h3 className="modal-chi-tiet-cuoc-hen__section-title">
                <HiOutlineKey className="section-icon" />
                Hướng dẫn vào Dự án
              </h3>
              <div className="modal-chi-tiet-cuoc-hen__guide-box">
                <pre className="modal-chi-tiet-cuoc-hen__guide-content">{cuocHen.PhuongThucVao}</pre>
              </div>
            </div>
          )}

          {/* Ghi chú từ khách hàng */}
          {(cuocHen.GhiChuKhach || cuocHen.GhiChu) && (
            <div className="modal-chi-tiet-cuoc-hen__detail-section">
              <h3 className="modal-chi-tiet-cuoc-hen__section-title">📝 Ghi chú từ Khách hàng</h3>
              <div className="modal-chi-tiet-cuoc-hen__note-box">
                <p>{cuocHen.GhiChuKhach || cuocHen.GhiChu}</p>
              </div>
            </div>
          )}

          {/* Kết quả cuộc hẹn */}
          {cuocHen.GhiChuKetQua && (
            <div className="modal-chi-tiet-cuoc-hen__detail-section">
              <h3 className="modal-chi-tiet-cuoc-hen__section-title">📋 Kết quả Cuộc hẹn</h3>
              <div className="modal-chi-tiet-cuoc-hen__note-box">
                <p>{cuocHen.GhiChuKetQua}</p>
              </div>
            </div>
          )}

          {/* Lịch sử thay đổi */}
          <div className="modal-chi-tiet-cuoc-hen__detail-section">
            <h3 className="modal-chi-tiet-cuoc-hen__section-title">📜 Lịch sử Thay đổi</h3>
            <div className="modal-chi-tiet-cuoc-hen__timeline">
              <div className="modal-chi-tiet-cuoc-hen__timeline-item">
                <div className="modal-chi-tiet-cuoc-hen__timeline-dot"></div>
                <div className="modal-chi-tiet-cuoc-hen__timeline-content">
                  <div className="modal-chi-tiet-cuoc-hen__timeline-time">{formatDate(cuocHen.TaoLuc)}</div>
                  <div className="modal-chi-tiet-cuoc-hen__timeline-text">Khách hàng tạo yêu cầu cuộc hẹn</div>
                </div>
              </div>

              {cuocHen.NhanVienBanHangID && (
                <div className="modal-chi-tiet-cuoc-hen__timeline-item">
                  <div className="modal-chi-tiet-cuoc-hen__timeline-dot modal-chi-tiet-cuoc-hen__timeline-dot--success"></div>
                  <div className="modal-chi-tiet-cuoc-hen__timeline-content">
                    <div className="modal-chi-tiet-cuoc-hen__timeline-time">{formatDate(cuocHen.TaoLuc)}</div>
                    <div className="modal-chi-tiet-cuoc-hen__timeline-text">Hệ thống gán nhân viên {cuocHen.TenNhanVien}</div>
                  </div>
                </div>
              )}

              {cuocHen.ThoiGianPheDuyet && (
                <div className="modal-chi-tiet-cuoc-hen__timeline-item">
                  <div className="modal-chi-tiet-cuoc-hen__timeline-dot modal-chi-tiet-cuoc-hen__timeline-dot--success"></div>
                  <div className="modal-chi-tiet-cuoc-hen__timeline-content">
                    <div className="modal-chi-tiet-cuoc-hen__timeline-time">{formatDate(cuocHen.ThoiGianPheDuyet)}</div>
                    <div className="modal-chi-tiet-cuoc-hen__timeline-text">
                      {cuocHen.PheDuyetChuDuAn === 'DaPheDuyet' 
                        ? 'Chủ dự án phê duyệt cuộc hẹn'
                        : 'Chủ dự án từ chối cuộc hẹn'}
                    </div>
                  </div>
                </div>
              )}

              {cuocHen.PheDuyetChuDuAn === 'ChoPheDuyet' && (
                <div className="modal-chi-tiet-cuoc-hen__timeline-item">
                  <div className="modal-chi-tiet-cuoc-hen__timeline-dot pending pulse"></div>
                  <div className="modal-chi-tiet-cuoc-hen__timeline-content">
                    <div className="modal-chi-tiet-cuoc-hen__timeline-time">Hiện tại</div>
                    <div className="modal-chi-tiet-cuoc-hen__timeline-text">Đang chờ bạn phê duyệt...</div>
                  </div>
                </div>
              )}

              {cuocHen.CapNhatLuc && cuocHen.CapNhatLuc !== cuocHen.TaoLuc && (
                <div className="modal-chi-tiet-cuoc-hen__timeline-item">
                  <div className="modal-chi-tiet-cuoc-hen__timeline-dot"></div>
                  <div className="modal-chi-tiet-cuoc-hen__timeline-content">
                    <div className="modal-chi-tiet-cuoc-hen__timeline-time">{formatDate(cuocHen.CapNhatLuc)}</div>
                    <div className="modal-chi-tiet-cuoc-hen__timeline-text">Cập nhật thông tin cuộc hẹn</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-chi-tiet-cuoc-hen__footer">
          <div className="modal-chi-tiet-cuoc-hen__footer-actions-left">
            <button 
              className="cda-btn cda-btn-secondary"
              onClick={() => onOpenChat && onOpenChat(cuocHen, 'khachHang')}
              disabled={!cuocHen.KhachHangID}
              title={cuocHen.KhachHangID ? 'Nhắn tin với khách hàng' : 'Không có thông tin khách hàng'}
            >
              <HiOutlineChatBubbleLeftRight />
              Trò chuyện với Khách
            </button>
            {cuocHen.SDTKhachHang ? (
              <a 
                href={`tel:${cuocHen.SDTKhachHang}`} 
                className="cda-btn cda-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <HiOutlinePhone />
                Gọi điện
              </a>
            ) : (
              <button className="cda-btn cda-btn-secondary" disabled title="Không có số điện thoại">
                <HiOutlinePhone />
                Gọi điện
              </button>
            )}
          </div>

          <div className="modal-chi-tiet-cuoc-hen__footer-actions-right">
            {cuocHen.PheDuyetChuDuAn === 'ChoPheDuyet' && (
              <>
                <button 
                  className="cda-btn cda-btn-danger"
                  onClick={() => onTuChoi(cuocHen)}
                >
                  <HiOutlineXMark />
                  Từ chối
                </button>
                <button 
                  className="cda-btn cda-btn-success"
                  onClick={() => onPheDuyet(cuocHen)}
                >
                  <HiOutlineCheck />
                  Phê duyệt
                </button>
              </>
            )}
            <button className="cda-btn cda-btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalChiTietCuocHen;
