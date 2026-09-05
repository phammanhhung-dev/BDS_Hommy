import { useCallback, useEffect, useMemo, useState } from 'react';
import { duAnOperatorApi } from '../../api/operatorApi';
import './QuanLyDuAnAdmin.css';

const STATUS_OPTIONS = [
  { value: 'HoatDong', label: 'Hoạt động' },
  { value: 'LuuTru', label: 'Tạm ngưng' },
  { value: 'NgungHoatDong', label: 'Ngưng hoạt động' }
];

const statusLabelMap = {
  HoatDong: 'Hoạt động',
  LuuTru: 'Tạm ngưng',
  NgungHoatDong: 'Ngưng hoạt động'
};

const defaultFilters = {
  keyword: '',
  trangThai: '',
  page: 1,
  limit: 10
};

const createHoaHongRow = (row = {}) => ({
  soThang: row.soThang ?? '',
  tyLe: row.tyLe ?? ''
});

const createEmptyForm = () => ({
  tenDuAn: '',
  chuDuAnId: '',
  diaChi: '',
  trangThai: 'HoatDong',
  yeuCauPheDuyetChu: false,
  phuongThucVao: '',
  viDo: '',
  kinhDo: '',
  soThangCocToiThieu: '',
  bangHoaHongList: [createHoaHongRow()],
  lyDoNgungHoatDong: ''
});

const formatNumberInput = (value) => (value === null || value === undefined ? '' : value);

