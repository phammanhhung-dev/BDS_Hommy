import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import { operatorApi } from '../../../api/operatorApi';
import khuvucApi from '../../../api/khuvucApi';
import './ModalTaoNhanVien.css'; // Reuse ModalTaoNhanVien styles

/**
 * Modal chỉnh sửa thông tin nhân viên
 * UC-OPER-04: Quản lý hồ sơ Nhân viên
 */
const ModalChinhSuaNhanVien = ({ nhanVienId, nhanVien, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tenDayDu: '',
    email: '',
    soDienThoai: '',
    trangThai: 'Active'
  });
  const [errors, setErrors] = useState({});

  const [provinces, setProvinces] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCommuneId, setSelectedCommuneId] = useState("");
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);

  // Load danh sách tỉnh/thành phố khi component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingProvinces(true);
        const res = await khuvucApi.getAll();
        setProvinces(res.data || []);
      } catch (err) {
        console.error("Lỗi load tỉnh/thành:", err);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Thiết lập dữ liệu ban đầu
  useEffect(() => {
    if (nhanVien) {
      setFormData({
        tenDayDu: nhanVien.TenDayDu || '',
        email: nhanVien.Email || '',
        soDienThoai: nhanVien.SoDienThoai || '',
        trangThai: nhanVien.TrangThai || 'Active'
      });

      if (nhanVien.KhuVucChinhID) {
        const provId = nhanVien.KhuVucChinhID.toString();
        setSelectedProvinceId(provId);
        
        // Load communes
        const loadCommunes = async () => {
          try {
            setIsLoadingCommunes(true);
            const res = await khuvucApi.getAll({ parentId: nhanVien.KhuVucChinhID });
            setCommunes(res.data || []);
            if (nhanVien.KhuVucPhuTrachID) {
              setSelectedCommuneId(nhanVien.KhuVucPhuTrachID.toString());
            }
          } catch (err) {
            console.error("Lỗi load quận/huyện mặc định:", err);
          } finally {
            setIsLoadingCommunes(false);
          }
        };
        loadCommunes();
      }
    }
  }, [nhanVien]);

  const handleProvinceChange = async (provinceId) => {
    setSelectedProvinceId(provinceId);
    setSelectedCommuneId("");
    if (!provinceId) {
      setCommunes([]);
      return;
    }
    try {
      setIsLoadingCommunes(true);
      const res = await khuvucApi.getAll({ parentId: provinceId });
      setCommunes(res.data || []);
    } catch (err) {
      console.error("Lỗi load quận/huyện:", err);
    } finally {
      setIsLoadingCommunes(false);
    }
  };

  const capNhatMutation = useMutation({
    mutationFn: (data) => operatorApi.nhanVien.capNhat(nhanVienId, data),
    onSuccess: () => {
      alert('✅ Cập nhật thông tin nhân viên thành công!');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tenDayDu || formData.tenDayDu.trim().length < 3) {
      newErrors.tenDayDu = 'Họ tên phải có ít nhất 3 ký tự';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.soDienThoai || !phoneRegex.test(formData.soDienThoai)) {
      newErrors.soDienThoai = 'Số điện thoại phải có 10 chữ số';
    }

    if (!selectedProvinceId) {
      newErrors.khuVucChinh = 'Vui lòng chọn Khu vực chính';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await capNhatMutation.mutateAsync({
      TenDayDu: formData.tenDayDu.trim(),
      SoDienThoai: formData.soDienThoai,
      KhuVucChinhID: parseInt(selectedProvinceId),
      KhuVucPhuTrachID: selectedCommuneId ? parseInt(selectedCommuneId) : parseInt(selectedProvinceId),
      TrangThai: formData.trangThai
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
      title={`✏️ Chỉnh sửa Nhân viên #${nhanVienId}`}
      size="medium"
    >
      <div className="modal-chinh-sua-nv__content">
        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-chinh-sua-nv__form">
          {/* Họ tên */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="tenDayDu" className="modal-chinh-sua-nv__label">
              Họ và tên <span className="modal-chinh-sua-nv__required">*</span>
            </label>
            <input
              type="text"
              id="tenDayDu"
              className={`modal-chinh-sua-nv__input ${errors.tenDayDu ? 'has-error' : ''}`}
              value={formData.tenDayDu}
              onChange={(e) => handleChange('tenDayDu', e.target.value)}
              disabled={capNhatMutation.isLoading}
            />
            {errors.tenDayDu && (
              <span className="modal-chinh-sua-nv__error">{errors.tenDayDu}</span>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="email" className="modal-chinh-sua-nv__label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="modal-chinh-sua-nv__input"
              value={formData.email}
              disabled
              readOnly
            />
            <span className="modal-chinh-sua-nv__help-text">
              Email không thể thay đổi
            </span>
          </div>

          {/* Số điện thoại */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="soDienThoai" className="modal-chinh-sua-nv__label">
              Số điện thoại <span className="modal-chinh-sua-nv__required">*</span>
            </label>
            <input
              type="tel"
              id="soDienThoai"
              className={`modal-chinh-sua-nv__input ${errors.soDienThoai ? 'has-error' : ''}`}
              value={formData.soDienThoai}
              onChange={(e) => handleChange('soDienThoai', e.target.value)}
              maxLength={10}
              disabled={capNhatMutation.isLoading}
            />
            {errors.soDienThoai && (
              <span className="modal-chinh-sua-nv__error">{errors.soDienThoai}</span>
            )}
          </div>

          {/* Khu vực chính */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="khuVucChinh" className="modal-chinh-sua-nv__label">
              Khu vực chính (Tỉnh/Thành) <span className="modal-chinh-sua-nv__required">*</span>
            </label>
            <select
              id="khuVucChinh"
              className={`modal-chinh-sua-nv__select ${errors.khuVucChinh ? 'has-error' : ''}`}
              value={selectedProvinceId}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={capNhatMutation.isLoading || isLoadingProvinces}
            >
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {provinces.map((prov) => (
                <option key={prov.KhuVucID} value={prov.KhuVucID}>
                  {prov.TenKhuVuc}
                </option>
              ))}
            </select>
            {errors.khuVucChinh && (
              <span className="modal-chinh-sua-nv__error">{errors.khuVucChinh}</span>
            )}
          </div>

          {/* Khu vực phụ trách */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="khuVucPhuTrach" className="modal-chinh-sua-nv__label">
              Khu vực phụ trách (Quận/Huyện)
            </label>
            <select
              id="khuVucPhuTrach"
              className="modal-chinh-sua-nv__select"
              value={selectedCommuneId}
              onChange={(e) => setSelectedCommuneId(e.target.value)}
              disabled={capNhatMutation.isLoading || isLoadingCommunes || !selectedProvinceId}
            >
              <option value="">-- Chọn Quận/Huyện (Mặc định chọn toàn Tỉnh/Thành) --</option>
              {communes.map((comm) => (
                <option key={comm.KhuVucID} value={comm.KhuVucID}>
                  {comm.TenKhuVuc}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="modal-chinh-sua-nv__form-group">
            <label htmlFor="trangThai" className="modal-chinh-sua-nv__label">
              Trạng thái <span className="modal-chinh-sua-nv__required">*</span>
            </label>
            <select
              id="trangThai"
              className="modal-chinh-sua-nv__select"
              value={formData.trangThai}
              onChange={(e) => handleChange('trangThai', e.target.value)}
              disabled={capNhatMutation.isLoading}
            >
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Không hoạt động</option>
              <option value="Nghi">Nghỉ</option>
            </select>
          </div>

          {/* Actions */}
          <div className="modal-chinh-sua-nv__actions">
            <button
              type="button"
              className="operator-btn operator-btn--secondary"
              onClick={onClose}
              disabled={capNhatMutation.isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="operator-btn operator-btn--primary"
              disabled={capNhatMutation.isLoading}
            >
              {capNhatMutation.isLoading ? 'Đang xử lý...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </ModalOperator>
  );
};

export default ModalChinhSuaNhanVien;

