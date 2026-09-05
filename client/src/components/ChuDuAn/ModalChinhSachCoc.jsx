import React, { useEffect, useMemo, useState } from 'react';
import { HiOutlineXMark, HiOutlineShieldCheck } from 'react-icons/hi2';
import { DuAnService, Utils } from '../../services/ChuDuAnService';
import './DetailModal.css';

const QUY_TAC_OPTIONS = [
  { value: 'BanGiao', label: 'Giải tỏa khi bàn giao' },
  { value: 'TheoNgay', label: 'Giải tỏa theo ngày' },
  { value: 'Khac', label: 'Quy tắc khác' }
];

const DEFAULT_FORM = {
  TenChinhSach: '',
  MoTa: '',
  ChoPhepCocGiuCho: true,
  TTL_CocGiuCho_Gio: '',
  TyLePhat_CocGiuCho: '',
  ChoPhepCocAnNinh: true,
  QuyTacGiaiToa: 'BanGiao',
  HieuLuc: true
};

function ModalChinhSachCoc({ isOpen, projectName, policy, onClose, onSaved }) {
  const policyId = policy?.ChinhSachCocID;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [info, setInfo] = useState(null);

  const isDefaultPolicy = useMemo(() => policyId === 1, [policyId]);

  useEffect(() => {
    if (!isOpen || !policyId) {
      setFormData(DEFAULT_FORM);
      setInfo(null);
      setError('');
      return;
    }

    setFetching(true);
    setError('');

    DuAnService.layChiTietChinhSachCoc(policyId)
      .then((response) => {
        const data = response?.data || response;
        if (!data) return;
        setInfo(data);
        setFormData({
          TenChinhSach: data.TenChinhSach || '',
          MoTa: data.MoTa || '',
          ChoPhepCocGiuCho: data.ChoPhepCocGiuCho ?? true,
          TTL_CocGiuCho_Gio:
            data.TTL_CocGiuCho_Gio === null || data.TTL_CocGiuCho_Gio === undefined
              ? ''
              : data.TTL_CocGiuCho_Gio,
          TyLePhat_CocGiuCho:
            data.TyLePhat_CocGiuCho === null || data.TyLePhat_CocGiuCho === undefined
              ? ''
              : data.TyLePhat_CocGiuCho,
          ChoPhepCocAnNinh: data.ChoPhepCocAnNinh ?? true,
          QuyTacGiaiToa: data.QuyTacGiaiToa || 'BanGiao',
          HieuLuc: data.HieuLuc ?? true
        });
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tải thông tin chính sách');
      })
      .finally(() => setFetching(false));
  }, [isOpen, policyId]);

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('detail-modal-overlay')) {
      onClose?.();
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!policyId) return;

    const payload = {
      TenChinhSach: formData.TenChinhSach.trim(),
      MoTa: formData.MoTa.trim(),
      ChoPhepCocGiuCho: formData.ChoPhepCocGiuCho,
      TTL_CocGiuCho_Gio:
        formData.TTL_CocGiuCho_Gio === '' ? null : Number(formData.TTL_CocGiuCho_Gio),
      TyLePhat_CocGiuCho:
        formData.TyLePhat_CocGiuCho === '' ? null : Number(formData.TyLePhat_CocGiuCho),
      ChoPhepCocAnNinh: formData.ChoPhepCocAnNinh,
      QuyTacGiaiToa: formData.QuyTacGiaiToa || null,
      HieuLuc: formData.HieuLuc
    };

    if (!payload.TenChinhSach) {
      setError('Vui lòng nhập tên chính sách');
      return;
    }

    if (
      payload.TTL_CocGiuCho_Gio !== null &&
      (Number.isNaN(payload.TTL_CocGiuCho_Gio) || payload.TTL_CocGiuCho_Gio < 0)
    ) {
      setError('TTL giữ chỗ phải là số không âm');
      return;
    }

    if (
      payload.TyLePhat_CocGiuCho !== null &&
      (Number.isNaN(payload.TyLePhat_CocGiuCho) ||
        payload.TyLePhat_CocGiuCho < 0 ||
        payload.TyLePhat_CocGiuCho > 100)
    ) {
      setError('Tỷ lệ phạt giữ chỗ phải nằm trong khoảng 0-100%');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await DuAnService.capNhatChinhSachCoc(policyId, payload);
      const updated = response?.data || response;
      onSaved?.(updated);
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật chính sách');
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
            <h2>Chính sách cọc</h2>
            <p>
              {projectName ? `Dự án: ${projectName}` : 'Tùy chỉnh chính sách giữ chỗ & cọc an ninh'}
            </p>
          </div>
          <button type="button" className="detail-modal-close" onClick={onClose} aria-label="Đóng">
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <form className="detail-modal-body" onSubmit={handleSubmit}>
          {isDefaultPolicy && (
            <div className="detail-modal-notice">
              Đây là chính sách mặc định của hệ thống. Việc chỉnh sửa sẽ áp dụng cho tất cả tin đăng thuộc dự án
              đang sử dụng chính sách này.
            </div>
          )}

          {info && (
            <div className="detail-modal-chip" title="Số tin đăng áp dụng chính sách này">
              <HiOutlineShieldCheck />
              {info.SoTinDangLienKet} tin đăng đang sử dụng
            </div>
          )}

          {error && <div className="detail-modal-error">{error}</div>}

          <div className="detail-modal-grid">
            <div className="detail-modal-field">
              <label htmlFor="TenChinhSach">Tên chính sách</label>
              <input
                id="TenChinhSach"
                name="TenChinhSach"
                value={formData.TenChinhSach}
                onChange={handleChange}
                disabled={fetching}
              />
            </div>

            <div className="detail-modal-field">
              <label htmlFor="QuyTacGiaiToa">Quy tắc giải tỏa</label>
              <select
                id="QuyTacGiaiToa"
                name="QuyTacGiaiToa"
                value={formData.QuyTacGiaiToa || ''}
                onChange={handleChange}
                disabled={fetching}
              >
                <option value="">-- Chọn quy tắc --</option>
                {QUY_TAC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="detail-modal-field">
              <label htmlFor="TTL_CocGiuCho_Gio">TTL giữ chỗ (giờ)</label>
              <input
                id="TTL_CocGiuCho_Gio"
                name="TTL_CocGiuCho_Gio"
                type="number"
                min={0}
                step={1}
                value={formData.TTL_CocGiuCho_Gio}
                onChange={handleChange}
                disabled={fetching || formData.ChoPhepCocGiuCho === false}
                placeholder="Ví dụ: 48"
              />
            </div>

            <div className="detail-modal-field">
              <label htmlFor="TyLePhat_CocGiuCho">Tỷ lệ phạt giữ chỗ (%)</label>
              <input
                id="TyLePhat_CocGiuCho"
                name="TyLePhat_CocGiuCho"
                type="number"
                min={0}
                max={100}
                step={1}
                value={formData.TyLePhat_CocGiuCho}
                onChange={handleChange}
                disabled={fetching}
                placeholder="Ví dụ: 10"
              />
            </div>

          <div className="detail-modal-field">
            <label htmlFor="HieuLuc">Trạng thái</label>
            <select
              id="HieuLuc"
              name="HieuLuc"
              value={formData.HieuLuc ? '1' : '0'}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  HieuLuc: e.target.value === '1'
                }))
              }
              disabled={fetching}
            >
              <option value="1">Đang hiệu lực</option>
              <option value="0">Ngưng sử dụng</option>
            </select>
          </div>
          </div>

          <div className="detail-modal-field">
            <label htmlFor="MoTa">Ghi chú / mô tả</label>
            <textarea
              id="MoTa"
              name="MoTa"
              value={formData.MoTa}
              onChange={handleChange}
              disabled={fetching}
              placeholder="Ghi chú nội bộ về cách áp dụng chính sách"
            />
          </div>

          <div className="detail-modal-field">
            <label>
              <input
                type="checkbox"
                name="ChoPhepCocGiuCho"
                checked={formData.ChoPhepCocGiuCho}
                onChange={handleChange}
                disabled={fetching}
              />
              <span style={{ marginLeft: 8 }}>Cho phép cọc giữ chỗ</span>
            </label>
            <label>
              <input
                type="checkbox"
                name="ChoPhepCocAnNinh"
                checked={formData.ChoPhepCocAnNinh}
                onChange={handleChange}
                disabled={fetching}
              />
              <span style={{ marginLeft: 8 }}>Cho phép cọc an ninh</span>
            </label>
          </div>

          <div className="detail-modal-footer">
            <button
              type="button"
              className="detail-modal-btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="detail-modal-btn primary" disabled={loading || fetching}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

          {info && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
              Cập nhật lần cuối: {info.CapNhatLuc ? Utils.formatDateTime(info.CapNhatLuc) : '—'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ModalChinhSachCoc;
