import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import { operatorApi } from '../../../api/operatorApi';
import './ModalTaoBienBan.css';

/**
 * Modal tạo biên bản bàn giao mới
 * Chọn cuộc hẹn đã hoàn thành để tạo biên bản
 */
const ModalTaoBienBan = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    cuocHenId: '',
    ghiChu: ''
  });
  const [errors, setErrors] = useState({});

  // Query danh sách cuộc hẹn hoàn thành
  const { data: cuocHenList, isLoading: loadingCuocHen } = useQuery({
    queryKey: ['cuocHenHoanThanh'],
    queryFn: () => operatorApi.cuocHen.getDanhSachHoanThanh()
  });

  const taoMutation = useMutation({
    mutationFn: (data) => operatorApi.bienBan.taoMoi(data),
    onSuccess: () => {
      alert('✅ Tạo biên bản thành công!');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cuocHenId) {
      newErrors.cuocHenId = 'Vui lòng chọn cuộc hẹn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await taoMutation.mutateAsync({
      CuocHenID: parseInt(formData.cuocHenId),
      GhiChu: formData.ghiChu.trim() || null
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
      title="➕ Tạo Biên bản mới"
      size="medium"
    >
      <div className="modal-tao-bb__content">
        {/* Info */}
        <div className="modal-tao-bb__info">
          💡 Chỉ có thể tạo biên bản từ các cuộc hẹn đã hoàn thành
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-tao-bb__form">
          {/* Chọn cuộc hẹn */}
          <div className="modal-tao-bb__form-group">
            <label htmlFor="cuocHenId" className="modal-tao-bb__label">
              Cuộc hẹn <span className="modal-tao-bb__required">*</span>
            </label>
            {loadingCuocHen ? (
              <div className="modal-tao-bb__loading">Đang tải...</div>
            ) : (
              <select
                id="cuocHenId"
                className={`modal-tao-bb__select ${errors.cuocHenId ? 'has-error' : ''}`}
                value={formData.cuocHenId}
                onChange={(e) => handleChange('cuocHenId', e.target.value)}
                disabled={taoMutation.isLoading}
              >
                <option value="">-- Chọn cuộc hẹn --</option>
                {cuocHenList?.data?.map(ch => (
                  <option key={ch.CuocHenID} value={ch.CuocHenID}>
                    #{ch.CuocHenID} - {ch.TenKhachHang} - {ch.TenPhong} ({new Date(ch.ThoiGianHen).toLocaleDateString('vi-VN')})
                  </option>
                ))}
              </select>
            )}
            {errors.cuocHenId && (
              <span className="modal-tao-bb__error">{errors.cuocHenId}</span>
            )}
          </div>

          {/* Ghi chú */}
          <div className="modal-tao-bb__form-group">
            <label htmlFor="ghiChu" className="modal-tao-bb__label">
              Ghi chú
            </label>
            <textarea
              id="ghiChu"
              className="modal-tao-bb__textarea"
              placeholder="Nhập ghi chú nếu cần..."
              value={formData.ghiChu}
              onChange={(e) => handleChange('ghiChu', e.target.value)}
              rows={4}
              maxLength={500}
              disabled={taoMutation.isLoading}
            />
            <div className="modal-tao-bb__textarea-info">
              <span>{formData.ghiChu.length}/500 ký tự</span>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-tao-bb__actions">
            <button
              type="button"
              className="operator-btn operator-btn--secondary"
              onClick={onClose}
              disabled={taoMutation.isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="operator-btn operator-btn--primary"
              disabled={taoMutation.isLoading || !formData.cuocHenId}
            >
              {taoMutation.isLoading ? 'Đang xử lý...' : '➕ Tạo biên bản'}
            </button>
          </div>
        </form>
      </div>
    </ModalOperator>
  );
};

export default ModalTaoBienBan;