const buildPayload = (form) => {
  const toNullableNumber = (raw) => {
    if (raw === '' || raw === null || raw === undefined) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const hoaHongPayload = Array.isArray(form.bangHoaHongList)
    ? form.bangHoaHongList
        .map((item) => ({
          soThang: Number(item.soThang),
          tyLe: Number(item.tyLe)
        }))
        .filter(
          (item) => !Number.isNaN(item.soThang) && item.soThang > 0 && !Number.isNaN(item.tyLe)
        )
    : [];

  return {
    TenDuAn: form.tenDuAn.trim(),
    DiaChi: form.diaChi.trim(),
    ChuDuAnID: Number(form.chuDuAnId),
    TrangThai: form.trangThai,
    YeuCauPheDuyetChu: form.yeuCauPheDuyetChu,
    PhuongThucVao: form.phuongThucVao.trim() || null,
    ViDo: toNullableNumber(form.viDo),
    KinhDo: toNullableNumber(form.kinhDo),
    SoThangCocToiThieu: toNullableNumber(form.soThangCocToiThieu),
    BangHoaHong: hoaHongPayload.length ? JSON.stringify(hoaHongPayload) : null,
    LyDoNgungHoatDong: form.lyDoNgungHoatDong.trim() || null
  };
};

const parseHoaHong = (raw) => {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapRowToForm = (row) => {
  const parsedHoaHong = parseHoaHong(row.BangHoaHong).map((item) =>
    createHoaHongRow({
      soThang: item.soThang !== undefined && item.soThang !== null ? String(item.soThang) : '',
      tyLe: item.tyLe !== undefined && item.tyLe !== null ? String(item.tyLe) : ''
    })
  );

  return {
    tenDuAn: row.TenDuAn || '',
    chuDuAnId: row.ChuDuAnID?.toString() || '',
    diaChi: row.DiaChi || '',
    trangThai: row.TrangThai || 'HoatDong',
    yeuCauPheDuyetChu: row.YeuCauPheDuyetChu === 1,
    phuongThucVao: row.PhuongThucVao || '',
    viDo: formatNumberInput(row.ViDo),
    kinhDo: formatNumberInput(row.KinhDo),
    soThangCocToiThieu: formatNumberInput(row.SoThangCocToiThieu),
    bangHoaHongList: parsedHoaHong.length ? parsedHoaHong : [createHoaHongRow()],
    lyDoNgungHoatDong: row.LyDoNgungHoatDong || ''
  };
};

function QuanLyDuAnAdmin() {
  const [filters, setFilters] = useState(defaultFilters);
  const [duAnState, setDuAnState] = useState({ rows: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({ open: false, mode: 'create', submitting: false, targetId: null });
  const [formValues, setFormValues] = useState(createEmptyForm());
  const [formError, setFormError] = useState('');

  const loadDuAn = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await duAnOperatorApi.getDanhSach(filters);
      const payload = response.data || {};
      const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.items) ? payload.items : [];
      setDuAnState({
        rows,
        total: payload.total ?? rows.length,
        totalPages: payload.totalPages ?? 1
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách dự án';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDuAn();
  }, [loadDuAn]);

  const updateHoaHongRow = (index, field, value) => {
    setFormValues((prev) => {
      const list = prev.bangHoaHongList?.length ? prev.bangHoaHongList : [createHoaHongRow()];
      const nextList = list.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, bangHoaHongList: nextList };
    });
  };

  const addHoaHongRow = () => {
    setFormValues((prev) => ({
      ...prev,
      bangHoaHongList: [...(prev.bangHoaHongList || []), createHoaHongRow()]
    }));
  };

  const removeHoaHongRow = (index) => {
    setFormValues((prev) => {
      const list = prev.bangHoaHongList || [];
      if (list.length <= 1) {
        return { ...prev, bangHoaHongList: list };
      }
      const nextList = list.filter((_, idx) => idx !== index);
      return { ...prev, bangHoaHongList: nextList.length ? nextList : [createHoaHongRow()] };
    });
  };

  const stats = useMemo(() => {
    if (!duAnState.rows.length) {
      return { HoatDong: 0, LuuTru: 0, NgungHoatDong: 0 };
    }
    return duAnState.rows.reduce(
      (acc, row) => {
        if (acc[row.TrangThai] !== undefined) {
          acc[row.TrangThai] += 1;
        }
        return acc;
      },
      { HoatDong: 0, LuuTru: 0, NgungHoatDong: 0 }
    );
  }, [duAnState.rows]);

  const openModal = (mode, row = null) => {
    setFormError('');
    if (mode === 'edit' && row) {
      setFormValues(mapRowToForm(row));
      setModalState({ open: true, mode: 'edit', submitting: false, targetId: row.DuAnID });
    } else {
      setFormValues(createEmptyForm());
      setModalState({ open: true, mode: 'create', submitting: false, targetId: null });
    }
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', submitting: false, targetId: null });
      setFormValues(createEmptyForm());
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const payload = buildPayload(formValues);

    if (!payload.TenDuAn || !payload.DiaChi || Number.isNaN(payload.ChuDuAnID)) {
      setFormError('Vui lòng điền đầy đủ Tên dự án, Địa chỉ và Chủ dự án ID');
      return;
    }

    if (payload.TrangThai === 'NgungHoatDong' && (!payload.LyDoNgungHoatDong || payload.LyDoNgungHoatDong.length < 10)) {
      setFormError('Lý do ngưng hoạt động cần tối thiểu 10 ký tự');
      return;
    }

    setModalState((prev) => ({ ...prev, submitting: true }));

    try {
      if (modalState.mode === 'edit' && modalState.targetId) {
        await duAnOperatorApi.capNhatDuAn(modalState.targetId, payload);
      } else {
        await duAnOperatorApi.taoDuAn(payload);
      }
      await loadDuAn();
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể lưu dự án';
      setFormError(message);
    } finally {
      setModalState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handlePageChange = (direction) => {
    setFilters((prev) => {
      const nextPage = prev.page + direction;
      if (nextPage < 1 || nextPage > duAnState.totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  const hoaHongFormList =
    formValues.bangHoaHongList?.length ? formValues.bangHoaHongList : [createHoaHongRow()];

  return (
    <div className="quan-ly-du-an-admin">
      <div className="quan-ly-du-an-admin__header">
        <div>
          <h2 className="quan-ly-du-an-admin__title">Quản lý dự án</h2>
          <p className="quan-ly-du-an-admin__subtitle">
            Quản trị viên hệ thống tạo, chỉnh sửa và giám sát trạng thái dự án
          </p>
        </div>
        <button
          className="quan-ly-du-an-admin__primary-btn"
          onClick={() => openModal('create')}
        >
          ➕ Thêm dự án
        </button>
      </div>

      <div className="quan-ly-du-an-admin__stats">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className={`quan-ly-du-an-admin__stat-card quan-ly-du-an-admin__stat-card--${option.value.toLowerCase()}`}>
            <div className="quan-ly-du-an-admin__stat-value">{stats[option.value] || 0}</div>
            <div className="quan-ly-du-an-admin__stat-label">{option.label}</div>
          </div>
        ))}
      </div>

      <div className="quan-ly-du-an-admin__filters">
        <input
          type="text"
          name="keyword"
          placeholder="Tìm theo tên, địa chỉ..."
          value={filters.keyword}
          onChange={handleFilterChange}
          className="quan-ly-du-an-admin__input"
        />
        <select
          name="trangThai"
          value={filters.trangThai}
          onChange={handleFilterChange}
          className="quan-ly-du-an-admin__input"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="limit"
          value={filters.limit}
          onChange={handleFilterChange}
          className="quan-ly-du-an-admin__input"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} dòng/trang
            </option>
          ))}
        </select>
        <button className="quan-ly-du-an-admin__secondary-btn" onClick={handleResetFilters}>
          ↺ Làm mới bộ lọc
        </button>
      </div>

      {error && <div className="quan-ly-du-an-admin__alert quan-ly-du-an-admin__alert--error">{error}</div>}

      <div className="quan-ly-du-an-admin__table-wrapper">
        <table className="quan-ly-du-an-admin__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên dự án</th>
              <th>Chủ dự án</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Hoa hồng (%)</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="quan-ly-du-an-admin__table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && duAnState.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="quan-ly-du-an-admin__table-empty">
                  Không có dự án nào
                </td>
              </tr>
            )}
            {!loading &&
              duAnState.rows.map((row) => {
                const hoaHongData = parseHoaHong(row.BangHoaHong);

                return (
                <tr key={row.DuAnID}>
                  <td>#{row.DuAnID}</td>
                  <td className="quan-ly-du-an-admin__cell-main">
                    <span className="quan-ly-du-an-admin__cell-title">{row.TenDuAn}</span>
                    <span className="quan-ly-du-an-admin__cell-sub">{row.PhuongThucVao || 'Chưa cấu hình phương thức vào'}</span>
                  </td>
                  <td className="quan-ly-du-an-admin__owner-cell">
                    <span className="quan-ly-du-an-admin__owner-name">{row.TenChuDuAn || '—'}</span>
                    <span className="quan-ly-du-an-admin__owner-contact">{row.EmailChuDuAn || row.SoDienThoaiChuDuAn || '—'}</span>
                  </td>
                  <td>{row.DiaChi}</td>
                  <td>
                    <span className={`quan-ly-du-an-admin__badge quan-ly-du-an-admin__badge--${row.TrangThai?.toLowerCase()}`}>
                      {statusLabelMap[row.TrangThai] || row.TrangThai}
                    </span>
                  </td>
                  <td className="quan-ly-du-an-admin__hoa-hong-cell">
                    {hoaHongData.length === 0 ? (
                      <span className="quan-ly-du-an-admin__hoa-hong-empty">Chưa cấu hình</span>
                    ) : (
                      <ul className="quan-ly-du-an-admin__hoa-hong-list">
                        {hoaHongData.map((item, index) => (
                          <li key={`${row.DuAnID}-hoa-hong-${index}`} className="quan-ly-du-an-admin__hoa-hong-item">
                            <span className="quan-ly-du-an-admin__hoa-hong-month">
                              {item.soThang ? `${item.soThang} tháng` : 'Mọi kỳ'}
                            </span>
                            <span className="quan-ly-du-an-admin__hoa-hong-rate">{item.tyLe ?? 0}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{row.TaoLuc ? new Date(row.TaoLuc).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <button
                      className="quan-ly-du-an-admin__link-btn"
                      onClick={() => openModal('edit', row)}
                    >
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="quan-ly-du-an-admin__pagination">
        <button
          className="quan-ly-du-an-admin__secondary-btn"
          onClick={() => handlePageChange(-1)}
          disabled={filters.page === 1}
        >
          ← Trang trước
        </button>
        <span>
          Trang {filters.page} / {duAnState.totalPages}
        </span>
        <button
          className="quan-ly-du-an-admin__secondary-btn"
          onClick={() => handlePageChange(1)}
          disabled={filters.page >= duAnState.totalPages}
        >
          Trang sau →
        </button>
      </div>

      {modalState.open && (
        <div className="quan-ly-du-an-admin__modal-overlay" role="dialog" aria-modal="true">
          <div className="quan-ly-du-an-admin__modal">
            <div className="quan-ly-du-an-admin__modal-header">
              <h3 className="quan-ly-du-an-admin__modal-title">
                {modalState.mode === 'edit' ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
              </h3>
              <button className="quan-ly-du-an-admin__icon-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {formError && <div className="quan-ly-du-an-admin__alert quan-ly-du-an-admin__alert--error">{formError}</div>}

            <form className="quan-ly-du-an-admin__form" onSubmit={handleSubmit}>
              <div className="quan-ly-du-an-admin__form-grid">
                <label className="quan-ly-du-an-admin__form-field">
                  <span>Tên dự án *</span>
                  <input
                    type="text"
                    name="tenDuAn"
                    value={formValues.tenDuAn}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Chủ dự án ID *</span>
                  <input
                    type="number"
                    name="chuDuAnId"
                    value={formValues.chuDuAnId}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field quan-ly-du-an-admin__form-field--full">
                  <span>Địa chỉ *</span>
                  <input
                    type="text"
                    name="diaChi"
                    value={formValues.diaChi}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Trạng thái</span>
                  <select name="trangThai" value={formValues.trangThai} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Phương thức vào</span>
                  <input
                    type="text"
                    name="phuongThucVao"
                    value={formValues.phuongThucVao}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field quan-ly-du-an-admin__form-field--full">
                  <span>Hoa hồng theo kỳ</span>
                  <div className="quan-ly-du-an-admin__hoa-hong-editor">
                    {hoaHongFormList.map((tier, index) => (
                      <div key={`hoa-hong-editor-${index}`} className="quan-ly-du-an-admin__hoa-hong-editor-row">
                        <div className="quan-ly-du-an-admin__hoa-hong-editor-field">
                          <span>Kỳ (tháng)</span>
                          <input
                            type="number"
                            min="1"
                            name={`hoaHongMonth-${index}`}
                            value={tier.soThang}
                            onChange={(event) =>
                              updateHoaHongRow(index, 'soThang', event.target.value)
                            }
                          />
                        </div>
                        <div className="quan-ly-du-an-admin__hoa-hong-editor-field">
                          <span>Tỷ lệ (%)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            name={`hoaHongPercent-${index}`}
                            value={tier.tyLe}
                            onChange={(event) =>
                              updateHoaHongRow(index, 'tyLe', event.target.value)
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="quan-ly-du-an-admin__hoa-hong-remove"
                          onClick={() => removeHoaHongRow(index)}
                          disabled={hoaHongFormList.length === 1}
                          aria-label="Xoá mức hoa hồng"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="quan-ly-du-an-admin__hoa-hong-add"
                      onClick={addHoaHongRow}
                    >
                      + Thêm mức hoa hồng
                    </button>
                  </div>
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Số tháng cọc tối thiểu</span>
                  <input
                    type="number"
                    name="soThangCocToiThieu"
                    value={formValues.soThangCocToiThieu}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Vĩ độ</span>
                  <input
                    type="number"
                    step="0.000001"
                    name="viDo"
                    value={formValues.viDo}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field">
                  <span>Kinh độ</span>
                  <input
                    type="number"
                    step="0.000001"
                    name="kinhDo"
                    value={formValues.kinhDo}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="quan-ly-du-an-admin__form-field quan-ly-du-an-admin__form-field--checkbox">
                  <input
                    type="checkbox"
                    name="yeuCauPheDuyetChu"
                    checked={formValues.yeuCauPheDuyetChu}
                    onChange={handleInputChange}
                  />
                  <span>Yêu cầu chủ dự án phê duyệt cuộc hẹn</span>
                </label>
              </div>

              {formValues.trangThai === 'NgungHoatDong' && (
                <label className="quan-ly-du-an-admin__form-field quan-ly-du-an-admin__form-field--full">
                  <span>Lý do ngưng hoạt động *</span>
                  <textarea
                    name="lyDoNgungHoatDong"
                    minLength={10}
                    value={formValues.lyDoNgungHoatDong}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              )}

              <div className="quan-ly-du-an-admin__form-actions">
                <button
                  type="button"
                  className="quan-ly-du-an-admin__secondary-btn"
                  onClick={closeModal}
                  disabled={modalState.submitting}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="quan-ly-du-an-admin__primary-btn"
                  disabled={modalState.submitting}
                >
                  {modalState.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyDuAnAdmin;

