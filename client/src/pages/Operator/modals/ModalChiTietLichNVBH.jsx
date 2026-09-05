import { useMemo } from 'react';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import './ModalChiTietLichNVBH.css';

/**
 * Modal chi tiết Lịch làm việc NVBH
 * Hiển thị:
 * - Thông tin NVBH
 * - Khung giờ ca làm
 * - Danh sách cuộc hẹn trong ca làm đó
 */
const ModalChiTietLichNVBH = ({ shift, appointments = [], onClose, onGanLai }) => {
  const caAppointments = useMemo(() => {
    if (!shift || !Array.isArray(appointments)) return [];
    const start = new Date(shift.BatDau);
    const end = new Date(shift.KetThuc);

    return appointments.filter((ch) => {
      const time = new Date(ch.ThoiGianHen);
      return time >= start && time <= end && ch.NhanVienBanHangID === shift.NhanVienBanHangID;
    });
  }, [shift, appointments]);

  if (!shift) {
    return null;
  }

  const formatDateTime = (value) =>
    new Date(value).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  return (
    <ModalOperator
      isOpen={true}
      onClose={onClose}
      title="📊 Chi tiết lịch NVBH"
      size="large"
    >
      <div className="modal-lich-nvbh">
        <div className="modal-lich-nvbh__header">
          <div className="modal-lich-nvbh__employee">
            <div className="modal-lich-nvbh__employee-name">
              {shift.TenNhanVien || 'Nhân viên bán hàng'}
            </div>
            <div className="modal-lich-nvbh__employee-meta">
              <span>{shift.MaNhanVien || `ID: ${shift.NhanVienBanHangID}`}</span>
              {shift.SoDienThoai && <span>{shift.SoDienThoai}</span>}
            </div>
          </div>
          <div className="modal-lich-nvbh__summary">
            <div className="modal-lich-nvbh__summary-item">
              <span className="modal-lich-nvbh__summary-label">Thời gian ca</span>
              <span className="modal-lich-nvbh__summary-value">
                {formatDateTime(shift.BatDau)} - {formatDateTime(shift.KetThuc)}
              </span>
            </div>
            <div className="modal-lich-nvbh__summary-item">
              <span className="modal-lich-nvbh__summary-label">Khu vực</span>
              <span className="modal-lich-nvbh__summary-value">
                {shift.TenKhuVuc || '—'}
              </span>
            </div>
            <div className="modal-lich-nvbh__summary-item">
              <span className="modal-lich-nvbh__summary-label">Cuộc hẹn</span>
              <span className="modal-lich-nvbh__summary-value">
                {caAppointments.length} cuộc hẹn ({shift.SoCuocHenDaXacNhan || 0} đã xác nhận)
              </span>
            </div>
          </div>
        </div>

        <div className="modal-lich-nvbh__body">
          {caAppointments.length === 0 ? (
            <div className="modal-lich-nvbh__empty">
              Chưa có cuộc hẹn nào trong ca làm này.
            </div>
          ) : (
            <div className="modal-lich-nvbh__list">
              {caAppointments.map((ch) => (
                <div key={ch.CuocHenID} className="modal-lich-nvbh__item">
                  <div className="modal-lich-nvbh__item-main">
                    <div className="modal-lich-nvbh__item-time">
                      {new Date(ch.ThoiGianHen).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="modal-lich-nvbh__item-info">
                      <div className="modal-lich-nvbh__item-customer">
                        {ch.TenKhachHang} • {ch.SoDienThoaiKhach}
                      </div>
                      <div className="modal-lich-nvbh__item-room">
                        {ch.TenPhong} - {ch.TenDuAn}
                      </div>
                    </div>
                  </div>
                  <div className="modal-lich-nvbh__item-actions">
                    <span className={`modal-lich-nvbh__badge modal-lich-nvbh__badge--${(ch.TrangThai || '').toLowerCase()}`}>
                      {ch.TrangThai === 'ChoXacNhan' && 'Chờ xác nhận'}
                      {ch.TrangThai === 'DaXacNhan' && 'Đã xác nhận'}
                      {ch.TrangThai === 'HoanThanh' && 'Hoàn thành'}
                      {ch.TrangThai === 'Huy' && 'Đã hủy'}
                      {!['ChoXacNhan', 'DaXacNhan', 'HoanThanh', 'Huy'].includes(ch.TrangThai) && ch.TrangThai}
                    </span>
                    {(ch.TrangThai === 'ChoXacNhan' || ch.TrangThai === 'DaXacNhan') && (
                      <button
                        type="button"
                        className="operator-btn operator-btn--sm operator-btn--primary"
                        onClick={() => onGanLai && onGanLai(ch)}
                      >
                        🔄 Gán lại
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-lich-nvbh__footer">
          <button
            type="button"
            className="operator-btn operator-btn--secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </ModalOperator>
  );
};

export default ModalChiTietLichNVBH;







