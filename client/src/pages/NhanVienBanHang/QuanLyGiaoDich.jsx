/**
 * UC-SALE-04: Quản lý Giao dịch & Xử lý Cọc
 * Dashboard danh sách + panel chi tiết + hành động xác nhận/hoàn trả
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlineCurrencyDollar,
  HiMagnifyingGlass,
  HiOutlineDocumentArrowDown,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineShieldCheck
} from 'react-icons/hi2';
import {
  layDanhSachGiaoDich,
  xemChiTietGiaoDich,
  xacNhanCoc,
  hoanTraCoc,
  taiBienNhan
} from '../../api/nhanVienBanHangApi';
import {
  formatDate,
  formatCurrency,
  exportToExcel,
  generateReceiptNumber,
  validateReceiptNumber,
  truncateText,
  getTimeAgo
} from '../../utils/nvbhHelpers';
import StatusBadge from '../../components/NhanVienBanHang/StatusBadge';
import LoadingSkeleton from '../../components/NhanVienBanHang/LoadingSkeleton';
import EmptyState from '../../components/NhanVienBanHang/EmptyState';
import ErrorBanner from '../../components/NhanVienBanHang/ErrorBanner';
import './QuanLyGiaoDich.css';

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả', query: null },
  { id: 'pending', label: 'Đang giữ cọc', query: 'DaUyQuyen' },
  { id: 'confirmed', label: 'Đã xác nhận', query: 'DaGhiNhan' },
  { id: 'refunded', label: 'Đã giải tỏa', query: 'DaHoanTien' }
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'Tất cả loại' },
  { id: 'COC_GIU_CHO', label: 'Cọc giữ chỗ' },
  { id: 'COC_AN_NINH', label: 'Cọc an ninh' }
];

const PAYMENT_METHODS = [
  { value: 'TienMat', label: 'Tiền mặt' },
  { value: 'ChuyenKhoan', label: 'Chuyển khoản' },
  { value: 'ViDienTu', label: 'Ví điện tử' }
];

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
};

const QuanLyGiaoDich = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultRange = useMemo(() => getDefaultDateRange(), []);

  const [filters, setFilters] = useState(() => ({
    trangThai: searchParams.get('trangThai') || 'all',
    loai: searchParams.get('loai') || 'all',
    tuNgay: searchParams.get('tuNgay') || defaultRange.start,
    denNgay: searchParams.get('denNgay') || defaultRange.end,
    keyword: searchParams.get('keyword') || ''
  }));
  const [searchValue, setSearchValue] = useState(filters.keyword);

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    refunded: 0,
    totalAmount: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const handleFilterChange = useCallback(
    (field, value) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Sync filters với URL - tách riêng để tránh lỗi "Cannot update while rendering"
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      if ((key === 'trangThai' || key === 'loai') && value === 'all') return;
      params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      handleFilterChange('keyword', searchValue.trim());
    }, 350);
    return () => clearTimeout(debounceId);
  }, [searchValue, handleFilterChange]);

  const buildParams = useCallback(() => {
    const params = {};
    if (filters.trangThai !== 'all') params.trangThai = filters.trangThai;
    if (filters.loai !== 'all') params.loai = filters.loai;
    if (filters.tuNgay) params.tuNgay = filters.tuNgay;
    if (filters.denNgay) params.denNgay = filters.denNgay;
    if (filters.keyword) params.keyword = filters.keyword;
    params.limit = 100;
    return params;
  }, [filters]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await layDanhSachGiaoDich(buildParams());
      if (response.success) {
        const list = response.data.giaoDichs || [];
        setTransactions(list);
        setStats(calculateStats(list));
        if (list.length > 0) {
          setSelectedTransactionId((prev) => prev || list[0].GiaoDichID);
        } else {
          setSelectedTransactionId(null);
          setSelectedTransaction(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const loadTransactionDetail = useCallback(
    async (giaoDichId) => {
      if (!giaoDichId) return;
      try {
        setDetailLoading(true);
        setDetailError(null);
        const response = await xemChiTietGiaoDich(giaoDichId);
        if (response.success) {
          setSelectedTransaction(response.data);
        }
      } catch (err) {
        setDetailError(err.message || 'Không thể tải chi tiết giao dịch');
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTransactionDetail(selectedTransactionId);
  }, [selectedTransactionId, loadTransactionDetail]);

  const handleExport = () => {
    if (transactions.length === 0) return;
    const exportData = transactions.map((t) => ({
      'Mã cọc': t.GiaoDichID,
      'Khách hàng': t.TenKhachHang || 'N/A',
      'Phòng': t.TenPhong || 'N/A',
      'Dự án': t.TenDuAn || 'N/A',
      'Số tiền cọc': formatCurrency(t.SoTien),
      'Loại': t.Loai === 'COC_AN_NINH' ? 'Cọc an ninh' : 'Cọc giữ chỗ',
      'Trạng thái': t.TrangThai === 'DaUyQuyen' ? 'Đang giữ' : (t.TrangThai === 'DaGhiNhan' ? 'Đã xác nhận' : 'Đã hoàn'),
      'Ngày tạo': formatDate(t.ThoiGian, 'datetime')
    }));
    exportToExcel(exportData, 'nvbh-giao-dich-coc', 'GiaoDich');
  };

  const handleDownloadReceipt = async () => {
    if (!selectedTransactionId) return;
    try {
      const blob = await taiBienNhan(selectedTransactionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bien-nhan-${selectedTransactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      alert(`Không thể tải biên nhận: ${downloadError.message || 'Lỗi hệ thống'}`);
    }
  };

  const handleConfirmSuccess = () => {
    setShowConfirmModal(false);
    loadTransactions();
    if (selectedTransactionId) {
      loadTransactionDetail(selectedTransactionId);
    }
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    loadTransactions();
    if (selectedTransactionId) {
      loadTransactionDetail(selectedTransactionId);
    }
  };

  const handleQuickStatusFilter = useCallback(
    (status) => {
      handleFilterChange('trangThai', status);
    },
    [handleFilterChange]
  );

  return (
    <div className="nvbh-quan-ly-giao-dich">
      <header className="nvbh-quan-ly-giao-dich__header">
        <div className="nvbh-quan-ly-giao-dich__title">
          <HiOutlineCurrencyDollar />
          <div>
            <h1>Quản lý giao dịch & cọc</h1>
          </div>
        </div>
        <div className="nvbh-quan-ly-giao-dich__header-actions">
          <div className="nvbh-quan-ly-giao-dich__search">
            <HiMagnifyingGlass />
            <input
              type="text"
              value={searchValue}
              placeholder="Tìm theo khách hàng, mã giao dịch, số điện thoại..."
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <button
            className="nvbh-btn nvbh-btn--ghost"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <HiOutlineDocumentArrowDown />
            Xuất Excel
          </button>
        </div>
      </header>

      <TransactionStats
        stats={stats}
        activeStatus={filters.trangThai}
        onQuickFilter={handleQuickStatusFilter}
      />

      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadTransactions}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="nvbh-quan-ly-giao-dich__content">
        <div className="nvbh-quan-ly-giao-dich__list">
          {loading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="currency"
              title="Chưa có giao dịch"
              description="Không có giao dịch nào phù hợp bộ lọc hiện tại"
            />
          ) : (
            <TransactionTable
              transactions={transactions}
              selectedId={selectedTransactionId}
              onSelect={setSelectedTransactionId}
            />
          )}
        </div>
        <TransactionDetailPanel
          transaction={selectedTransaction}
          loading={detailLoading}
          error={detailError}
          onRetry={() => loadTransactionDetail(selectedTransactionId)}
          onConfirm={() => setShowConfirmModal(true)}
          onRefund={() => setShowRefundModal(true)}
          onDownloadReceipt={handleDownloadReceipt}
        />
      </div>

      {showConfirmModal && selectedTransaction && (
        <XacNhanCocModal
          transaction={selectedTransaction}
          onClose={() => setShowConfirmModal(false)}
          onSuccess={handleConfirmSuccess}
        />
      )}

      {showRefundModal && selectedTransaction && (
        <HoanTraCocModal
          transaction={selectedTransaction}
          onClose={() => setShowRefundModal(false)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
};

const TransactionStats = ({ stats, activeStatus = 'all', onQuickFilter }) => {
  if (!stats) return null;
  const handleCardClick = (status) => {
    if (!onQuickFilter) return;
    onQuickFilter(status);
  };

  return (
    <section className="nvbh-quan-ly-giao-dich__stats">
      <button
        type="button"
        className={`nvbh-stat-card nvbh-stat-card--primary ${activeStatus === 'DaUyQuyen' ? 'nvbh-stat-card--active' : ''}`}
        onClick={() => handleCardClick('DaUyQuyen')}
        aria-pressed={activeStatus === 'DaUyQuyen'}
      >
        <div>
          <p>Đang giữ cọc</p>
          <h3>{stats.pending}</h3>
        </div>
        <HiOutlineShieldCheck />
      </button>
      <button
        type="button"
        className={`nvbh-stat-card nvbh-stat-card--success ${activeStatus === 'DaGhiNhan' ? 'nvbh-stat-card--active' : ''}`}
        onClick={() => handleCardClick('DaGhiNhan')}
        aria-pressed={activeStatus === 'DaGhiNhan'}
      >
        <div>
          <p>Đã xác nhận</p>
          <h3>{stats.confirmed}</h3>
        </div>
        <HiOutlineCurrencyDollar />
      </button>
      <button
        type="button"
        className={`nvbh-stat-card nvbh-stat-card--warning ${activeStatus === 'DaHoanTien' ? 'nvbh-stat-card--active' : ''}`}
        onClick={() => handleCardClick('DaHoanTien')}
        aria-pressed={activeStatus === 'DaHoanTien'}
      >
        <div>
          <p>Đã giải tỏa</p>
          <h3>{stats.refunded}</h3>
        </div>
        <HiOutlineArrowPath />
      </button>
      <button
        type="button"
        className={`nvbh-stat-card nvbh-stat-card--info ${activeStatus === 'all' ? 'nvbh-stat-card--active' : ''}`}
        onClick={() => handleCardClick('all')}
        aria-pressed={activeStatus === 'all'}
      >
        <div>
          <p>Tổng giá trị cọc</p>
          <h3>{formatCurrency(stats.totalAmount)}</h3>
          <small>Cập nhật {stats.lastUpdated ? getTimeAgo(stats.lastUpdated) : '—'}</small>
        </div>
      </button>
    </section>
  );
};

const TransactionFilters = ({ filters, onFilterChange }) => (
  <section className="nvbh-quan-ly-giao-dich__filters">
    <div className="nvbh-filter-group">
      <span className="nvbh-filter-group__label">
        <HiOutlineAdjustmentsHorizontal />
        Trạng thái
      </span>
      <div className="nvbh-chip-group">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nvbh-chip ${filters.trangThai === tab.query || (tab.id === 'all' && filters.trangThai === 'all') ? 'nvbh-chip--active' : ''}`}
            onClick={() => onFilterChange('trangThai', tab.query || 'all')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
    <div className="nvbh-filter-grid">
      <label className="nvbh-filter-field">
        Loại giao dịch
        <select
          value={filters.loai}
          onChange={(e) => onFilterChange('loai', e.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nvbh-filter-field">
        Từ ngày
        <input
          type="date"
          value={filters.tuNgay}
          max={filters.denNgay}
          onChange={(e) => onFilterChange('tuNgay', e.target.value)}
        />
      </label>
      <label className="nvbh-filter-field">
        Đến ngày
        <input
          type="date"
          value={filters.denNgay}
          min={filters.tuNgay}
          onChange={(e) => onFilterChange('denNgay', e.target.value)}
        />
      </label>
    </div>
  </section>
);

const TransactionTable = ({ transactions, selectedId, onSelect }) => (
  <div className="nvbh-transaction-table">
    <div className="nvbh-transaction-table__header">
      <span>Mã cọc</span>
      <span>Khách hàng</span>
      <span>Phòng</span>
      <span>Số tiền</span>
      <span>Thời gian</span>
      <span>Trạng thái</span>
    </div>
    <div className="nvbh-transaction-table__body">
      {transactions.map((transaction) => (
        <button
          key={transaction.GiaoDichID}
          className={`nvbh-transaction-row ${selectedId === transaction.GiaoDichID ? 'nvbh-transaction-row--active' : ''}`}
          onClick={() => onSelect(transaction.GiaoDichID)}
        >
          <span>#{transaction.GiaoDichID}</span>
          <span>{truncateText(transaction.TenKhachHang || '—', 24)}</span>
          <span>{truncateText(transaction.TenPhong || transaction.TenDuAn || '—', 20)}</span>
          <span>{formatCurrency(transaction.SoTien)}</span>
          <span>{formatDate(transaction.ThoiGian, 'datetime')}</span>
          <span>
            <StatusBadge status={transaction.TrangThai} size="xs" />
          </span>
        </button>
      ))}
    </div>
  </div>
);

const TransactionDetailPanel = ({
  transaction,
  loading,
  error,
  onRetry,
  onConfirm,
  onRefund,
  onDownloadReceipt
}) => {
  if (loading) {
    return (
      <aside className="nvbh-transaction-panel">
        <LoadingSkeleton type="card" count={1} />
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="nvbh-transaction-panel">
        <ErrorBanner message={error} onRetry={onRetry} />
      </aside>
    );
  }

  if (!transaction) {
    return (
      <aside className="nvbh-transaction-panel">
        <EmptyState
          icon="documents"
          title="Chọn một giao dịch"
          description="Thông tin chi tiết sẽ hiển thị tại đây"
        />
      </aside>
    );
  }

  const canConfirm = transaction.TrangThai === 'DaUyQuyen';
  const canRefund = ['DaGhiNhan', 'DaThanhToan'].includes(transaction.TrangThai);
  const hasReceipt = Boolean(transaction.ChungTuDinhKemURL);

  const timeline = [
    { label: 'Giao dịch tạo', value: transaction.ThoiGian },
    { label: 'Cọc hiệu lực', value: transaction.CocTaoLuc },
    { label: 'Cập nhật gần nhất', value: transaction.CocCapNhatLuc },
    { label: 'Hết hạn TTL', value: transaction.HetHanLuc }
  ];

  return (
    <aside className="nvbh-transaction-panel">
      <div className="nvbh-transaction-panel__header">
        <div>
          <p>Mã giao dịch</p>
          <h3>#{transaction.GiaoDichID}</h3>
        </div>
        <StatusBadge status={transaction.TrangThai} size="sm" />
      </div>

      <div className="nvbh-transaction-panel__section">
        <h4>Thông tin thanh toán</h4>
        <dl>
          <div>
            <dt>Số tiền</dt>
            <dd>{formatCurrency(transaction.SoTien)}</dd>
          </div>
          <div>
            <dt>Loại cọc</dt>
            <dd>{transaction.Loai === 'COC_AN_NINH' ? 'Cọc an ninh' : 'Cọc giữ chỗ'}</dd>
          </div>
          <div>
            <dt>Phương thức</dt>
            <dd>{transaction.KenhThanhToan || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Số biên nhận</dt>
            <dd>{transaction.SoBienNhan || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="nvbh-transaction-panel__section">
        <h4>Khách hàng</h4>
        <dl>
          <div>
            <dt>Họ tên</dt>
            <dd>{transaction.TenKhachHang || '—'}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{transaction.SDTKhachHang || '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{transaction.EmailKhachHang || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="nvbh-transaction-panel__section">
        <h4>Tin đăng & Phòng</h4>
        <dl>
          <div>
            <dt>Tin đăng</dt>
            <dd>{transaction.TieuDeTinDang || '—'}</dd>
          </div>
          <div>
            <dt>Phòng</dt>
            <dd>{transaction.TenPhong || '—'}</dd>
          </div>
          <div>
            <dt>Dự án</dt>
            <dd>{transaction.TenDuAn || '—'}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{transaction.DiaChiTinDang || transaction.DiaChiDuAn || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="nvbh-transaction-panel__section">
        <h4>Chính sách cọc</h4>
        <dl>
          <div>
            <dt>Chính sách</dt>
            <dd>{transaction.TenChinhSach || 'Theo mặc định'}</dd>
          </div>
          <div>
            <dt>TTL</dt>
            <dd>{transaction.TTL_CocGiuCho_Gio ? `${transaction.TTL_CocGiuCho_Gio} giờ` : '—'}</dd>
          </div>
          <div>
            <dt>Phạt giữ chỗ</dt>
            <dd>{transaction.TyLePhat_CocGiuCho ? `${transaction.TyLePhat_CocGiuCho}%` : '0%'}</dd>
          </div>
        </dl>
      </div>

      <div className="nvbh-transaction-panel__section">
        <h4>Dòng thời gian</h4>
        <ol className="nvbh-timeline">
          {timeline.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value ? formatDate(item.value, 'datetime') : '—'}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div className="nvbh-transaction-panel__actions">
        <button
          className="nvbh-btn nvbh-btn--primary"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          Xác nhận cọc
        </button>
        <button
          className="nvbh-btn nvbh-btn--danger"
          onClick={onRefund}
          disabled={!canRefund}
        >
          Tạo yêu cầu hoàn trả
        </button>
        <button
          className="nvbh-btn nvbh-btn--ghost"
          onClick={onDownloadReceipt}
          disabled={!hasReceipt}
        >
          <HiOutlineArrowDownTray />
          Tải biên nhận
        </button>
      </div>
    </aside>
  );
};

const XacNhanCocModal = ({ transaction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    soBienNhan: generateReceiptNumber(),
    phuongThucThanhToan: 'TienMat',
    ghiChu: '',
    hinhAnhBienNhan: null
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateReceiptNumber(formData.soBienNhan)) {
      setError('Số biên nhận phải theo định dạng BN-YYYYMMDD-XXXX');
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('soBienNhan', formData.soBienNhan);
      payload.append('phuongThucThanhToan', formData.phuongThucThanhToan);
      payload.append('ghiChu', formData.ghiChu);
      if (formData.hinhAnhBienNhan) {
        payload.append('hinhAnhBienNhan', formData.hinhAnhBienNhan);
      }
      const response = await xacNhanCoc(transaction.GiaoDichID, payload);
      if (response.success) {
        alert('Đã xác nhận cọc thành công');
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Không thể xác nhận cọc');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nvbh-modal-overlay" onClick={onClose}>
      <div className="nvbh-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Xác nhận cọc</h2>
        <form onSubmit={handleSubmit}>
          <div className="nvbh-form-group">
            <label>Số biên nhận</label>
            <input
              type="text"
              value={formData.soBienNhan}
              onChange={(e) => setFormData({ ...formData, soBienNhan: e.target.value })}
              required
            />
          </div>
          <div className="nvbh-form-group">
            <label>Phương thức</label>
            <select
              value={formData.phuongThucThanhToan}
              onChange={(e) => setFormData({ ...formData, phuongThucThanhToan: e.target.value })}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="nvbh-form-group">
            <label>Ghi chú (tùy chọn)</label>
            <textarea
              rows="3"
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              placeholder="Ví dụ: Khách thanh toán tại dự án, NVBH xác nhận tận nơi..."
            />
          </div>
          <div className="nvbh-form-group">
            <label>Ảnh/PDF biên nhận</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setFormData({ ...formData, hinhAnhBienNhan: e.target.files[0] })}
            />
          </div>
          {error && <p className="nvbh-form-error">{error}</p>}
          <div className="nvbh-modal__actions">
            <button type="button" className="nvbh-btn nvbh-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="nvbh-btn nvbh-btn--primary" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác nhận cọc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HoanTraCocModal = ({ transaction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    soTienHoanTra: transaction.SoTien || 0,
    lyDoHoanTra: '',
    phuongThucHoanTra: 'ChuyenKhoan',
    ghiChu: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.lyDoHoanTra) {
      setError('Vui lòng nhập lý do hoàn trả');
      return;
    }
    try {
      setSubmitting(true);
      await hoanTraCoc(transaction.GiaoDichID, formData);
      alert('Đã tạo yêu cầu hoàn trả');
      onSuccess();
    } catch (err) {
      setError(err.message || 'Không thể xử lý hoàn trả');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nvbh-modal-overlay" onClick={onClose}>
      <div className="nvbh-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Hoàn trả cọc</h2>
        <form onSubmit={handleSubmit}>
          <div className="nvbh-form-group">
            <label>Số tiền hoàn trả</label>
            <input
              type="number"
              min="0"
              value={formData.soTienHoanTra}
              onChange={(e) => setFormData({ ...formData, soTienHoanTra: Number(e.target.value) })}
            />
          </div>
          <div className="nvbh-form-group">
            <label>Phương thức</label>
            <select
              value={formData.phuongThucHoanTra}
              onChange={(e) => setFormData({ ...formData, phuongThucHoanTra: e.target.value })}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="nvbh-form-group">
            <label>Lý do hoàn trả</label>
            <textarea
              rows="3"
              value={formData.lyDoHoanTra}
              onChange={(e) => setFormData({ ...formData, lyDoHoanTra: e.target.value })}
              placeholder="Ví dụ: Khách hủy thuê trước TTL, dự án dừng triển khai..."
              required
            />
          </div>
          <div className="nvbh-form-group">
            <label>Ghi chú nội bộ</label>
            <textarea
              rows="2"
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
            />
          </div>
          {error && <p className="nvbh-form-error">{error}</p>}
          <div className="nvbh-modal__actions">
            <button type="button" className="nvbh-btn nvbh-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="nvbh-btn nvbh-btn--primary" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Hoàn trả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const calculateStats = (items = []) => {
  return items.reduce(
    (acc, item) => {
      if (item.TrangThai === 'DaUyQuyen') acc.pending += 1;
      if (item.TrangThai === 'DaGhiNhan') acc.confirmed += 1;
      if (item.TrangThai === 'DaHoanTien') acc.refunded += 1;
      acc.totalAmount += Number(item.SoTien || 0);
      acc.lastUpdated = new Date();
      return acc;
    },
    { pending: 0, confirmed: 0, refunded: 0, totalAmount: 0, lastUpdated: null }
  );
};

export default QuanLyGiaoDich;

