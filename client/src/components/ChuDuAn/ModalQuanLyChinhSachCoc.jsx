/**
 * Modal Quản lý Chính sách Cọc
 * Component: Form tạo mới/cập nhật chính sách cọc
 */

import React, { useState, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineCalendarDays,
  HiOutlineCurrencyDollar
} from 'react-icons/hi2';
import ChinhSachCocService from '../../services/ChinhSachCocService';
import './ModalQuanLyChinhSachCoc.css';

const ModalQuanLyChinhSachCoc = ({ isOpen, onClose, onSuccess, chinhSachCoc = null, mode = 'create' }) => {
  // Form state
  const [formData, setFormData] = useState({
    TenChinhSach: '',
    MoTa: '',
    ChoPhepCocGiuCho: true,
    TTL_CocGiuCho_Gio: 72, // Default 3 ngày
    TyLePhat_CocGiuCho: 100, // Default 100%
    ChoPhepCocAnNinh: false,
    SoTienCocAnNinhMacDinh: 0,
    QuyTacGiaiToa: 'BanGiao',
    SoNgayGiaiToa: null, // Số ngày giải tỏa (chỉ dùng khi QuyTacGiaiToa='TheoNgay')
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Chưa thiết lập';
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      return 'Chưa thiết lập';
    }
    return `${numeric.toLocaleString('vi-VN')} ₫`;
  };

  const getQuyTacLabel = (value) => {
    switch (value) {
      case 'BanGiao':
        return 'Giải tỏa khi bàn giao';
      case 'TheoNgay':
        return 'Giải tỏa theo ngày';
      case 'Khac':
        return 'Quy tắc khác';
      default:
        return 'Chưa cấu hình';
    }
  };

  // Load data khi mode = edit
  useEffect(() => {
    if (mode === 'edit' && chinhSachCoc) {
      setFormData({
        TenChinhSach: chinhSachCoc.TenChinhSach || '',
        MoTa: chinhSachCoc.MoTa || '',
        ChoPhepCocGiuCho: chinhSachCoc.ChoPhepCocGiuCho === 1,
        TTL_CocGiuCho_Gio: chinhSachCoc.TTL_CocGiuCho_Gio || 72,
        TyLePhat_CocGiuCho: chinhSachCoc.TyLePhat_CocGiuCho || 100,
        ChoPhepCocAnNinh: chinhSachCoc.ChoPhepCocAnNinh === 1,
        SoTienCocAnNinhMacDinh: chinhSachCoc.SoTienCocAnNinhMacDinh || 0,
        QuyTacGiaiToa: chinhSachCoc.QuyTacGiaiToa || 'BanGiao',
        SoNgayGiaiToa: chinhSachCoc.SoNgayGiaiToa || null,
      });
    }
  }, [mode, chinhSachCoc]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error khi user sửa
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.TenChinhSach.trim()) {
      newErrors.TenChinhSach = 'Tên chính sách không được để trống';
    } else if (formData.TenChinhSach.length < 1 || formData.TenChinhSach.length > 255) {
      newErrors.TenChinhSach = 'Tên chính sách phải từ 1-255 ký tự';
    }

    if (formData.ChoPhepCocGiuCho) {
      const ttl = parseInt(formData.TTL_CocGiuCho_Gio);
      if (isNaN(ttl) || ttl < 1 || ttl > 168) {
        newErrors.TTL_CocGiuCho_Gio = 'TTL cọc giữ chỗ phải từ 1-168 giờ (tối đa 7 ngày)';
      }

      const tyLePhat = parseFloat(formData.TyLePhat_CocGiuCho);
      if (isNaN(tyLePhat) || tyLePhat < 0 || tyLePhat > 100) {
        newErrors.TyLePhat_CocGiuCho = 'Tỷ lệ phạt phải từ 0-100%';
      }

      const soTienGiuCho = parseFloat(formData.SoTienCocAnNinhMacDinh);
      if (isNaN(soTienGiuCho) || soTienGiuCho < 0) {
        newErrors.SoTienCocAnNinhMacDinh = 'Số tiền cọc giữ chỗ phải >= 0';
      }
    }

    if (!['BanGiao', 'TheoNgay', 'Khac'].includes(formData.QuyTacGiaiToa)) {
      newErrors.QuyTacGiaiToa = 'Quy tắc giải tỏa không hợp lệ';
    }

    if (formData.QuyTacGiaiToa === 'TheoNgay') {
      const soNgay = parseInt(formData.SoNgayGiaiToa);
      if (!formData.SoNgayGiaiToa || isNaN(soNgay) || soNgay < 1 || soNgay > 365) {
        newErrors.SoNgayGiaiToa = 'Số ngày giải tỏa phải từ 1-365 ngày';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data
      const parsedSoTienCocGiuCho = parseFloat(formData.SoTienCocAnNinhMacDinh);

      const submitData = {
        TenChinhSach: formData.TenChinhSach.trim(),
        MoTa: formData.MoTa.trim(),
        ChoPhepCocGiuCho: formData.ChoPhepCocGiuCho,
        TTL_CocGiuCho_Gio: parseInt(formData.TTL_CocGiuCho_Gio),
        TyLePhat_CocGiuCho: parseFloat(formData.TyLePhat_CocGiuCho),
        ChoPhepCocAnNinh: formData.ChoPhepCocAnNinh,
        SoTienCocAnNinhMacDinh: formData.ChoPhepCocGiuCho
          ? (isNaN(parsedSoTienCocGiuCho) ? null : parsedSoTienCocGiuCho)
          : null,
        QuyTacGiaiToa: formData.QuyTacGiaiToa,
        SoNgayGiaiToa: formData.QuyTacGiaiToa === 'TheoNgay' ? parseInt(formData.SoNgayGiaiToa) : null,
      };

      let response;
      if (mode === 'create') {
        response = await ChinhSachCocService.taoMoi(submitData);
      } else {
        response = await ChinhSachCocService.capNhat(chinhSachCoc.ChinhSachCocID, submitData);
      }

      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setSubmitError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi submit form:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        'Lỗi server khi xử lý yêu cầu'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-csc" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? '➕ Tạo Chính sách Cọc mới' : '✏️ Cập nhật Chính sách Cọc'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {submitError && (
            <div className="alert alert-danger">
              <HiOutlineExclamationCircle className="icon" />
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tên chính sách */}
            <div className="form-group">
              <label className="form-label required">
                Tên chính sách
              </label>
              <input
                type="text"
                name="TenChinhSach"
                className={`form-input ${errors.TenChinhSach ? 'error' : ''}`}
                value={formData.TenChinhSach}
                onChange={handleChange}
                placeholder="Ví dụ: Chính sách cọc tiêu chuẩn"
                maxLength={255}
              />
              {errors.TenChinhSach && <span className="error-text">{errors.TenChinhSach}</span>}
            </div>

            {/* Mô tả */}
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết</label>
              <textarea
                name="MoTa"
                className="form-textarea"
                value={formData.MoTa}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về chính sách cọc này..."
                rows={3}
              />
            </div>

            {/* Cọc giữ chỗ */}
            <div className="form-section">
              <div className="section-header-form">
                <HiOutlineClock className="section-icon-form" />
                <h3 className="section-title-form">Cọc giữ chỗ</h3>
              </div>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="ChoPhepCocGiuCho"
                    name="ChoPhepCocGiuCho"
                    checked={formData.ChoPhepCocGiuCho}
                    onChange={handleChange}
                  />
                  <label htmlFor="ChoPhepCocGiuCho" className="checkbox-label">
                    Cho phép cọc giữ chỗ
                  </label>
                </div>
              </div>

              {formData.ChoPhepCocGiuCho && (
                <>
                  {/* TTL cọc giữ chỗ */}
                  <div className="form-group">
                    <label className="form-label required">TTL cọc giữ chỗ (giờ)</label>
                    <input
                      type="number"
                      name="TTL_CocGiuCho_Gio"
                      className={`form-input ${errors.TTL_CocGiuCho_Gio ? 'error' : ''}`}
                      value={formData.TTL_CocGiuCho_Gio}
                      onChange={handleChange}
                      min="1"
                      max="168"
                    />
                    <span className="form-hint">1-168 giờ (tối đa 7 ngày)</span>
                    {errors.TTL_CocGiuCho_Gio && <span className="error-text">{errors.TTL_CocGiuCho_Gio}</span>}
                  </div>

                  {/* Tỷ lệ phạt */}
                  <div className="form-group">
                    <label className="form-label required">Tỷ lệ phạt (%)</label>
                    <input
                      type="number"
                      name="TyLePhat_CocGiuCho"
                      className={`form-input ${errors.TyLePhat_CocGiuCho ? 'error' : ''}`}
                      value={formData.TyLePhat_CocGiuCho}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <span className="form-hint">0-100% (số nguyên)</span>
                    {errors.TyLePhat_CocGiuCho && <span className="error-text">{errors.TyLePhat_CocGiuCho}</span>}
                  </div>

                  {/* Số tiền cọc giữ chỗ */}
                  <div className="form-group">
                    <label className="form-label">Số tiền cọc giữ chỗ mặc định (VNĐ)</label>
                    <input
                      type="number"
                      name="SoTienCocAnNinhMacDinh"
                      className={`form-input ${errors.SoTienCocAnNinhMacDinh ? 'error' : ''}`}
                      value={formData.SoTienCocAnNinhMacDinh}
                      onChange={handleChange}
                      min="0"
                      step="50000"
                      placeholder="Ví dụ: 500000"
                    />
                    {errors.SoTienCocAnNinhMacDinh && (
                      <span className="error-text">{errors.SoTienCocAnNinhMacDinh}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cọc an ninh */}
            <div className="form-section">
              <div className="section-header-form">
                <HiOutlineShieldCheck className="section-icon-form" />
                <h3 className="section-title-form">Cọc an ninh</h3>
              </div>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="ChoPhepCocAnNinh"
                    name="ChoPhepCocAnNinh"
                    checked={formData.ChoPhepCocAnNinh}
                    onChange={handleChange}
                  />
                  <label htmlFor="ChoPhepCocAnNinh" className="checkbox-label">
                    Cho phép cọc an ninh
                  </label>
                </div>
              </div>
            </div>

            {/* Quy tắc giải tỏa */}
            {/* Quy tắc giải tỏa */}
            <div className="form-section">
              <div className="section-header-form">
                <HiOutlineDocumentCheck className="section-icon-form" />
                <h3 className="section-title-form">Quy tắc giải tỏa</h3>
              </div>
              <div className="form-group">
                <label className="form-label required">Quy tắc áp dụng</label>
                <select
                  name="QuyTacGiaiToa"
                  className={`form-select ${errors.QuyTacGiaiToa ? 'error' : ''}`}
                  value={formData.QuyTacGiaiToa}
                  onChange={handleChange}
                >
                  <option value="BanGiao">Bàn giao phòng</option>
                  <option value="TheoNgay">Theo ngày</option>
                  <option value="Khac">Khác</option>
                </select>
                {errors.QuyTacGiaiToa && <span className="error-text">{errors.QuyTacGiaiToa}</span>}
              </div>

              {/* Số ngày giải tỏa (chỉ hiện khi QuyTacGiaiToa = 'TheoNgay') */}
              {formData.QuyTacGiaiToa === 'TheoNgay' && (
                <div className="form-group">
                  <label className="form-label required">Số ngày giải tỏa</label>
                  <input
                    type="number"
                    name="SoNgayGiaiToa"
                    className={`form-input ${errors.SoNgayGiaiToa ? 'error' : ''}`}
                    value={formData.SoNgayGiaiToa || ''}
                    onChange={handleChange}
                    placeholder="Ví dụ: 30 ngày"
                    min="1"
                    max="365"
                  />
                  <span className="form-hint">Số ngày tính từ khi kết thúc thuê (1-365 ngày)</span>
                  {errors.SoNgayGiaiToa && <span className="error-text">{errors.SoNgayGiaiToa}</span>}
                </div>
              )}
            </div>

          {/* Preview */}
          <div className="modal-csc__preview">
            <div className="modal-csc__preview-header">
              <h3 className="modal-csc__preview-title">Preview chính sách</h3>
              <p className="modal-csc__preview-subtitle">Thông tin sẽ hiển thị trong modal chọn chính sách</p>
            </div>
            <div className="modal-csc__preview-card">
              <div className="modal-csc__preview-name">
                {formData.TenChinhSach?.trim() || 'Chính sách chưa có tên'}
              </div>
              {formData.MoTa?.trim() && (
                <p className="modal-csc__preview-description">{formData.MoTa.trim()}</p>
              )}

              <div className="modal-csc__preview-section">
                <div className="modal-csc__preview-row">
                  <span className="modal-csc__preview-label">Cọc giữ chỗ</span>
                  <span
                    className={`modal-csc__badge ${
                      formData.ChoPhepCocGiuCho ? 'modal-csc__badge--success' : 'modal-csc__badge--muted'
                    }`}
                  >
                    {formData.ChoPhepCocGiuCho ? 'Cho phép' : 'Không áp dụng'}
                  </span>
                </div>
                {formData.ChoPhepCocGiuCho && (
                  <>
                    <div className="modal-csc__preview-row">
                      <span className="modal-csc__preview-label">
                        <HiOutlineClock className="modal-csc__preview-icon" />
                        TTL giữ chỗ
                      </span>
                      <span className="modal-csc__preview-value">{formData.TTL_CocGiuCho_Gio} giờ</span>
                    </div>
                    <div className="modal-csc__preview-row">
                      <span className="modal-csc__preview-label">
                        <HiOutlineExclamationCircle className="modal-csc__preview-icon" />
                        Tỷ lệ phạt
                      </span>
                      <span className="modal-csc__preview-value">{formData.TyLePhat_CocGiuCho}%</span>
                    </div>
                    <div className="modal-csc__preview-row">
                      <span className="modal-csc__preview-label">
                        <HiOutlineCurrencyDollar className="modal-csc__preview-icon" />
                        Số tiền giữ chỗ
                      </span>
                      <span className="modal-csc__preview-value">
                        {formatCurrency(formData.SoTienCocAnNinhMacDinh)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-csc__preview-section">
                <div className="modal-csc__preview-row">
                  <span className="modal-csc__preview-label">Cọc an ninh</span>
                  <span
                    className={`modal-csc__badge ${
                      formData.ChoPhepCocAnNinh ? 'modal-csc__badge--success' : 'modal-csc__badge--muted'
                    }`}
                  >
                    {formData.ChoPhepCocAnNinh ? 'Cho phép' : 'Không áp dụng'}
                  </span>
                </div>
              </div>

              <div className="modal-csc__preview-section">
                <div className="modal-csc__preview-row">
                  <span className="modal-csc__preview-label">
                    <HiOutlineDocumentCheck className="modal-csc__preview-icon" />
                    Quy tắc giải tỏa
                  </span>
                  <span className="modal-csc__preview-value">{getQuyTacLabel(formData.QuyTacGiaiToa)}</span>
                </div>
                {formData.QuyTacGiaiToa === 'TheoNgay' && (
                  <div className="modal-csc__preview-row">
                    <span className="modal-csc__preview-label">
                      <HiOutlineCalendarDays className="modal-csc__preview-icon" />
                      Số ngày giải tỏa
                    </span>
                    <span className="modal-csc__preview-value">
                      {formData.SoNgayGiaiToa ? `${formData.SoNgayGiaiToa} ngày` : 'Chưa thiết lập'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  '⏳ Đang xử lý...'
                ) : mode === 'create' ? (
                  <>
                    <HiOutlineCheckCircle className="icon" />
                    Tạo mới
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="icon" />
                    Cập nhật
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

export default ModalQuanLyChinhSachCoc;
