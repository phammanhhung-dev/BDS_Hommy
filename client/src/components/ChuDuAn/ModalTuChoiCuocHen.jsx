import React, { useState } from 'react';
import './ModalTuChoiCuocHen.css';
import { HiOutlineXMark, HiOutlineClock, HiOutlineUser, HiOutlineHome } from 'react-icons/hi2';
import { CuocHenService } from '../../services/ChuDuAnService';

/**
 * Modal Từ chối Cuộc hẹn
 * UC-PROJ-02: Từ chối cuộc hẹn với lý do rõ ràng
 */
function ModalTuChoiCuocHen({ cuocHen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lyDoTuChoi: '',
    lyDoKhac: '',
    ghiChu: ''
  });

  const lyDoOptions = [
    { value: 'phong_da_cho_thue', label: 'Phòng đã cho thuê' },
    { value: 'khung_gio_khong_phu_hop', label: 'Khung giờ không phù hợp' },
    { value: 'khach_khong_du_dieu_kien', label: 'Khách hàng không đủ điều kiện' },
    { value: 'du_an_tam_ngung', label: 'Dự án tạm ngừng hoạt động' },
    { value: 'khac', label: 'Lý do khác' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const lyDoFinal = formData.lyDoTuChoi === 'khac' 
      ? formData.lyDoKhac 
      : lyDoOptions.find(o => o.value === formData.lyDoTuChoi)?.label;

    if (!lyDoFinal || !lyDoFinal.trim()) {
      alert('Vui lòng chọn/nhập lý do từ chối');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn từ chối cuộc hẹn này?')) {
      return;
    }

    try {
      setLoading(true);
      
      await CuocHenService.tuChoi(cuocHen.CuocHenID, lyDoFinal);

      alert('✅ Đã từ chối cuộc hẹn.\nHệ thống đã gửi thông báo lịch sự cho khách hàng kèm gợi ý phòng khác.');
      onSuccess();
    } catch (error) {
      console.error('Lỗi từ chối:', error);
      alert('❌ Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="modal-tu-choi-cuoc-hen__overlay" onClick={onClose}>
      <div className="modal-tu-choi-cuoc-hen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-tu-choi-cuoc-hen__header modal-tu-choi-cuoc-hen__header--danger">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="modal-tu-choi-cuoc-hen__header-icon modal-tu-choi-cuoc-hen__header-icon--danger">
              <HiOutlineXMark />
            </div>
            <div>
              <h2 className="modal-tu-choi-cuoc-hen__title">Từ chối Cuộc hẹn</h2>
              <p className="modal-tu-choi-cuoc-hen__subtitle">Cuộc hẹn #{cuocHen?.CuocHenID}</p>
            </div>
          </div>
          <button className="modal-tu-choi-cuoc-hen__close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-tu-choi-cuoc-hen__body">
          {/* Thông tin cuộc hẹn */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Thông tin cuộc hẹn</h3>
            <div className="modal-tu-choi-cuoc-hen__info-grid">
              <div className="modal-tu-choi-cuoc-hen__detail-item">
                <HiOutlineClock style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Thời gian</div>
                  <div style={{ fontWeight: '600' }}>{formatDate(cuocHen?.ThoiGianHen)}</div>
                </div>
              </div>
              
              <div className="modal-tu-choi-cuoc-hen__detail-item">
                <HiOutlineUser style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Khách hàng</div>
                  <div style={{ fontWeight: '600' }}>{cuocHen?.TenKhachHang || 'N/A'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{cuocHen?.SoDienThoaiKhach || 'N/A'}</div>
                </div>
              </div>
              
              <div className="modal-tu-choi-cuoc-hen__detail-item">
                <HiOutlineHome style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Phòng</div>
                  <div style={{ fontWeight: '600' }}>{cuocHen?.TenPhong || 'N/A'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{cuocHen?.TenDuAn || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="modal-tu-choi-cuoc-hen__warning-box">
            <div className="modal-tu-choi-cuoc-hen__warning-icon">⚠️</div>
            <div className="modal-tu-choi-cuoc-hen__warning-content">
              <strong>Lưu ý quan trọng:</strong>
              <p style={{ margin: '4px 0 0 0' }}>Việc từ chối cuộc hẹn có thể ảnh hưởng đến trải nghiệm khách hàng và đánh giá của bạn. 
              Hãy đảm bảo lý do từ chối rõ ràng và hợp lý.</p>
            </div>
          </div>

          {/* Form nhập lý do */}
          <form onSubmit={handleSubmit}>
            <div>
              <div className="modal-tu-choi-cuoc-hen__form-group">
                <label className="modal-tu-choi-cuoc-hen__label">
                  Lý do từ chối <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  className="cda-select"
                  style={{ width: '100%' }}
                  value={formData.lyDoTuChoi}
                  onChange={(e) => setFormData({ ...formData, lyDoTuChoi: e.target.value })}
                  required
                >
                  <option value="">-- Chọn lý do --</option>
                  {lyDoOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.lyDoTuChoi === 'khac' && (
                <div className="modal-tu-choi-cuoc-hen__form-group">
                  <label className="modal-tu-choi-cuoc-hen__label">
                    Mô tả chi tiết lý do <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    className="modal-tu-choi-cuoc-hen__textarea"
                    rows="4"
                    placeholder="Vui lòng mô tả chi tiết lý do từ chối..."
                    value={formData.lyDoKhac}
                    onChange={(e) => setFormData({ ...formData, lyDoKhac: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="modal-tu-choi-cuoc-hen__form-group">
                <label className="modal-tu-choi-cuoc-hen__label">
                  Ghi chú nội bộ (tùy chọn)
                </label>
                <textarea
                  className="modal-tu-choi-cuoc-hen__textarea"
                  rows="3"
                  placeholder="Ghi chú nội bộ, không gửi cho khách hàng..."
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                />
              </div>
            </div>

            {/* Actions sau khi từ chối */}
            <div className="modal-tu-choi-cuoc-hen__auto-actions-info--info">
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600' }}>ℹ️ Hệ thống sẽ tự động:</h4>
              <ul className="modal-tu-choi-cuoc-hen__auto-actions-list">
                <li>• Cập nhật trạng thái cuộc hẹn thành "Đã từ chối"</li>
                <li>• Gửi thông báo lịch sự cho khách hàng kèm lý do</li>
                <li>• Đề xuất các tin đăng khác phù hợp cho khách</li>
                <li>• Thông báo cho nhân viên bán hàng</li>
                <li>• Giải phóng slot thời gian cho cuộc hẹn khác</li>
              </ul>
            </div>

            {/* Footer Actions */}
            <div className="modal-tu-choi-cuoc-hen__footer">
              <button 
                type="button"
                className="cda-btn cda-btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Quay lại
              </button>
              <button 
                type="submit"
                className="cda-btn cda-btn-danger" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="cda-spinner small"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <HiOutlineXMark />
                    Xác nhận từ chối
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalTuChoiCuocHen;
