/**
 * UC-SALE-05: Modal Báo cáo Kết quả Cuộc hẹn
 * Form with star rating and validation
 */

import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import { baoCaoKetQuaCuocHen } from '../../api/nhanVienBanHangApi';
import StarRating from './StarRating';
import './ModalBaoCaoKetQua.css';

/**
 * @param {Object} props
 * @param {Object} props.appointment - Appointment object
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSubmit - Submit callback
 */
const ModalBaoCaoKetQua = ({ appointment, isOpen, onClose, onSubmit }) => {
  const modalRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    trangThai: 'HoanThanh',
    mucDoQuanTam: 0,
    ghiChuKetQua: '',
    nhuCauThucTe: [],
    khaNangChot: 'TrungBinh'
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        trangThai: 'HoanThanh',
        mucDoQuanTam: 0,
        ghiChuKetQua: '',
        nhuCauThucTe: [],
        khaNangChot: 'TrungBinh'
      });
      setErrors({});
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTab = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      modalRef.current.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => {
        modalRef.current?.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.trangThai) {
      newErrors.trangThai = 'Vui lòng chọn trạng thái';
    }

    if (formData.mucDoQuanTam === 0) {
      newErrors.mucDoQuanTam = 'Vui lòng đánh giá mức độ quan tâm';
    }

    if (!formData.ghiChuKetQua.trim()) {
      newErrors.ghiChuKetQua = 'Vui lòng nhập ghi chú kết quả';
    } else if (formData.ghiChuKetQua.length > 500) {
      newErrors.ghiChuKetQua = 'Ghi chú không được vượt quá 500 ký tự';
    }

    if (!formData.khaNangChot) {
      newErrors.khaNangChot = 'Vui lòng chọn khả năng chốt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNhuCauChange = (value) => {
    setFormData(prev => {
      const nhuCauThucTe = prev.nhuCauThucTe.includes(value)
        ? prev.nhuCauThucTe.filter(v => v !== value)
        : [...prev.nhuCauThucTe, value];
      return { ...prev, nhuCauThucTe };
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      // Map frontend state to backend API format
      const payload = {
        ketQua: formData.trangThai === 'HoanThanh' ? 'thanh_cong' : 'that_bai',
        khachQuanTam: formData.mucDoQuanTam > 0, // Convert rating to boolean
        lyDoThatBai: formData.trangThai === 'ThatBai' ? formData.ghiChuKetQua : null,
        keHoachFollowUp: formData.khaNangChot !== 'ThapQuaMuc' ? `Khả năng chốt: ${formData.khaNangChot}` : null,
        ghiChu: formData.ghiChuKetQua
      };

      const response = await baoCaoKetQuaCuocHen(appointment.CuocHenID, payload);

      if (response.success) {
        alert('Đã báo cáo kết quả thành công');
        onSubmit();
      }
    } catch (err) {
      console.error('[ModalBaoCaoKetQua] Submit error:', err);
      alert('Không thể báo cáo kết quả: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="nvbh-modal-bao-cao-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="nvbh-modal-bao-cao"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nvbh-modal-bao-cao__header">
          <h2 id="modal-title">Báo cáo Kết quả Cuộc hẹn</h2>
          <button
            className="nvbh-modal-bao-cao__close"
            onClick={onClose}
            aria-label="Đóng"
            type="button"
          >
            <HiOutlineXMark />
          </button>
        </div>

        {/* Form */}
        <form className="nvbh-modal-bao-cao__form" onSubmit={handleSubmit}>
          {/* Trạng thái */}
          <div className="nvbh-form-field">
            <label htmlFor="trang-thai" className="nvbh-form-field__label">
              Trạng thái cuộc hẹn <span className="nvbh-form-field__required">*</span>
            </label>
            <select
              id="trang-thai"
              className={`nvbh-form-field__select ${errors.trangThai ? 'nvbh-form-field__select--error' : ''}`}
              value={formData.trangThai}
              onChange={(e) => handleChange('trangThai', e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.trangThai}
              aria-describedby={errors.trangThai ? 'trang-thai-error' : undefined}
            >
              <option value="HoanThanh">Hoàn thành</option>
              <option value="KhachKhongDen">Khách không đến</option>
            </select>
            {errors.trangThai && (
              <span id="trang-thai-error" className="nvbh-form-field__error" role="alert">
                {errors.trangThai}
              </span>
            )}
          </div>

          {/* Mức độ quan tâm */}
          <div className="nvbh-form-field">
            <label className="nvbh-form-field__label">
              Mức độ quan tâm <span className="nvbh-form-field__required">*</span>
            </label>
            <StarRating
              value={formData.mucDoQuanTam}
              onChange={(value) => handleChange('mucDoQuanTam', value)}
              size="lg"
              label="Đánh giá mức độ quan tâm của khách hàng"
            />
            {errors.mucDoQuanTam && (
              <span className="nvbh-form-field__error" role="alert">
                {errors.mucDoQuanTam}
              </span>
            )}
          </div>

          {/* Nhu cầu thực tế */}
          <div className="nvbh-form-field">
            <label className="nvbh-form-field__label">
              Nhu cầu thực tế
            </label>
            <div className="nvbh-form-field__checkboxes">
              {['Giá phù hợp', 'Vị trí tốt', 'Diện tích đủ', 'Tiện nghi đầy đủ', 'Cần sớm'].map(item => (
                <label key={item} className="nvbh-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.nhuCauThucTe.includes(item)}
                    onChange={() => handleNhuCauChange(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Khả năng chốt */}
          <div className="nvbh-form-field">
            <label className="nvbh-form-field__label">
              Khả năng chốt <span className="nvbh-form-field__required">*</span>
            </label>
            <div className="nvbh-form-field__radios">
              {[
                { value: 'Cao', label: 'Cao', color: 'success' },
                { value: 'TrungBinh', label: 'Trung bình', color: 'warning' },
                { value: 'Thap', label: 'Thấp', color: 'danger' }
              ].map(option => (
                <label key={option.value} className={`nvbh-radio nvbh-radio--${option.color}`}>
                  <input
                    type="radio"
                    name="khaNangChot"
                    value={option.value}
                    checked={formData.khaNangChot === option.value}
                    onChange={(e) => handleChange('khaNangChot', e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.khaNangChot && (
              <span className="nvbh-form-field__error" role="alert">
                {errors.khaNangChot}
              </span>
            )}
          </div>

          {/* Ghi chú kết quả */}
          <div className="nvbh-form-field">
            <label htmlFor="ghi-chu" className="nvbh-form-field__label">
              Ghi chú kết quả <span className="nvbh-form-field__required">*</span>
            </label>
            <textarea
              id="ghi-chu"
              className={`nvbh-form-field__textarea ${errors.ghiChuKetQua ? 'nvbh-form-field__textarea--error' : ''}`}
              value={formData.ghiChuKetQua}
              onChange={(e) => handleChange('ghiChuKetQua', e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Mô tả chi tiết kết quả cuộc hẹn, phản hồi của khách hàng..."
              aria-required="true"
              aria-invalid={!!errors.ghiChuKetQua}
              aria-describedby={errors.ghiChuKetQua ? 'ghi-chu-error note-help' : 'note-help'}
            />
            <div className="nvbh-form-field__help-row">
              <span id="note-help" className="nvbh-form-field__help">
                {formData.ghiChuKetQua.length}/500 ký tự
              </span>
            </div>
            {errors.ghiChuKetQua && (
              <span id="ghi-chu-error" className="nvbh-form-field__error" role="alert">
                {errors.ghiChuKetQua}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="nvbh-modal-bao-cao__actions">
            <button
              type="button"
              className="nvbh-btn-bao-cao nvbh-btn-bao-cao--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="nvbh-btn-bao-cao nvbh-btn-bao-cao--primary"
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBaoCaoKetQua;







