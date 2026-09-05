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
  HiOutlineCalendar
} from 'react-icons/hi2';

/**
 * Modal Chi tiết Cuộc hẹn
 * Hiển thị đầy đủ thông tin cuộc hẹn và lịch sử
 */
function ModalChiTietCuocHen({ cuocHen, onClose, onPheDuyet, onTuChoi }) {
  if (!cuocHen) return null;

  // Debug: Log cuộc hẹn data (commented out after testing)
  // console.log('🔍 ModalChiTietCuocHen - cuocHen:', cuocHen);
  // console.log('🔍 PheDuyetChuDuAn:', cuocHen.PheDuyetChuDuAn);
  // console.log('🔍 TrangThai:', cuocHen.TrangThai);

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

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return Number(value).toLocaleString('vi-VN') + ' ₫';
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
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">N/A</div>
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

          {/* Thông tin Phòng */}
          <div className="modal-chi-tiet-cuoc-hen__detail-section">
            <h3 className="modal-chi-tiet-cuoc-hen__section-title">🏠 Thông tin Phòng</h3>
            <div className="modal-chi-tiet-cuoc-hen__detail-grid">
              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineHome />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Tin đăng</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TieuDeTinDang || 'N/A'}</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineHome />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Phòng</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{cuocHen.TenPhong || 'N/A'}</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineBanknotes />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Giá thuê</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">{formatCurrency(cuocHen.Gia)}/tháng</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineMapPin />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Địa chỉ</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">N/A</div>
                </div>
              </div>

              <div className="modal-chi-tiet-cuoc-hen__detail-item modal-chi-tiet-cuoc-hen__detail-item--full-width">
                <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                  <HiOutlineCheck />
                </div>
                <div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-label">Trạng thái phòng</div>
                  <div className="modal-chi-tiet-cuoc-hen__detail-value">
                    <span className="room-badge">N/A</span>
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
                  </div>
                </div>

                <div className="modal-chi-tiet-cuoc-hen__detail-item">
                  <div className="modal-chi-tiet-cuoc-hen__detail-icon">
                    <HiOutlineChatBubbleLeftRight />
                  </div>
                  <div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-label">Liên hệ</div>
                    <div className="modal-chi-tiet-cuoc-hen__detail-value">
                      <span className="contact-note">Liên hệ qua tin nhắn hệ thống</span>
                    </div>
                  </div>
                </div>
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
          {cuocHen.GhiChuKhach && (
            <div className="modal-chi-tiet-cuoc-hen__detail-section">
              <h3 className="modal-chi-tiet-cuoc-hen__section-title">📝 Ghi chú từ Khách hàng</h3>
              <div className="modal-chi-tiet-cuoc-hen__note-box">
                <p>{cuocHen.GhiChuKhach}</p>
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
            <button className="cda-btn cda-btn-secondary">
              <HiOutlineChatBubbleLeftRight />
              Trò chuyện
            </button>
            <button className="cda-btn cda-btn-secondary">
              <HiOutlinePhone />
              Gọi điện
            </button>
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
