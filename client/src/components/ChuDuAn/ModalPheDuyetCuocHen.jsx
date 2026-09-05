import React, { useState } from 'react';
import './ModalPheDuyetCuocHen.css';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineClock, HiOutlineUser, HiOutlineHome, HiOutlineKey } from 'react-icons/hi2';
import { CuocHenService } from '../../services/ChuDuAnService';

/**
 * Modal Phê duyệt Cuộc hẹn
 * UC-PROJ-02: Xác nhận cuộc hẹn (nếu yêu cầu)
 */
function ModalPheDuyetCuocHen({ cuocHen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phuongThucVao: cuocHen?.PhuongThucVao || '',
    ghiChu: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phuongThucVao.trim()) {
      alert('Vui lòng nhập hướng dẫn vào dự án');
      return;
    }

    try {
      setLoading(true);
      
      await CuocHenService.pheDuyet(
        cuocHen.CuocHenID, 
        formData.phuongThucVao, 
        formData.ghiChu
      );

      alert('✅ Đã phê duyệt cuộc hẹn thành công!\nHệ thống đã gửi thông báo cho khách hàng và nhân viên.');
      onSuccess();
    } catch (error) {
      console.error('Lỗi phê duyệt:', error);
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
    <div className="modal-phe-duyet-cuoc-hen__overlay" onClick={onClose}>
      <div className="modal-phe-duyet-cuoc-hen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-phe-duyet-cuoc-hen__header modal-phe-duyet-cuoc-hen__header--success">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="modal-phe-duyet-cuoc-hen__header-icon modal-phe-duyet-cuoc-hen__header-icon--success">
              <HiOutlineCheck />
            </div>
            <div>
              <h2 className="modal-phe-duyet-cuoc-hen__title">Phê duyệt Cuộc hẹn</h2>
              <p className="modal-phe-duyet-cuoc-hen__subtitle">Xác nhận cuộc hẹn #{cuocHen?.CuocHenID}</p>
            </div>
          </div>
          <button className="modal-phe-duyet-cuoc-hen__close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-phe-duyet-cuoc-hen__body">
          {/* Thông tin cuộc hẹn */}
          <div className="modal-phe-duyet-cuoc-hen__form-section">
            <h3 className="modal-phe-duyet-cuoc-hen__section-title">📅 Thông tin cuộc hẹn</h3>
            <div className="modal-phe-duyet-cuoc-hen__info-grid">
              <div className="modal-phe-duyet-cuoc-hen__info-item">
                <HiOutlineClock className="modal-phe-duyet-cuoc-hen__info-icon" />
                <div>
                  <div className="modal-phe-duyet-cuoc-hen__info-label">Thời gian</div>
                  <div className="modal-phe-duyet-cuoc-hen__info-value">{formatDate(cuocHen?.ThoiGianHen)}</div>
                </div>
              </div>
              
              <div className="modal-phe-duyet-cuoc-hen__info-item">
                <HiOutlineUser className="modal-phe-duyet-cuoc-hen__info-icon" />
                <div>
                  <div className="modal-phe-duyet-cuoc-hen__info-label">Khách hàng</div>
                  <div className="modal-phe-duyet-cuoc-hen__info-value">{cuocHen?.TenKhachHang || 'N/A'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{cuocHen?.SoDienThoaiKhach || 'N/A'}</div>
                </div>
              </div>
              
              <div className="modal-phe-duyet-cuoc-hen__info-item">
                <HiOutlineHome className="modal-phe-duyet-cuoc-hen__info-icon" />
                <div>
                  <div className="modal-phe-duyet-cuoc-hen__info-label">Phòng</div>
                  <div className="modal-phe-duyet-cuoc-hen__info-value">{cuocHen?.TenPhong || 'N/A'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{cuocHen?.TenDuAn || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form nhập hướng dẫn */}
          <form onSubmit={handleSubmit}>
            <div className="modal-phe-duyet-cuoc-hen__form-section">
              <h3 className="modal-phe-duyet-cuoc-hen__section-title">
                <HiOutlineKey className="modal-phe-duyet-cuoc-hen__section-icon" />
                Hướng dẫn vào dự án
              </h3>
              <p className="modal-phe-duyet-cuoc-hen__section-description">
                Thông tin này sẽ được gửi tự động cho khách hàng qua SMS/Email
              </p>
              
              <div className="modal-phe-duyet-cuoc-hen__form-group">
                <label className="modal-phe-duyet-cuoc-hen__label">
                  Phương thức vào dự án <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  className="modal-phe-duyet-cuoc-hen__textarea"
                  rows="5"
                  placeholder="Ví dụ:&#10;• Mật khẩu cửa: 123456#&#10;• Lấy chìa khóa tại: Bảo vệ tầng 1&#10;• Gặp nhân viên tại: Sảnh chính lúc 14:00&#10;• Liên hệ: 0909123456 (Anh Mai)"
                  value={formData.phuongThucVao}
                  onChange={(e) => setFormData({ ...formData, phuongThucVao: e.target.value })}
                  required
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  💡 Hãy cung cấp thông tin chi tiết để khách hàng dễ dàng tìm đến phòng
                </div>
              </div>

              <div className="modal-phe-duyet-cuoc-hen__form-group">
                <label className="modal-phe-duyet-cuoc-hen__label">
                  Ghi chú thêm (tùy chọn)
                </label>
                <textarea
                  className="modal-phe-duyet-cuoc-hen__textarea"
                  rows="3"
                  placeholder="Ghi chú nội bộ hoặc lưu ý đặc biệt..."
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                />
              </div>
            </div>

            {/* Actions sau khi phê duyệt */}
            <div className="modal-phe-duyet-cuoc-hen__auto-actions-info">
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600' }}>✅ Hệ thống sẽ tự động:</h4>
              <ul className="modal-phe-duyet-cuoc-hen__auto-actions-list">
                <li>✓ Cập nhật trạng thái cuộc hẹn thành "Đã xác nhận"</li>
                <li>✓ Gửi SMS/Email xác nhận cho khách hàng với hướng dẫn vào dự án</li>
                <li>✓ Thông báo cho nhân viên bán hàng được phân công</li>
                <li>✓ Tạo nhắc nhở trước cuộc hẹn 1 giờ</li>
                <li>✓ Ghi nhận lịch sử thay đổi vào hệ thống</li>
              </ul>
            </div>

            {/* Footer Actions */}
            <div className="modal-phe-duyet-cuoc-hen__footer">
              <button 
                type="button"
                className="cda-btn cda-btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                <HiOutlineXMark />
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="cda-btn cda-btn-success" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="modal-phe-duyet-cuoc-hen__spinner--small"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck />
                    Xác nhận phê duyệt
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

export default ModalPheDuyetCuocHen;
