/**
 * UC-SALE-02 & UC-SALE-03: Quản lý Cuộc hẹn
 * List view với filters, search, và actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMagnifyingGlass, HiOutlineFunnel, HiOutlineCalendarDays } from 'react-icons/hi2';
import { layDanhSachCuocHen, xacNhanCuocHen, doiLichCuocHen, huyCuocHen } from '../../api/nhanVienBanHangApi';
import { formatDate, formatCurrency, debounce } from '../../utils/nvbhHelpers';
import StatusBadge from '../../components/NhanVienBanHang/StatusBadge';
import LoadingSkeleton from '../../components/NhanVienBanHang/LoadingSkeleton';
import EmptyState from '../../components/NhanVienBanHang/EmptyState';
import ErrorBanner from '../../components/NhanVienBanHang/ErrorBanner';
import './QuanLyCuocHen.css';

const QuanLyCuocHen = () => {
  const navigate = useNavigate();
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  // Load appointments
  const loadAppointments = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        ...filters
      };
      
      // Apply active filter
      if (activeFilter === 'today') {
        const today = new Date();
        params.tuNgay = today.toISOString().split('T')[0];
        params.denNgay = today.toISOString().split('T')[0];
      } else if (activeFilter === 'upcoming') {
        params.tuNgay = new Date().toISOString().split('T')[0];
      } else if (activeFilter === 'completed') {
        params.trangThai = 'HoanThanh';
      } else if (activeFilter === 'cancelled') {
        params.trangThai = 'HuyBoiKhach,HuyBoiHeThong,KhachKhongDen';
      }
      
      // Apply search
      if (searchTerm) {
        params.keyword = searchTerm;
      }
      
      // Apply date range
      if (dateRange.from) params.tuNgay = dateRange.from;
      if (dateRange.to) params.denNgay = dateRange.to;
      
      const response = await layDanhSachCuocHen(params);
      
      if (response.success) {
        setAppointments(response.data.cuocHens || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      }
    } catch (err) {
      console.error('[QuanLyCuocHen] Load error:', err);
      setError(err.message || 'Không thể tải danh sách cuộc hẹn');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchTerm, dateRange, pagination.limit, pagination.page]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  // Handlers
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleConfirm = async (appointmentId) => {
    try {
      const response = await xacNhanCuocHen(appointmentId);
      if (response.success) {
        loadAppointments();
      }
    } catch (err) {
      console.error('[QuanLyCuocHen] Confirm error:', err);
      alert('Không thể xác nhận cuộc hẹn: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  const handleReschedule = (appointmentId) => {
    // Navigate to detail page with reschedule mode
    navigate(`/nhan-vien-ban-hang/cuoc-hen/${appointmentId}?action=reschedule`);
  };

  const handleCancel = async (appointmentId) => {
    const reason = prompt('Lý do hủy cuộc hẹn:');
    if (!reason) return;
    
    try {
      const response = await huyCuocHen(appointmentId, reason);
      if (response.success) {
        loadAppointments();
      }
    } catch (err) {
      console.error('[QuanLyCuocHen] Cancel error:', err);
      alert('Không thể hủy cuộc hẹn: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  const handleViewDetail = (appointmentId) => {
    navigate(`/nhan-vien-ban-hang/cuoc-hen/${appointmentId}`);
  };

  const handleRetry = () => {
    loadAppointments();
  };

  // Filter tabs
  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: pagination.total },
    { id: 'today', label: 'Hôm nay' },
    { id: 'upcoming', label: 'Sắp tới' },
    { id: 'completed', label: 'Đã hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  return (
    <div className="nvbh-quan-ly-cuoc-hen">
      {/* Header */}
      <div className="nvbh-quan-ly-cuoc-hen__header">
        <div className="nvbh-quan-ly-cuoc-hen__title">
          <HiOutlineCalendarDays />
          <h1>Quản lý Cuộc hẹn</h1>
        </div>
        
        {/* Search */}
        <div className="nvbh-quan-ly-cuoc-hen__search">
          <HiMagnifyingGlass className="nvbh-quan-ly-cuoc-hen__search-icon" />
          <input
            type="text"
            placeholder="Tìm theo khách hàng, phòng..."
            onChange={handleSearchChange}
            aria-label="Tìm kiếm cuộc hẹn"
          />
        </div>
        
        {/* Filter toggle */}
        <button
          className={`nvbh-quan-ly-cuoc-hen__filter-btn ${showFilters ? 'nvbh-quan-ly-cuoc-hen__filter-btn--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Bộ lọc"
          aria-expanded={showFilters}
        >
          <HiOutlineFunnel />
          Bộ lọc
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="nvbh-quan-ly-cuoc-hen__tabs" role="tablist">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            className={`nvbh-quan-ly-cuoc-hen__tab ${activeFilter === tab.id ? 'nvbh-quan-ly-cuoc-hen__tab--active' : ''}`}
            onClick={() => handleFilterChange(tab.id)}
            role="tab"
            aria-selected={activeFilter === tab.id}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="nvbh-quan-ly-cuoc-hen__tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="nvbh-quan-ly-cuoc-hen__filters">
          <div className="nvbh-quan-ly-cuoc-hen__filter-group">
            <label htmlFor="date-from">Từ ngày:</label>
            <input
              id="date-from"
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange('from', e.target.value)}
            />
          </div>
          <div className="nvbh-quan-ly-cuoc-hen__filter-group">
            <label htmlFor="date-to">Đến ngày:</label>
            <input
              id="date-to"
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange('to', e.target.value)}
            />
          </div>
          <button
            className="nvbh-quan-ly-cuoc-hen__filter-reset"
            onClick={() => {
              setDateRange({ from: '', to: '' });
              setSearchTerm('');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Content */}
      <div className="nvbh-quan-ly-cuoc-hen__content">
        {loading ? (
          <LoadingSkeleton type="card" count={5} />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Chưa có cuộc hẹn"
            description="Hiện tại bạn chưa có cuộc hẹn nào. Hệ thống sẽ tự động gán cuộc hẹn mới cho bạn."
          />
        ) : (
          <div className="nvbh-quan-ly-cuoc-hen__grid">
            {appointments.map(appointment => (
              <AppointmentCard
                key={appointment.CuocHenID}
                appointment={appointment}
                onViewDetail={handleViewDetail}
                onConfirm={handleConfirm}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && appointments.length > 0 && (
        <div className="nvbh-quan-ly-cuoc-hen__pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            aria-label="Trang trước"
          >
            Trước
          </button>
          <span>
            Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            aria-label="Trang sau"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({ appointment, onViewDetail, onConfirm, onReschedule, onCancel }) => {
  const canConfirm = appointment.TrangThai === 'ChoXacNhan';
  const canReschedule = ['DaXacNhan', 'DaYeuCau'].includes(appointment.TrangThai);
  const canCancel = ['ChoXacNhan', 'DaXacNhan', 'DaYeuCau'].includes(appointment.TrangThai);

  return (
    <div className="nvbh-appointment-card" onClick={() => onViewDetail(appointment.CuocHenID)}>
      <div className="nvbh-appointment-card__header">
        <StatusBadge status={appointment.TrangThai} size="sm" showDot />
        <span className="nvbh-appointment-card__time">
          {formatDate(appointment.ThoiGianHen, 'datetime')}
        </span>
      </div>
      
      <div className="nvbh-appointment-card__body">
        <h3 className="nvbh-appointment-card__customer">
          {appointment.TenKhachHang || 'Khách hàng'}
        </h3>
        <p className="nvbh-appointment-card__room">
          {appointment.TieuDePhong || 'Bất động sản'}
        </p>
        <p className="nvbh-appointment-card__price">
          {formatCurrency(appointment.GiaPhong)}
        </p>
      </div>
      
      <div className="nvbh-appointment-card__actions" onClick={(e) => e.stopPropagation()}>
        {canConfirm && (
          <button
            className="nvbh-appointment-card__btn nvbh-appointment-card__btn--primary"
            onClick={() => onConfirm(appointment.CuocHenID)}
            aria-label="Xác nhận cuộc hẹn"
          >
            Xác nhận
          </button>
        )}
        {canReschedule && (
          <button
            className="nvbh-appointment-card__btn nvbh-appointment-card__btn--secondary"
            onClick={() => onReschedule(appointment.CuocHenID)}
            aria-label="Đổi lịch"
          >
            Đổi lịch
          </button>
        )}
        {canCancel && (
          <button
            className="nvbh-appointment-card__btn nvbh-appointment-card__btn--danger"
            onClick={() => onCancel(appointment.CuocHenID)}
            aria-label="Hủy cuộc hẹn"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
};

export default QuanLyCuocHen;

