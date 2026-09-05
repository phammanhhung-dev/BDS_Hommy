import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import { operatorApi } from '../../../api/operatorApi';
import './ModalTaoBienBan.css'; // Reuse ModalTaoBienBan styles

/**
 * Modal ký biên bản
 * Operator thực hiện ký điện tử cho biên bản
 */
const ModalKyBienBan = ({ bienBanId, bienBan, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nguoiKy: 'Khach', // 'Khach' or 'NVBH'
    chuKy: ''
  });
  const [errors, setErrors] = useState({});

  const kyMutation = useMutation({
    mutationFn: (data) => operatorApi.bienBan.ky(bienBanId, data),
    onSuccess: () => {
      alert('✅ Ký biên bản thành công!');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.chuKy || formData.chuKy.trim().length < 3) {
      newErrors.chuKy = 'Chữ ký phải có ít nhất 3 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const confirmMsg = formData.nguoiKy === 'Khach' 
      ? 'Bạn xác nhận ký bởi Khách hàng?'
      : 'Bạn xác nhận ký bởi NVBH?';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    await kyMutation.mutateAsync({
      NguoiKy: formData.nguoiKy,
      ChuKy: formData.chuKy.trim()
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
      title="✍️ Ký biên bản"
      size="medium"
    >
      <div className="modal-ky-bb__content">
        {/* Thông tin biên bản */}
        <div className="modal-ky-bb__info">
          <div className="modal-ky-bb__info-row">
            <label>Mã biên bản:</label>
            <span>BB-{bienBanId}</span>
          </div>
          <div className="modal-ky-bb__info-row">
            <label>Khách hàng:</label>
            <span>{bienBan.TenKhachHang}</span>
          </div>
          <div className="modal-ky-bb__info-row">
            <label>NVBH:</label>
            <span>{bienBan.TenNVBH}</span>
          </div>
          <div className="modal-ky-bb__info-row">
            <label>Phòng:</label>
            <span>{bienBan.TenPhong}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="modal-ky-bb__warning">
          ⚠️ <strong>Lưu ý:</strong> Sau khi cả hai bên ký, biên bản sẽ được xác nhận 
          và không thể chỉnh sửa.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-ky-bb__form">
          {/* Người ký */}
          <div className="modal-ky-bb__form-group">
            <label htmlFor="nguoiKy" className="modal-ky-bb__label">
              Ký bởi <span className="modal-ky-bb__required">*</span>
            </label>
            <select
              id="nguoiKy"
              className="modal-ky-bb__select"
              value={formData.nguoiKy}
              onChange={(e) => handleChange('nguoiKy', e.target.value)}
              disabled={kyMutation.isLoading}
            >
              <option value="Khach">Khách hàng</option>
              <option value="NVBH">Nhân viên Bán hàng</option>
            </select>
          </div>

          {/* Chữ ký điện tử */}
          <div className="modal-ky-bb__form-group">
            <label htmlFor="chuKy" className="modal-ky-bb__label">
              Chữ ký điện tử <span className="modal-ky-bb__required">*</span>
            </label>
            <input
              type="text"
              id="chuKy"
              className={`modal-ky-bb__input ${errors.chuKy ? 'has-error' : ''}`}
              placeholder="Nhập họ tên làm chữ ký..."
              value={formData.chuKy}
              onChange={(e) => handleChange('chuKy', e.target.value)}
              disabled={kyMutation.isLoading}
            />
            {errors.chuKy && (
              <span className="modal-ky-bb__error">{errors.chuKy}</span>
            )}
          </div>

          {/* Actions */}
          <div className="modal-ky-bb__actions">
            <button
              type="button"
              className="operator-btn operator-btn--secondary"
              onClick={onClose}
              disabled={kyMutation.isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="operator-btn operator-btn--success"
              disabled={kyMutation.isLoading || !formData.chuKy}
            >
              {kyMutation.isLoading ? 'Đang xử lý...' : '✍️ Xác nhận ký'}
            </button>
          </div>
        </form>
      </div>
    </ModalOperator>
  );
};

export default ModalKyBienBan;

