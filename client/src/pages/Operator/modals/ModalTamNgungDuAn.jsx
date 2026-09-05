import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import { operatorApi } from '../../../api/operatorApi';
import './ModalTamNgungDuAn.css';

/**
 * Modal tạm ngưng hoạt động dự án
 * Operator chọn lý do và nhập mô tả chi tiết
 */
const ModalTamNgungDuAn = ({ duAnId, tenDuAn, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lyDo: '',
    moTa: ''
  });
  const [errors, setErrors] = useState({});

  const tamNgungMutation = useMutation({
    mutationFn: (data) => operatorApi.duAn.tamNgung(data.duAnId, data.payload),
    onSuccess: () => {
      alert('✅ Tạm ngưng dự án thành công!');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  });

  const lyDoOptions = [
    { value: 'Vi phạm quy định', label: 'Vi phạm quy định hệ thống' },
    { value: 'Thông tin không chính xác', label: 'Thông tin không chính xác' },
    { value: 'Khiếu nại từ người dùng', label: 'Khiếu nại từ người dùng' },
    { value: 'Không hoạt động lâu', label: 'Không hoạt động trong thời gian dài' },
    { value: 'Yêu cầu từ chủ dự án', label: 'Yêu cầu từ chủ dự án' },
    { value: 'Khác', label: 'Lý do khác' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.lyDo) {
      newErrors.lyDo = 'Vui lòng chọn lý do tạm ngưng';
    }

    if (!formData.moTa || formData.moTa.trim().length < 20) {
      newErrors.moTa = 'Mô tả chi tiết phải có ít nhất 20 ký tự';
    } else if (formData.moTa.length > 500) {
      newErrors.moTa = 'Mô tả chi tiết không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn tạm ngưng dự án "${tenDuAn}"?`)) {
      return;
    }

    await tamNgungMutation.mutateAsync({
      duAnId,
      payload: {
        LyDoTamNgung: formData.lyDo,
        MoTaTamNgung: formData.moTa.trim()
      }
    });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <ModalOperator
      isOpen={true}
      onClose={onClose}
      title="⏸️ Tạm ngưng dự án"
      size="medium"
    >
      <div className="modal-tam-ngung__content">
        {/* Thông tin dự án */}
        <div className="modal-tam-ngung__info">
          <div className="modal-tam-ngung__info-label">Dự án:</div>
          <div className="modal-tam-ngung__info-value">
            #{duAnId} - {tenDuAn}
          </div>
        </div>

        {/* Warning */}
        <div className="modal-tam-ngung__warning">
          ⚠️ <strong>Lưu ý:</strong> Tạm ngưng dự án sẽ ẩn tất cả tin đăng liên quan và 
          thông báo cho Chủ dự án. Chủ dự án có thể gửi yêu cầu mở lại sau khi khắc phục.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-tam-ngung__form">
          {/* Lý do */}
          <div className="modal-tam-ngung__form-group">
            <label htmlFor="lyDo" className="modal-tam-ngung__label">
              Lý do tạm ngưng <span className="modal-tam-ngung__required">*</span>
            </label>
            <select
              id="lyDo"
              className={`modal-tam-ngung__select ${errors.lyDo ? 'has-error' : ''}`}
              value={formData.lyDo}
              onChange={(e) => handleChange('lyDo', e.target.value)}
              disabled={tamNgungMutation.isLoading}
            >
              <option value="">-- Chọn lý do --</option>
              {lyDoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.lyDo && (
              <span className="modal-tam-ngung__error">{errors.lyDo}</span>
            )}
          </div>

          {/* Mô tả chi tiết */}
          <div className="modal-tam-ngung__form-group">
            <label htmlFor="moTa" className="modal-tam-ngung__label">
              Mô tả chi tiết <span className="modal-tam-ngung__required">*</span>
            </label>
            <textarea
              id="moTa"
              className={`modal-tam-ngung__textarea ${errors.moTa ? 'has-error' : ''}`}
              placeholder="Nhập mô tả chi tiết về lý do tạm ngưng (tối thiểu 20 ký tự)..."
              value={formData.moTa}
              onChange={(e) => handleChange('moTa', e.target.value)}
              rows={5}
              maxLength={500}
              disabled={tamNgungMutation.isLoading}
            />
            
            <div className="modal-tam-ngung__textarea-info">
              <span className={errors.moTa ? 'modal-tam-ngung__error' : ''}>
                {errors.moTa || `${formData.moTa.length}/500 ký tự`}
              </span>
              {formData.moTa.length > 0 && formData.moTa.length < 20 && !errors.moTa && (
                <span className="modal-tam-ngung__hint">
                  Còn thiếu {20 - formData.moTa.length} ký tự
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="modal-tam-ngung__actions">
            <button
              type="button"
              className="operator-btn operator-btn--secondary"
              onClick={onClose}
              disabled={tamNgungMutation.isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="operator-btn operator-btn--warning"
              disabled={tamNgungMutation.isLoading || !formData.lyDo || !formData.moTa}
            >
              {tamNgungMutation.isLoading ? 'Đang xử lý...' : '⏸️ Tạm ngưng dự án'}
            </button>
          </div>
        </form>
      </div>
    </ModalOperator>
  );
};

export default ModalTamNgungDuAn;

