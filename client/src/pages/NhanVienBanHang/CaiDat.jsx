/**
 * Cài đặt - Hồ sơ Nhân viên Bán hàng
 * Hiển thị dữ liệu từ bảng hosonhanvien theo thue_tro.sql và cho phép cập nhật ghi chú
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoadingSkeleton from '../../components/NhanVienBanHang/LoadingSkeleton';
import ErrorBanner from '../../components/NhanVienBanHang/ErrorBanner';
import { layHoSo, capNhatHoSo } from '../../api/nhanVienBanHangApi';
import '../../styles/NhanVienBanHangDesignSystem.css';
import './CaiDat.css';

const statusTokens = {
  DangLamViec: {
    label: 'Đang làm việc',
    tone: 'success',
    description: 'Được phép nhận lịch và giao dịch'
  },
  TamNgung: {
    label: 'Tạm ngưng',
    tone: 'warning',
    description: 'Liên hệ Điều hành để mở lại ca làm việc'
  },
  DaNghiViec: {
    label: 'Đã nghỉ việc',
    tone: 'danger',
    description: 'Tài khoản ở chế độ chỉ đọc'
  },
  default: {
    label: 'Không xác định',
    tone: 'neutral',
    description: 'Dữ liệu chưa được cập nhật trong hosonhanvien'
  }
};

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatPercent = (value) => {
  if (value === null || value === undefined) {
    return '0%';
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '0%';
  }
  return `${number.toFixed(number % 1 === 0 ? 0 : 2)}%`;
};

const parseCoverage = (coverageRaw) => {
  if (!coverageRaw) {
    return [];
  }

  try {
    const parsedValue = typeof coverageRaw === 'string'
      ? JSON.parse(coverageRaw)
      : coverageRaw;

    if (Array.isArray(parsedValue)) {
      return parsedValue
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          if (typeof item === 'number') {
            return `Khu vực #${item}`;
          }

          if (item?.TenKhuVuc) {
            return item.TenKhuVuc;
          }

          if (item?.name) {
            return item.name;
          }

          if (item?.label) {
            return item.label;
          }

          if (item?.KhuVucID && item?.TenKhuVuc) {
            return item.TenKhuVuc;
          }

          return JSON.stringify(item);
        })
        .filter(Boolean);
    }

    if (typeof parsedValue === 'object') {
      return Object.values(parsedValue)
        .map((value) => {
          if (typeof value === 'string') return value;
          if (typeof value === 'number') return `Khu vực #${value}`;
          if (value?.TenKhuVuc) return value.TenKhuVuc;
          return JSON.stringify(value);
        })
        .filter(Boolean);
    }

    if (typeof parsedValue === 'string') {
      return parsedValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  } catch {
    return coverageRaw
      .toString()
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const InfoField = ({ label, value, hint, action }) => (
  <div className="nvbh-settings-field">
    <div className="nvbh-settings-field__meta">
      <p className="nvbh-settings-field__label">{label}</p>
      {hint && <p className="nvbh-settings-field__hint">{hint}</p>}
    </div>
    <div className="nvbh-settings-field__value-wrapper">
      <p className="nvbh-settings-field__value">{value || '—'}</p>
      {action && <div className="nvbh-settings-field__action">{action}</div>}
    </div>
  </div>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const NotebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19" />
    <path d="M20 2H6.5A2.5 2.5 0 0 0 4 4.5v15" />
    <path d="M8 2v4" />
    <path d="M12 2v4" />
    <path d="M16 2v4" />
    <path d="M4 8h16" />
  </svg>
);

const CaiDatNVBH = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [ghiChu, setGhiChu] = useState('');
  const [copied, setCopied] = useState(false);

  const coverageList = useMemo(
    () => parseCoverage(profile?.KhuVucPhuTrach),
    [profile?.KhuVucPhuTrach]
  );

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await layHoSo();

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể tải hồ sơ');
      }

      setProfile(response.data);
      setGhiChu(response.data?.GhiChu || '');
    } catch (error) {
      setLoadError(error?.message || 'Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!profile?.MaNhanVien) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(profile.MaNhanVien);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = profile.MaNhanVien;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setFormMessage({
        type: 'error',
        text: error?.message || 'Không thể sao chép mã nhân viên'
      });
    }
  };

  const handleSaveNotes = async () => {
    setFormMessage({ type: '', text: '' });

    try {
      setSaving(true);
      const response = await capNhatHoSo({ ghiChu: ghiChu?.trim() || null });

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể cập nhật hồ sơ');
      }

      setProfile((prev) => ({
        ...prev,
        GhiChu: ghiChu?.trim() || null
      }));

      setFormMessage({
        type: 'success',
        text: 'Đã lưu ghi chú cá nhân vào bảng hosonhanvien'
      });
    } catch (error) {
      setFormMessage({
        type: 'error',
        text: error?.message || 'Không thể cập nhật hồ sơ'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetNotes = () => {
    setGhiChu(profile?.GhiChu || '');
    setFormMessage({ type: '', text: '' });
  };

  const statusInfo = profile
    ? statusTokens[profile.TrangThaiLamViec] || statusTokens.default
    : statusTokens.default;

  const hasContractEnd = Boolean(profile?.NgayKetThuc);

  if (loading) {
    return (
      <div className="nvbh-settings">
        <div className="nvbh-settings__loading">
          <LoadingSkeleton type="card" count={3} />
          <p className="nvbh-settings__loading-text">Đang tải hồ sơ từ hosonhanvien...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="nvbh-settings">
        <ErrorBanner
          message={loadError}
          onRetry={fetchProfile}
          dismissible={false}
        />
      </div>
    );
  }

  return (
    <div className="nvbh-settings">
      <section className="nvbh-settings__header-card">
        <div className="nvbh-settings__header-info">
          <div className="nvbh-settings__avatar" aria-hidden="true">
            {profile?.TenDayDu?.charAt(0)?.toUpperCase() || 'N'}
          </div>
          <div>
            <p className="nvbh-settings__eyebrow">Hồ sơ nhân viên bán hàng</p>
            <h1 className="nvbh-settings__title">{profile?.TenDayDu || 'Nhân viên'}</h1>
            <p className="nvbh-settings__subtitle">{profile?.Email || '—'}</p>
            <div className="nvbh-settings__badges">
              <span className={`nvbh-settings__badge nvbh-settings__badge--${statusInfo.tone}`}>
                {statusInfo.label}
              </span>
              <span className="nvbh-settings__badge nvbh-settings__badge--outline">
                Vai trò: Nhân viên Bán hàng
              </span>
            </div>
            <p className="nvbh-settings__status-description">{statusInfo.description}</p>
          </div>
        </div>
        <div className="nvbh-settings__header-stats">
          <div className="nvbh-settings-stat">
            <ShieldIcon />
            <p className="nvbh-settings-stat__label">Tỷ lệ hoa hồng</p>
            <p className="nvbh-settings-stat__value">{formatPercent(profile?.TyLeHoaHong)}</p>
            <p className="nvbh-settings-stat__hint">Nguồn: hosonhanvien.TyLeHoaHong</p>
          </div>
          <div className="nvbh-settings-stat">
            <NotebookIcon />
            <p className="nvbh-settings-stat__label">Ngày bắt đầu</p>
            <p className="nvbh-settings-stat__value">{formatDate(profile?.NgayBatDau)}</p>
            <p className="nvbh-settings-stat__hint">
              {hasContractEnd
                ? `Kết thúc: ${formatDate(profile.NgayKetThuc)}`
                : 'Chưa thiết lập ngày kết thúc'}
            </p>
          </div>
        </div>
      </section>

      {hasContractEnd && (
        <div className="nvbh-settings__alert">
          <div className="nvbh-settings__alert-icon">
            <MapPinIcon />
          </div>
          <div className="nvbh-settings__alert-content">
            <p className="nvbh-settings__alert-title">Hợp đồng đã có ngày kết thúc</p>
            <p className="nvbh-settings__alert-text">
              Hãy liên hệ Điều hành nếu bạn vẫn tiếp tục làm việc sau ngày&nbsp;
              {formatDate(profile.NgayKetThuc)} để tránh bị thu hồi phân quyền.
            </p>
          </div>
        </div>
      )}

      <div className="nvbh-settings__grid">
        <section className="nvbh-settings-card">
          <div className="nvbh-settings-card__header">
            <div>
              <p className="nvbh-settings-card__eyebrow">Nguồn: bảng nguoidung</p>
              <h2 className="nvbh-settings-card__title">Thông tin cá nhân</h2>
            </div>
          </div>
          <div className="nvbh-settings-card__body">
            <InfoField label="Họ và tên" value={profile?.TenDayDu} hint="nguoidung.TenDayDu" />
            <InfoField label="Email" value={profile?.Email} hint="nguoidung.Email" />
            <InfoField label="Số điện thoại" value={profile?.SoDienThoai || 'Chưa cập nhật'} hint="nguoidung.SoDienThoai" />
          </div>
        </section>

        <section className="nvbh-settings-card">
          <div className="nvbh-settings-card__header">
            <div>
              <p className="nvbh-settings-card__eyebrow">Nguồn: bảng hosonhanvien</p>
              <h2 className="nvbh-settings-card__title">Thông tin công việc</h2>
            </div>
          </div>
          <div className="nvbh-settings-card__body">
            <InfoField
              label="Mã nhân viên"
              value={profile?.MaNhanVien}
              hint={`HoSoID #${profile?.HoSoID || '—'}`}
              action={(
                <button
                  type="button"
                  className="nvbh-settings__ghost-button"
                  onClick={handleCopyCode}
                  disabled={!profile?.MaNhanVien}
                >
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              )}
            />
            <InfoField
              label="Trang thái làm việc"
              value={statusInfo.label}
              hint={`hosonhanvien.TrangThaiLamViec: ${profile?.TrangThaiLamViec || '—'}`}
            />
            <InfoField
              label="Khu vực chính"
              value={profile?.TenKhuVucChinh || `Khu vực #${profile?.KhuVucChinhID || '—'}`}
              hint="hosonhanvien.KhuVucChinhID"
            />
          </div>
        </section>

        <section className="nvbh-settings-card">
          <div className="nvbh-settings-card__header">
            <div>
              <p className="nvbh-settings-card__eyebrow">Nguồn: hosonhanvien.KhuVucPhuTrach</p>
              <h2 className="nvbh-settings-card__title">Phạm vi phụ trách</h2>
            </div>
          </div>
          <div className="nvbh-settings-card__body">
            {coverageList.length > 0 ? (
              <div className="nvbh-settings-chips">
                {coverageList.map((item) => (
                  <span key={item} className="nvbh-settings-chips__item">
                    <MapPinIcon />
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="nvbh-settings-empty">
                <p>Chưa có khu vực phụ trách.</p>
                <p className="nvbh-settings-empty__caption">Liên hệ Điều hành để cập nhật trường KhuVucPhuTrach.</p>
              </div>
            )}
          </div>
        </section>

        <section className="nvbh-settings-card nvbh-settings-card--wide">
          <div className="nvbh-settings-card__header">
            <div>
              <p className="nvbh-settings-card__eyebrow">Ghi chú nội bộ</p>
              <h2 className="nvbh-settings-card__title">Ghi chú cá nhân</h2>
              <p className="nvbh-settings-card__description">
                Trường duy nhất mà bạn có thể chỉnh sửa. Thông tin được lưu vào cột GhiChu của bảng hosonhanvien.
              </p>
            </div>
          </div>
          <div className="nvbh-settings-card__body">
            <label className="nvbh-settings-textarea__label" htmlFor="ghiChu">
              Ghi chú hỗ trợ Điều hành
            </label>
            <textarea
              id="ghiChu"
              className="nvbh-settings-textarea"
              rows={5}
              value={ghiChu}
              onChange={(event) => setGhiChu(event.target.value)}
              maxLength={2000}
              placeholder="Ví dụ: Ưu tiên lịch sáng, chuyên khu vực TP.HCM..."
            />
            <div className="nvbh-settings__actions">
              <button
                type="button"
                className="nvbh-btn nvbh-btn--secondary"
                onClick={resetNotes}
                disabled={saving || ghiChu === (profile?.GhiChu || '')}
              >
                Hoàn tác
              </button>
              <button
                type="button"
                className="nvbh-btn nvbh-btn--primary"
                onClick={handleSaveNotes}
                disabled={saving || ghiChu === (profile?.GhiChu || '')}
              >
                {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>

            {formMessage.text && (
              <div
                className={`nvbh-settings-message nvbh-settings-message--${formMessage.type}`}
                role="status"
              >
                {formMessage.text}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CaiDatNVBH;

