/**
 * @fileoverview Modal báo cáo hợp đồng đã ký
 * @component ModalBaoCaoHopDong
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCloudArrowUp
} from 'react-icons/hi2';
import { baoCaoHopDong, uploadFileScanHopDong } from '../../services/HopDongService';
import './ModalBaoCaoHopDong.css';

/**
 * Modal báo cáo hợp đồng
 * @param {Object} props
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Object} props.phongInfo - {PhongID, TenPhong, TinDangID, CocInfo}
 * @param {Function} props.onSuccess - Callback sau khi báo cáo thành công
 */
export default function ModalBaoCaoHopDong({ show, onClose, phongInfo, onSuccess }) {
  const [formData, setFormData] = useState({
    KhachHangID: '',
    NgayBatDau: '',
    NgayKetThuc: '',
    GiaThueCuoiCung: '',
    DoiTruCocVaoTienThue: false,
    NoiDungSnapshot: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fileScan, setFileScan] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  // Reset form khi modal mở
  useEffect(() => {
    if (show && phongInfo) {
      setFormData({
        KhachHangID: '',
        NgayBatDau: '',
        NgayKetThuc: '',
        GiaThueCuoiCung: phongInfo.GiaPhong || '',
        DoiTruCocVaoTienThue: false,
        NoiDungSnapshot: ''
      });
      setError('');
    }
  }, [show, phongInfo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file PDF, JPG, hoặc PNG');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 10MB');
      return;
    }

    setFileScan(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.KhachHangID || !formData.NgayBatDau || !formData.NgayKetThuc || !formData.GiaThueCuoiCung) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (new Date(formData.NgayKetThuc) <= new Date(formData.NgayBatDau)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      setSubmitting(true);

      const result = await baoCaoHopDong({
        ...formData,
        TinDangID: phongInfo.TinDangID,
        PhongID: phongInfo.PhongID
      });

      if (result.success) {
        const hopDongId = result.data.HopDongID;

        // Upload file scan nếu có
        if (fileScan) {
          setUploadProgress('Đang upload file scan...');
          try {
            await uploadFileScanHopDong(hopDongId, fileScan);
            setUploadProgress('Upload file scan thành công!');
          } catch (uploadErr) {
            console.error('Lỗi upload file:', uploadErr);
            setUploadProgress('Cảnh báo: Báo cáo thành công nhưng upload file thất bại');
          }
        }

        alert('✅ Báo cáo hợp đồng thành công!');
        if (onSuccess) onSuccess();
        onClose(true); // true = refresh data
      }

    } catch (err) {
      console.error('Lỗi báo cáo hợp đồng:', err);
      setError(err.response?.data?.message || 'Lỗi khi báo cáo hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="mbchd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mbchd-header">
          <div className="mbchd-header-left">
            <HiOutlineDocumentText className="mbchd-header-icon" />
            <div>
              <h2>Báo cáo Hợp đồng</h2>
              <p className="mbchd-subtitle">Phòng: {phongInfo?.TenPhong || 'N/A'}</p>
            </div>
          </div>
          <button className="mbchd-close-btn" onClick={() => onClose()}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Content */}
        <form className="mbchd-content" onSubmit={handleSubmit}>
          {error && (
            <div className="mbchd-error">
              <HiOutlineExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Thông tin Cọc hiện tại */}
          {phongInfo?.CocInfo && (
            <div className="mbchd-info-box">
              <h3>
                <HiOutlineCheckCircle />
                Thông tin Cọc hiện tại
              </h3>
              <div className="mbchd-info-grid">
                <div className="mbchd-info-item">
                  <span className="label">Loại cọc:</span>
                  <span className="value">{phongInfo.CocInfo.Loai}</span>
                </div>
                <div className="mbchd-info-item">
                  <span className="label">Số tiền:</span>
                  <span className="value success">
                    {phongInfo.CocInfo.SoTien?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="mbchd-form-group">
            <label>
              <HiOutlineCheckCircle />
              Khách hàng ID <span className="required">*</span>
            </label>
            <input
              type="number"
              name="KhachHangID"
              value={formData.KhachHangID}
              onChange={handleChange}
              placeholder="Nhập ID khách hàng"
              required
            />
            <small className="help-text">ID khách hàng đã đặt cọc phòng này</small>
          </div>

          <div className="mbchd-form-row">
            <div className="mbchd-form-group">
              <label>
                <HiOutlineCalendar />
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="NgayBatDau"
                value={formData.NgayBatDau}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mbchd-form-group">
              <label>
                <HiOutlineCalendar />
                Ngày kết thúc <span className="required">*</span>
              </label>
              <input
                type="date"
                name="NgayKetThuc"
                value={formData.NgayKetThuc}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mbchd-form-group">
            <label>
              <HiOutlineCurrencyDollar />
              Giá thuê cuối cùng <span className="required">*</span>
            </label>
            <input
              type="number"
              name="GiaThueCuoiCung"
              value={formData.GiaThueCuoiCung}
              onChange={handleChange}
              placeholder="Nhập giá thuê (VNĐ)"
              min="0"
              step="1000"
              required
            />
            <small className="help-text">Giá thuê thực tế đã thỏa thuận với khách</small>
          </div>

          <div className="mbchd-form-group">
            <label className="mbchd-checkbox-label">
              <input
                type="checkbox"
                name="DoiTruCocVaoTienThue"
                checked={formData.DoiTruCocVaoTienThue}
                onChange={handleChange}
              />
              <span>Đối trừ cọc vào tiền thuê tháng đầu</span>
            </label>
            <p className="mbchd-help-text">
              {formData.DoiTruCocVaoTienThue 
                ? '✓ Cọc sẽ được đối trừ, khách không nhận lại tiền cọc'
                : 'Cọc sẽ được giải tỏa và hoàn lại khách hàng'
              }
            </p>
          </div>

          <div className="mbchd-form-group">
            <label>Ghi chú (tùy chọn)</label>
            <textarea
              name="NoiDungSnapshot"
              value={formData.NoiDungSnapshot}
              onChange={handleChange}
              placeholder="Ghi chú thêm về hợp đồng..."
              rows={3}
            />
          </div>

          {/* Upload file scan */}
          <div className="mbchd-form-group">
            <label>
              <HiOutlineCloudArrowUp />
              Upload hợp đồng scan (PDF/Image)
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input-hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="file-upload-label">
                <HiOutlineCloudArrowUp className="upload-icon" />
                <span>{fileScan ? fileScan.name : 'Chọn file (PDF, JPG, PNG)'}</span>
              </label>
              {fileScan && (
                <div className="file-info">
                  <span className="file-size">
                    {(fileScan.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    type="button"
                    className="btn-remove-file"
                    onClick={() => {
                      setFileScan(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <HiOutlineXMark />
                  </button>
                </div>
              )}
            </div>
            <small className="help-text">Tùy chọn: Upload bản scan hợp đồng đã ký (tối đa 10MB)</small>
            {uploadProgress && (
              <div className="upload-progress">{uploadProgress}</div>
            )}
          </div>

          {/* Actions */}
          <div className="mbchd-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose()}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
