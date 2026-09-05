import React, { useEffect, useState } from 'react';
import { HiOutlineXMark, HiOutlineKey, HiOutlineCheckCircle } from 'react-icons/hi2';
import './DetailModal.css';
import { DuAnService } from '../../services/ChuDuAnService';

function ModalPhuongThucVao({ isOpen, project, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    YeuCauPheDuyetChu: false,
    PhuongThucVao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !project) {
      setFormData({ YeuCauPheDuyetChu: false, PhuongThucVao: '' });
      setError('');
      return;
    }

    setFormData({
      YeuCauPheDuyetChu: Number(project.YeuCauPheDuyetChu) === 1,
      PhuongThucVao: project.PhuongThucVao || ''
    });
    setError('');
  }, [isOpen, project]);

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('detail-modal-overlay')) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!project) return;

    if (!formData.YeuCauPheDuyetChu && formData.PhuongThucVao.trim().length === 0) {
      setError('Vui lòng nhập hướng dẫn vào dự án khi không bật phê duyệt chủ dự án.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        YeuCauPheDuyetChu: formData.YeuCauPheDuyetChu ? 1 : 0,
        PhuongThucVao: formData.YeuCauPheDuyetChu ? null : formData.PhuongThucVao.trim()
      };
      const response = await DuAnService.capNhat(project.DuAnID, payload);
      const updated = response?.data || response;
      onSaved?.(updated || payload);
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật phương thức vào dự án');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div>
            <h2>Phương thức vào dự án</h2>
            <p>{project?.TenDuAn ? `Dự án: ${project.TenDuAn}` : 'Cấu hình xác thực vào dự án'}</p>
          </div>
          <button type="button" className="detail-modal-close" onClick={onClose} aria-label="Đóng">
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <form className="detail-modal-body" onSubmit={handleSubmit}>
          <div className="detail-modal-notice" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <HiOutlineCheckCircle size={18} style={{ color: '#0f766e', marginTop: 2 }} />
            <div>
              Khi bật phê duyệt chủ dự án, mọi cuộc hẹn sẽ chờ bạn xác nhận. Nếu tắt, hãy cung cấp hướng dẫn cụ thể
              (mật khẩu cửa, vị trí chìa khóa, v.v.) để chuyên viên và khách hàng truy cập.
            </div>
          </div>

          {error && <div className="detail-modal-error">{error}</div>}

          <div className="detail-modal-field">
            <label>
              <input
                type="checkbox"
                checked={formData.YeuCauPheDuyetChu}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, YeuCauPheDuyetChu: e.target.checked }))
                }
              />
              <span style={{ marginLeft: 8, fontWeight: 600 }}>Chủ dự án duyệt cuộc hẹn</span>
            </label>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 6 }}>
              Khi bật tùy chọn này, bạn có thể bỏ trống phương thức vào. Nếu tắt, hãy đảm bảo chỉ dẫn rõ ràng cho
              nhân viên.
            </div>
          </div>

  <div className="detail-modal-field">
            <label htmlFor="PhuongThucVao">
              Hướng dẫn vào dự án {!formData.YeuCauPheDuyetChu && <span className="label-required">*</span>}
            </label>
            <textarea
              id="PhuongThucVao"
              value={formData.PhuongThucVao}
              onChange={(e) => setFormData((prev) => ({ ...prev, PhuongThucVao: e.target.value }))}
              disabled={formData.YeuCauPheDuyetChu}
              placeholder={
                formData.YeuCauPheDuyetChu
                  ? 'Không cần nhập vì đã bật phê duyệt chủ dự án.'
                  : 'Ví dụ: Mật khẩu cổng 2468, khóa trong hộp số 3 bên trái.'
              }
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: '#4b5563', display: 'flex', gap: 8 }}>
            <HiOutlineKey />
            <span>
              Nội dung này sẽ hiển thị cho nhân viên được phân công. Hạn chế thông tin nhạy cảm nếu không bật phê duyệt.
            </span>
          </div>

          <div className="detail-modal-footer">
            <button type="button" className="detail-modal-btn secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="detail-modal-btn primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalPhuongThucVao;
