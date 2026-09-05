import { useCallback, useEffect, useMemo, useState } from 'react';
import { noiDungHeThongApi } from '../../api/operatorApi';
import './QuanLyChinhSach.css';

const LOAI_NOI_DUNG_OPTIONS = [
  { value: 'POLICY_PRIVACY', label: 'Chính sách bảo mật' },
  { value: 'TERMS_USAGE', label: 'Điều khoản sử dụng' },
  { value: 'POLICY_PAYMENT', label: 'Chính sách thanh toán' },
  { value: 'GUIDE_BOOKING', label: 'Hướng dẫn thuê phòng' }
];

const loaiNoiDungLabelMap = {
  POLICY_PRIVACY: 'Chính sách bảo mật',
  TERMS_USAGE: 'Điều khoản sử dụng',
  POLICY_PAYMENT: 'Chính sách thanh toán',
  GUIDE_BOOKING: 'Hướng dẫn thuê phòng'
};

const defaultFilters = {
  loaiNoiDung: '',
  keyword: '',
  page: 1,
  limit: 10
};

const createEmptyForm = () => ({
  LoaiNoiDung: '',
  TieuDe: '',
  NoiDung: '',
  PhienBan: '1.0'
});

function QuanLyChinhSach() {
  const [chinhSachState, setChinhSachState] = useState({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: ''
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    submitting: false,
    targetId: null
  });
  const [formValues, setFormValues] = useState(createEmptyForm());
  const [formError, setFormError] = useState('');

  const loadChinhSach = useCallback(async () => {
    setChinhSachState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await noiDungHeThongApi.getDanhSach(filters);
      const result = response.data;
      setChinhSachState({
        data: result.data || [],
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        totalPages: result.pagination?.totalPages || 1,
        loading: false,
        error: ''
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách chính sách';
      setChinhSachState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
    }
  }, [filters]);

  useEffect(() => {
    loadChinhSach();
  }, [loadChinhSach]);

  const openModal = async (mode, row = null) => {
    setFormError('');
    if (mode === 'edit' && row) {
      try {
        const response = await noiDungHeThongApi.getChiTiet(row.NoiDungID);
        const data = response.data.data;
        setFormValues({
          LoaiNoiDung: data.LoaiNoiDung || '',
          TieuDe: data.TieuDe || '',
          NoiDung: data.NoiDung || '',
          PhienBan: data.PhienBan || '1.0'
        });
        setModalState({ open: true, mode: 'edit', submitting: false, targetId: row.NoiDungID });
      } catch (err) {
        alert('Không thể tải thông tin chính sách');
      }
    } else {
      setFormValues(createEmptyForm());
      setModalState({ open: true, mode: 'create', submitting: false, targetId: null });
    }
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', submitting: false, targetId: null });
    setFormValues(createEmptyForm());
    setFormError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formValues.LoaiNoiDung) {
      setFormError('Vui lòng chọn loại nội dung');
      return;
    }

    if (!formValues.TieuDe || formValues.TieuDe.trim().length === 0) {
      setFormError('Vui lòng nhập tiêu đề');
      return;
    }

    if (!formValues.NoiDung || formValues.NoiDung.trim().length === 0) {
      setFormError('Vui lòng nhập nội dung');
      return;
    }

    if (formValues.TieuDe.length > 255) {
      setFormError('Tiêu đề không được vượt quá 255 ký tự');
      return;
    }

    setModalState((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        LoaiNoiDung: formValues.LoaiNoiDung,
        TieuDe: formValues.TieuDe.trim(),
        NoiDung: formValues.NoiDung.trim(),
        PhienBan: formValues.PhienBan || '1.0'
      };

      if (modalState.mode === 'edit' && modalState.targetId) {
        await noiDungHeThongApi.capNhat(modalState.targetId, payload);
      } else {
        await noiDungHeThongApi.taoMoi(payload);
      }
      await loadChinhSach();
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể lưu chính sách';
      setFormError(message);
    } finally {
      setModalState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDelete = async (noiDungID) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chính sách này?')) {
      return;
    }

    try {
      await noiDungHeThongApi.xoa(noiDungID);
      await loadChinhSach();
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể xóa chính sách';
      alert(message);
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
      if (nextPage < 1 || nextPage > chinhSachState.totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  return (
    <div className="quan-ly-chinh-sach">
      <div className="quan-ly-chinh-sach__header">
        <div>
          <h2 className="quan-ly-chinh-sach__title">Quản lý chính sách</h2>
          <p className="quan-ly-chinh-sach__subtitle">
            Quản lý các chính sách, điều khoản và hướng dẫn hệ thống
          </p>
        </div>
        <button
          className="quan-ly-chinh-sach__primary-btn"
          onClick={() => openModal('create')}
        >
          ➕ Thêm chính sách
        </button>
      </div>

      {/* Filters */}
      <div className="quan-ly-chinh-sach__filters">
        <div className="quan-ly-chinh-sach__filter-group">
          <label className="quan-ly-chinh-sach__filter-label">Loại nội dung</label>
          <select
            name="loaiNoiDung"
            value={filters.loaiNoiDung}
            onChange={handleFilterChange}
            className="quan-ly-chinh-sach__filter-select"
          >
            <option value="">Tất cả</option>
            {LOAI_NOI_DUNG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="quan-ly-chinh-sach__filter-group">
          <label className="quan-ly-chinh-sach__filter-label">Tìm kiếm</label>
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleFilterChange}
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
            className="quan-ly-chinh-sach__filter-input"
          />
        </div>

        <button
          className="quan-ly-chinh-sach__reset-btn"
          onClick={handleResetFilters}
        >
          🔄 Đặt lại
        </button>
      </div>

      {/* Table */}
      <div className="quan-ly-chinh-sach__table-wrapper">
        {chinhSachState.loading && (
          <div className="quan-ly-chinh-sach__loading">Đang tải...</div>
        )}

        {chinhSachState.error && (
          <div className="quan-ly-chinh-sach__error">{chinhSachState.error}</div>
        )}

        {!chinhSachState.loading && chinhSachState.data.length === 0 && (
          <div className="quan-ly-chinh-sach__empty">
            Không có chính sách nào
          </div>
        )}

        {!chinhSachState.loading && chinhSachState.data.length > 0 && (
          <table className="quan-ly-chinh-sach__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại nội dung</th>
                <th>Tiêu đề</th>
                <th>Phiên bản</th>
                <th>Cập nhật bởi</th>
                <th>Cập nhật lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {chinhSachState.data.map((row) => (
                <tr key={row.NoiDungID}>
                  <td>{row.NoiDungID}</td>
                  <td>
                    <span className="quan-ly-chinh-sach__badge">
                      {loaiNoiDungLabelMap[row.LoaiNoiDung] || row.LoaiNoiDung}
                    </span>
                  </td>
                  <td className="quan-ly-chinh-sach__title-cell">{row.TieuDe}</td>
                  <td>{row.PhienBan}</td>
                  <td>{row.TenNguoiCapNhat || '-'}</td>
                  <td>
                    {row.CapNhatLuc
                      ? new Date(row.CapNhatLuc).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    <div className="quan-ly-chinh-sach__actions">
                      <button
                        className="quan-ly-chinh-sach__action-btn quan-ly-chinh-sach__action-btn--edit"
                        onClick={() => openModal('edit', row)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className="quan-ly-chinh-sach__action-btn quan-ly-chinh-sach__action-btn--delete"
                        onClick={() => handleDelete(row.NoiDungID)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!chinhSachState.loading && chinhSachState.totalPages > 1 && (
          <div className="quan-ly-chinh-sach__pagination">
            <button
              className="quan-ly-chinh-sach__pagination-btn"
              onClick={() => handlePageChange(-1)}
              disabled={filters.page === 1}
            >
              ← Trước
            </button>
            <span className="quan-ly-chinh-sach__pagination-info">
              Trang {filters.page} / {chinhSachState.totalPages} ({chinhSachState.total} mục)
            </span>
            <button
              className="quan-ly-chinh-sach__pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={filters.page >= chinhSachState.totalPages}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalState.open && (
        <div className="quan-ly-chinh-sach__modal-overlay" onClick={closeModal}>
          <div
            className="quan-ly-chinh-sach__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quan-ly-chinh-sach__modal-header">
              <h3 className="quan-ly-chinh-sach__modal-title">
                {modalState.mode === 'edit' ? 'Sửa chính sách' : 'Thêm chính sách mới'}
              </h3>
              <button
                className="quan-ly-chinh-sach__modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="quan-ly-chinh-sach__form">
              {formError && (
                <div className="quan-ly-chinh-sach__form-error">{formError}</div>
              )}

              <div className="quan-ly-chinh-sach__form-group">
                <label className="quan-ly-chinh-sach__form-label">
                  Loại nội dung <span className="quan-ly-chinh-sach__required">*</span>
                </label>
                <select
                  name="LoaiNoiDung"
                  value={formValues.LoaiNoiDung}
                  onChange={handleInputChange}
                  className="quan-ly-chinh-sach__form-select"
                  required
                >
                  <option value="">-- Chọn loại nội dung --</option>
                  {LOAI_NOI_DUNG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="quan-ly-chinh-sach__form-group">
                <label className="quan-ly-chinh-sach__form-label">
                  Tiêu đề <span className="quan-ly-chinh-sach__required">*</span>
                </label>
                <input
                  type="text"
                  name="TieuDe"
                  value={formValues.TieuDe}
                  onChange={handleInputChange}
                  className="quan-ly-chinh-sach__form-input"
                  placeholder="Nhập tiêu đề..."
                  maxLength={255}
                  required
                />
              </div>

              <div className="quan-ly-chinh-sach__form-group">
                <label className="quan-ly-chinh-sach__form-label">
                  Nội dung <span className="quan-ly-chinh-sach__required">*</span>
                </label>
                <textarea
                  name="NoiDung"
                  value={formValues.NoiDung}
                  onChange={handleInputChange}
                  className="quan-ly-chinh-sach__form-textarea"
                  placeholder="Nhập nội dung chính sách..."
                  rows={10}
                  required
                />
              </div>

              <div className="quan-ly-chinh-sach__form-group">
                <label className="quan-ly-chinh-sach__form-label">Phiên bản</label>
                <input
                  type="text"
                  name="PhienBan"
                  value={formValues.PhienBan}
                  onChange={handleInputChange}
                  className="quan-ly-chinh-sach__form-input"
                  placeholder="1.0"
                />
              </div>

              <div className="quan-ly-chinh-sach__form-actions">
                <button
                  type="button"
                  className="quan-ly-chinh-sach__form-btn quan-ly-chinh-sach__form-btn--cancel"
                  onClick={closeModal}
                  disabled={modalState.submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="quan-ly-chinh-sach__form-btn quan-ly-chinh-sach__form-btn--submit"
                  disabled={modalState.submitting}
                >
                  {modalState.submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyChinhSach;

