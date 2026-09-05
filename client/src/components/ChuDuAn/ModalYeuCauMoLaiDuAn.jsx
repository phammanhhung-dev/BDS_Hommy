/**
 * Modal Yêu cầu Mở lại Dự án bị Banned
 * Component: Form giải trình để xin mở lại dự án
 */

import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlineExclamationTriangle, HiOutlinePaperAirplane } from 'react-icons/hi2';
import './ModalYeuCauMoLaiDuAn.css';

const ModalYeuCauMoLaiDuAn = ({ isOpen, onClose, onSubmit, duAn }) => {
  const [noiDungGiaiTrinh, setNoiDungGiaiTrinh] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const validate = () => {
    if (!noiDungGiaiTrinh.trim()) {
      setError('Nội dung giải trình không được để trống');
      return false;
    }
    if (noiDungGiaiTrinh.trim().length < 50) {
      setError('Nội dung giải trình phải có ít nhất 50 ký tự để giải thích rõ lý do');
      return false;
    }
    if (noiDungGiaiTrinh.length > 2000) {
      setError('Nội dung giải trình không được vượt quá 2000 ký tự');
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(duAn.DuAnID, noiDungGiaiTrinh.trim());
      // Reset form và đóng modal
      setNoiDungGiaiTrinh('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !duAn) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-yeu-cau" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header modal-header-warning">
          <div className="modal-header-icon">
            <HiOutlineExclamationTriangle />
          </div>
          <h2 className="modal-title">Yêu cầu Mở lại Dự án</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Thông tin bị banned */}
          <div className="banned-info-section">
            <h3 className="section-title">📋 Thông tin Ngưng hoạt động</h3>
            
            <div className="info-row">
              <span className="info-label">Dự án:</span>
              <span className="info-value">{duAn.TenDuAn}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Lý do ngưng:</span>
              <div className="info-value info-value-danger">
                {duAn.LyDoNgungHoatDong || 'Không có thông tin'}
              </div>
            </div>

            <div className="info-row">
              <span className="info-label">Thời gian:</span>
              <span className="info-value">
                {duAn.NgungHoatDongLuc
                  ? new Date(duAn.NgungHoatDongLuc).toLocaleString('vi-VN')
                  : 'N/A'}
              </span>
            </div>

            {duAn.NguoiNgungHoatDong_TenDayDu && (
              <div className="info-row">
                <span className="info-label">Người xử lý:</span>
                <span className="info-value">{duAn.NguoiNgungHoatDong_TenDayDu}</span>
              </div>
            )}
          </div>

          {/* Form giải trình */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">
                Nội dung giải trình (tối thiểu 50 ký tự)
              </label>
              <textarea
                className={`form-textarea ${error ? 'error' : ''}`}
                value={noiDungGiaiTrinh}
                onChange={(e) => {
                  setNoiDungGiaiTrinh(e.target.value);
                  setError(null);
                }}
                placeholder="Vui lòng giải trình chi tiết lý do vi phạm đã được khắc phục như thế nào, và cam kết tuân thủ quy định trong tương lai..."
                rows={6}
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="textarea-footer">
                <span className={`char-count ${noiDungGiaiTrinh.length < 50 ? 'warning' : 'success'}`}>
                  {noiDungGiaiTrinh.length} / 2000 ký tự
                  {noiDungGiaiTrinh.length < 50 && ` (còn thiếu ${50 - noiDungGiaiTrinh.length})`}
                </span>
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>

            {/* Warning notice */}
            <div className="warning-notice">
              <HiOutlineExclamationTriangle className="icon" />
              <div className="warning-content">
                <strong>Lưu ý quan trọng:</strong>
                <ul>
                  <li>Yêu cầu sẽ được xử lý trong vòng <strong>3-5 ngày làm việc</strong></li>
                  <li>Vui lòng giải trình rõ ràng, trung thực để tăng khả năng được chấp nhận</li>
                  <li>Nếu bị từ chối, bạn có thể gửi yêu cầu mới sau khi khắc phục triệt để</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-submit"
                disabled={isSubmitting || noiDungGiaiTrinh.trim().length < 50}
              >
                {isSubmitting ? (
                  '⏳ Đang gửi...'
                ) : (
                  <>
                    <HiOutlinePaperAirplane className="icon" />
                    Gửi yêu cầu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalYeuCauMoLaiDuAn;
