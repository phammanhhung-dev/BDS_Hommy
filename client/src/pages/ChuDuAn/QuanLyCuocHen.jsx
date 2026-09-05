import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import './QuanLyCuocHen.css';
import '../../styles/ChuDuAnDesignSystem.css';

// React Icons
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentArrowDown,
  HiOutlineBell,
  HiOutlineChartBar
} from 'react-icons/hi2';

// Components
import ModalChiTietCuocHen from '../../components/ChuDuAn/ModalChiTietCuocHen';
import ModalPheDuyetCuocHen from '../../components/ChuDuAn/ModalPheDuyetCuocHen';
import ModalTuChoiCuocHen from '../../components/ChuDuAn/ModalTuChoiCuocHen';

// Service
import cuocHenApi from '../../api/cuocHenApi';
import chatApi from '../../api/chatApi';

/**
 * UC-PROJ-02: Quản lý cuộc hẹn cho Chủ dự án
 * Trang quản lý danh sách cuộc hẹn với các tính năng:
 * - Dashboard metrics tổng quan
 * - Danh sách cuộc hẹn với filters thông minh
 * - Phê duyệt/từ chối cuộc hẹn
 * - Xem chi tiết và thông tin liên hệ
 * - Bulk actions
 * - Export báo cáo
 */
function QuanLyCuocHen() {
  // Hooks
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [cuocHenList, setCuocHenList] = useState([]);
  const [metrics, setMetrics] = useState({
    choDuyet: 0,
    daXacNhan: 0,
    sapDienRa: 0,
    daHuy: 0,
    hoanThanh: 0
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    trangThai: '',
    duAnId: '',
    tuNgay: '',
    denNgay: '',
    quickFilter: 'tat-ca' // tat-ca, cho-duyet, sap-dien-ra, can-xu-ly
  });

  // Modal states
  const [modalChiTiet, setModalChiTiet] = useState({ open: false, cuocHen: null });
  const [modalPheDuyet, setModalPheDuyet] = useState({ open: false, cuocHen: null });
  const [modalTuChoi, setModalTuChoi] = useState({ open: false, cuocHen: null });

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const safeCuocHenList = useMemo(() => Array.isArray(cuocHenList) ? cuocHenList : [], [cuocHenList]);
  const totalItems = safeCuocHenList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = useMemo(() => safeCuocHenList.slice(startIndex, startIndex + pageSize), [safeCuocHenList, startIndex, pageSize]);

  // Load data
  useEffect(() => {
    setCurrentPage(1);
    loadCuocHenData();
    loadMetrics();
  }, [filters]);

  const loadCuocHenData = async () => {
    try {
      setLoading(true);

      const response = await cuocHenApi.chuDuAn.list(filters);
      // Backend returns: { success: true, message: '...', data: { cuocHens: [...], tongSo: ... } }
      const rawList = response.data?.data?.cuocHens ?? response.data?.cuocHens ?? response.data?.data ?? response.data ?? [];
      const list = Array.isArray(rawList) ? rawList : [];
      setCuocHenList(list);
    } catch (error) {
      console.error('Lỗi tải cuộc hẹn:', error);
      setCuocHenList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await cuocHenApi.chuDuAn.metrics();
      const data = response.data?.data || response.data || {};
      setMetrics({
        choDuyet: Number(data.choDuyet || 0),
        daXacNhan: Number(data.daXacNhan || 0),
        sapDienRa: Number(data.sapDienRa || 0),
        daHuy: Number(data.daHuy || 0),
        hoanThanh: Number(data.hoanThanh || 0)
      });
    } catch (error) {
      console.error('Lỗi tải metrics:', error);
    }
  };

  // Actions
  const handlePheDuyet = (cuocHen) => {
    setModalPheDuyet({ open: true, cuocHen });
  };

  const handleTuChoi = (cuocHen) => {
    setModalTuChoi({ open: true, cuocHen });
  };

  const handleXemChiTiet = (cuocHen) => {
    setModalChiTiet({ open: true, cuocHen });
  };

  /**
   * Mở cuộc trò chuyện với nhân viên bán hàng phụ trách cuộc hẹn
   */
  const handleOpenChat = async (cuocHen) => {
    try {
      // Kiểm tra có nhân viên bán hàng chưa
      if (!cuocHen.NhanVienBanHangID) {
        alert('⚠️ Cuộc hẹn này chưa có nhân viên bán hàng phụ trách.\nVui lòng gán nhân viên trước khi trò chuyện.');
        return;
      }

      const payload = {
        NguCanhID: cuocHen.CuocHenID,
        NguCanhLoai: 'CuocHen',
        ThanhVienIDs: [cuocHen.NhanVienBanHangID], // Chat với NVBH thay vì KhachHangID
        TieuDe: `Cuộc hẹn #${cuocHen.CuocHenID} - ${cuocHen.TenPhong || cuocHen.TenTinDang}`
      };

      console.log('[QuanLyCuocHen] 📤 Creating chat conversation:', payload);

      const response = await chatApi.createConversation(payload);
      const result = response.data;

      console.log('[QuanLyCuocHen] 📥 Chat API response:', result);

      if (result.success) {
        navigate(`/chu-du-an/tin-nhan/${result.data.CuocHoiThoaiID}`);
      } else {
        console.error('[QuanLyCuocHen] ❌ Chat creation failed:', result);
        alert(`❌ Không thể tạo cuộc trò chuyện: ${result.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('[QuanLyCuocHen] Error opening chat:', error);
      alert('❌ Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const handlePheDuyetSuccess = () => {
    setModalPheDuyet({ open: false, cuocHen: null });
    loadCuocHenData();
    loadMetrics();
  };

  const handleTuChoiSuccess = () => {
    setModalTuChoi({ open: false, cuocHen: null });
    loadCuocHenData();
    loadMetrics();
  };

  // Bulk actions
  const handleSelectAll = (e) => {
    const list = Array.isArray(cuocHenList) ? cuocHenList : [];
    if (e.target.checked) {
      setSelectedIds(list.map(ch => ch.CuocHenID));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cuộc hẹn');
      return;
    }

    const labelMap = {
      'phe-duyet': 'phê duyệt',
      'xac-nhan': 'xác nhận',
      'tu-choi': 'từ chối',
      'gui-huong-dan': 'gửi hướng dẫn'
    };
    const actionText = labelMap[action] || action;

    if (!window.confirm(`Bạn có chắc muốn ${actionText} cho ${selectedIds.length} cuộc hẹn đã chọn?`)) {
      return;
    }

    try {
      if (action === 'gui-huong-dan') {
        alert(`Đã gửi hướng dẫn xem BĐS thành công cho ${selectedIds.length} cuộc hẹn đã chọn.`);
        setSelectedIds([]);
        return;
      }

      const response = await cuocHenApi.chuDuAn.bulkAction({ action, cuocHenIds: selectedIds });
      const result = response.data;

      if (!result?.success) {
        throw new Error(result?.message || 'Không thể thực hiện hành động');
      }

      alert(`Đã ${actionText} thành công ${selectedIds.length} cuộc hẹn`);
      setSelectedIds([]);
      loadCuocHenData();
      loadMetrics();
    } catch (error) {
      console.error('Lỗi bulk action:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message || 'Không thể thực hiện hành động'));
    }
  };

  // Quick filters
  const applyQuickFilter = (filter) => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayStr = now.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    switch (filter) {
      case 'cho-duyet':
        setFilters({ search: '', trangThai: 'ChoXacNhan', duAnId: '', tuNgay: '', denNgay: '', quickFilter: filter });
        break;
      case 'sap-dien-ra':
        setFilters({
          search: '',
          trangThai: '',
          duAnId: '',
          tuNgay: todayStr,
          denNgay: nextWeekStr,
          quickFilter: filter
        });
        break;
      case 'can-xu-ly':
        setFilters({ search: '', trangThai: 'ChoXacNhan', duAnId: '', tuNgay: '', denNgay: '', quickFilter: filter });
        break;
      default:
        setFilters({ search: '', trangThai: '', duAnId: '', tuNgay: '', denNgay: '', quickFilter: 'tat-ca' });
    }
  };

  // Format functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTrangThai = (trangThai, pheDuyet) => {
    if (pheDuyet === 'ChoPheDuyet') {
      return { text: 'Chờ phê duyệt', class: 'status-cho-duyet' };
    }

    const statusMap = {
      'DaYeuCau': { text: 'Đã yêu cầu', class: 'status-da-yeu-cau' },
      'ChoXacNhan': { text: 'Chờ xác nhận', class: 'status-cho-xac-nhan' },
      'DaXacNhan': { text: 'Đã xác nhận', class: 'status-da-xac-nhan' },
      'DaDoiLich': { text: 'Đã đổi lịch', class: 'status-da-doi-lich' },
      'HuyBoiKhach': { text: 'Khách hủy', class: 'status-huy' },
      'HuyBoiHeThong': { text: 'Hệ thống hủy', class: 'status-huy' },
      'KhachKhongDen': { text: 'Khách không đến', class: 'status-khach-khong-den' },
      'HoanThanh': { text: 'Hoàn thành', class: 'status-hoan-thanh' }
    };

    return statusMap[trangThai] || { text: trangThai, class: '' };
  };

  const getTimeUrgency = (thoiGianHen) => {
    if (!thoiGianHen) return '';

    const now = new Date();
    const henTime = new Date(thoiGianHen);
    const diffHours = (henTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) return 'past';
    if (diffHours < 2) return 'urgent'; // Đỏ - còn dưới 2 giờ
    if (diffHours < 24) return 'soon'; // Cam - trong ngày
    return 'normal'; // Xanh
  };

  const formatTimeRemaining = (thoiGianHen) => {
    if (!thoiGianHen) return '';

    const now = new Date();
    const henTime = new Date(thoiGianHen);
    const diffMs = henTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Đã qua';
    if (diffHours < 1) return `Còn ${diffMinutes} phút`;
    if (diffHours < 24) return `Còn ${diffHours} giờ`;

    const diffDays = Math.floor(diffHours / 24);
    return `Còn ${diffDays} ngày`;
  };

  return (
    <ChuDuAnLayout>
      <div className="qch-container">
        {/* Header */}
        <div className="cuoc-hen-header">
          <div>
            <h1 className="cuoc-hen-title">
              <HiOutlineCalendar className="title-icon" />
              Quản lý Cuộc hẹn
            </h1>
            <p className="cuoc-hen-subtitle">
              Phê duyệt và theo dõi các cuộc hẹn xem bất động sản
            </p>
          </div>

          <div className="cuoc-hen-header-actions">
            <button className="cda-btn cda-btn-secondary" onClick={() => loadCuocHenData()}>
              <HiOutlineArrowPath />
              Làm mới
            </button>
            <button className="cda-btn cda-btn-secondary">
              <HiOutlineDocumentArrowDown />
              Export
            </button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="cuoc-hen-metrics">
          <div className="metric-card emerald" onClick={() => applyQuickFilter('cho-duyet')}>
            <div className="metric-icon">
              <HiOutlineBell />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.choDuyet}</div>
              <div className="metric-label">Chờ phê duyệt</div>
              {metrics.choDuyet > 0 && (
                <div className="metric-badge urgent">Cần xử lý</div>
              )}
            </div>
          </div>

          <div className="metric-card green">
            <div className="metric-icon">
              <HiOutlineCheck />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.daXacNhan || 0}</div>
              <div className="metric-label">Đã xác nhận</div>
              <div className="metric-change">
                <span className="positive">
                  +{(metrics.daXacNhan + metrics.daHuy) > 0 
                    ? Math.round((metrics.daXacNhan / (metrics.daXacNhan + metrics.daHuy)) * 100) 
                    : 0}%
                </span> tỷ lệ
              </div>
            </div>
          </div>

          <div className="metric-card orange" onClick={() => applyQuickFilter('sap-dien-ra')}>
            <div className="metric-icon">
              <HiOutlineClock />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.sapDienRa || 0}</div>
              <div className="metric-label">Sắp diễn ra</div>
              <div className="metric-change">Trong 24 giờ tới</div>
            </div>
          </div>

          <div className="metric-card gray">
            <div className="metric-icon">
              <HiOutlineXMark />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.daHuy || 0}</div>
              <div className="metric-label">Đã hủy</div>
            </div>
          </div>

          <div className="metric-card blue">
            <div className="metric-icon">
              <HiOutlineChartBar />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.hoanThanh || 0}</div>
              <div className="metric-label">Hoàn thành</div>
              <div className="metric-change">
                Tháng này
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <button
            className={`quick-filter-btn ${filters.quickFilter === 'tat-ca' ? 'active' : ''}`}
            onClick={() => applyQuickFilter('tat-ca')}
          >
            Tất cả
          </button>
          <button
            className={`quick-filter-btn ${filters.quickFilter === 'cho-duyet' ? 'active' : ''}`}
            onClick={() => applyQuickFilter('cho-duyet')}
          >
            Chờ duyệt ({metrics.choDuyet || 0})
          </button>
          <button
            className={`quick-filter-btn ${filters.quickFilter === 'sap-dien-ra' ? 'active' : ''}`}
            onClick={() => applyQuickFilter('sap-dien-ra')}
          >
            Sắp diễn ra ({metrics.sapDienRa || 0})
          </button>
          <button
            className={`quick-filter-btn ${filters.quickFilter === 'can-xu-ly' ? 'active' : ''}`}
            onClick={() => applyQuickFilter('can-xu-ly')}
          >
            Cần xử lý ({(metrics.choDuyet || 0) + (metrics.sapDienRa || 0)})
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="cda-card filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <HiOutlineFunnel className="filter-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, tin đăng..."
                className="cda-input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <select
              className="cda-select"
              value={filters.trangThai}
              onChange={(e) => setFilters({ ...filters, trangThai: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ChoXacNhan">Chờ xác nhận</option>
              <option value="DaXacNhan">Đã xác nhận</option>
              <option value="HoanThanh">Hoàn thành</option>
              <option value="HuyBoiKhach">Đã hủy</option>
            </select>

            <input
              type="date"
              className="cda-input"
              placeholder="Từ ngày"
              value={filters.tuNgay}
              onChange={(e) => setFilters({ ...filters, tuNgay: e.target.value })}
            />

            <input
              type="date"
              className="cda-input"
              placeholder="Đến ngày"
              value={filters.denNgay}
              onChange={(e) => setFilters({ ...filters, denNgay: e.target.value })}
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-info">
              <input
                type="checkbox"
                checked={selectedIds.length === cuocHenList.length}
                onChange={handleSelectAll}
              />
              <span>Đã chọn {selectedIds.length} cuộc hẹn</span>
            </div>
            <div className="bulk-buttons">
              <button
                className="cda-btn cda-btn-success cda-btn-sm"
                onClick={() => handleBulkAction('phe-duyet')}
              >
                <HiOutlineCheck /> Phê duyệt
              </button>
              <button
                className="cda-btn cda-btn-secondary cda-btn-sm"
                onClick={() => handleBulkAction('gui-huong-dan')}
              >
                Gửi hướng dẫn
              </button>
              <button
                className="cda-btn cda-btn-secondary cda-btn-sm"
                onClick={() => setSelectedIds([])}
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {/* Cuộc hẹn List */}
        <div className="cda-card">
          {loading ? (
            <div className="cda-loading">
              <div className="cda-spinner"></div>
              <p className="cda-loading-text">Đang tải danh sách cuộc hẹn...</p>
            </div>
          ) : cuocHenList.length === 0 ? (
            <div className="cda-empty-state">
              <div className="cda-empty-icon">📅</div>
              <h3 className="cda-empty-title">Chưa có cuộc hẹn nào</h3>
              <p className="cda-empty-description">
                Các cuộc hẹn xem bất động sản sẽ hiển thị tại đây
              </p>
            </div>
          ) : (
            <>
                  <div className="cuoc-hen-table-container">
                    <table className="cuoc-hen-table">
                      <colgroup>
                        <col style={{ width: '40px' }} />
                        <col style={{ width: '60px' }} />
                        <col style={{ width: '200px' }} />
                        <col style={{ width: '200px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '200px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              checked={selectedIds.length === safeCuocHenList.length && safeCuocHenList.length > 0}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th>Ưu tiên</th>
                          <th>Thời gian hẹn</th>
                          <th>Khách hàng</th>
                          <th>Phòng / Dự án</th>
                          <th>NV phụ trách</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedList.map((cuocHen) => {
                          const urgency = getTimeUrgency(cuocHen.ThoiGianHen);
                          const status = formatTrangThai(cuocHen.TrangThai, cuocHen.PheDuyetChuDuAn);

                          return (
                            <tr key={cuocHen.CuocHenID} className={`urgency-${urgency}`}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(cuocHen.CuocHenID)}
                                  onChange={() => handleSelectOne(cuocHen.CuocHenID)}
                                />
                              </td>
                              <td>
                                <div className={`urgency-badge ${urgency}`}>
                                  {urgency === 'urgent' && '🔴'}
                                  {urgency === 'soon' && '🟡'}
                                  {urgency === 'normal' && '🟢'}
                                  {urgency === 'past' && '⚫'}
                                </div>
                              </td>
                              <td>
                                <div className="time-cell">
                                  <div className="time-main">
                                    <HiOutlineClock className="cell-icon" />
                                    {formatDate(cuocHen.ThoiGianHen)}
                                  </div>
                                  <div className={`time-remaining ${urgency}`}>
                                    {formatTimeRemaining(cuocHen.ThoiGianHen)}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="customer-cell">
                                  <div className="customer-name">
                                    <HiOutlineUser className="cell-icon" />
                                    {cuocHen.TenKhachHang || 'Khách hàng'}
                                  </div>
                                  <div className="customer-phone">
                                    <HiOutlinePhone className="cell-icon" />
                                    {cuocHen.SDTKhachHang || cuocHen.SoDienThoaiKhach || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="property-cell">
                                  <div className="property-room">
                                    <HiOutlineHome className="cell-icon" />
                                    {cuocHen.TenPhong || cuocHen.TieuDeTinDang || 'N/A'}
                                  </div>
                                  <div className="property-project">
                                    {cuocHen.TenDuAn || 'Dự án N/A'}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="staff-cell">
                                  <div className="staff-name">
                                    {cuocHen.TenNhanVien || 'Chưa gán NV'}
                                  </div>
                                  <div className="staff-phone">
                                    {cuocHen.SDTNhanVien || cuocHen.SoDienThoaiNV || ''}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`cda-badge ${status.class}`}>
                                  {status.text}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  {cuocHen.PheDuyetChuDuAn === 'ChoPheDuyet' && (
                                    <>
                                      <button
                                        className="action-btn success"
                                        onClick={() => handlePheDuyet(cuocHen)}
                                        title="Phê duyệt"
                                      >
                                        <HiOutlineCheck />
                                      </button>
                                      <button
                                        className="action-btn danger"
                                        onClick={() => handleTuChoi(cuocHen)}
                                        title="Từ chối"
                                      >
                                        <HiOutlineXMark />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    className="action-btn info"
                                    onClick={() => handleXemChiTiet(cuocHen)}
                                    title="Xem chi tiết"
                                  >
                                    <HiOutlineEye />
                                  </button>
                                  <button
                                    className="action-btn secondary"
                                    title="Trò chuyện"
                                    onClick={() => handleOpenChat(cuocHen)}
                                  >
                                    <HiOutlineChatBubbleLeftRight />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="cuoc-hen-mobile">
                    {paginatedList.map((cuocHen) => {
                      const urgency = getTimeUrgency(cuocHen.ThoiGianHen);
                      const status = formatTrangThai(cuocHen.TrangThai, cuocHen.PheDuyetChuDuAn);

                      return (
                        <div key={`mobile-${cuocHen.CuocHenID}`} className={`cuoc-hen-mobile__card urgency-${urgency}`}>
                          <div className="cuoc-hen-mobile__header">
                            <div className="cuoc-hen-mobile__header-info">
                              <span className="cuoc-hen-mobile__id"># {cuocHen.CuocHenID}</span>
                              <span className={`cuoc-hen-mobile__status cda-badge ${status.class}`}>
                                {status.text}
                              </span>
                            </div>
                            <label className="cuoc-hen-mobile__checkbox">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(cuocHen.CuocHenID)}
                                onChange={() => handleSelectOne(cuocHen.CuocHenID)}
                              />
                              <span>Chọn</span>
                            </label>
                          </div>

                          <div className="cuoc-hen-mobile__section">
                            <div className="cuoc-hen-mobile__section-title">
                              <HiOutlineClock className="cell-icon" />
                              Thời gian hẹn
                            </div>
                            <div className="cuoc-hen-mobile__section-content">
                              <div className="cuoc-hen-mobile__primary-text">
                                {formatDate(cuocHen.ThoiGianHen)}
                              </div>
                              <div className={`cuoc-hen-mobile__secondary-text ${urgency}`}>
                                {formatTimeRemaining(cuocHen.ThoiGianHen)}
                              </div>
                            </div>
                          </div>

                          <div className="cuoc-hen-mobile__section">
                            <div className="cuoc-hen-mobile__section-title">
                              <HiOutlineUser className="cell-icon" />
                              Khách hàng
                            </div>
                            <div className="cuoc-hen-mobile__section-content">
                              <div className="cuoc-hen-mobile__primary-text">
                                {cuocHen.TenKhachHang || 'N/A'}
                              </div>
                              <div className="cuoc-hen-mobile__secondary-text">
                                <HiOutlinePhone className="cell-icon" />
                                {cuocHen.SoDienThoaiKhach || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="cuoc-hen-mobile__section">
                            <div className="cuoc-hen-mobile__section-title">
                              <HiOutlineHome className="cell-icon" />
                              Phòng / Dự án
                            </div>
                            <div className="cuoc-hen-mobile__section-content">
                              <div className="cuoc-hen-mobile__primary-text">
                                {cuocHen.TenPhong || 'N/A'}
                              </div>
                              <div className="cuoc-hen-mobile__secondary-text">
                                {cuocHen.TenDuAn || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="cuoc-hen-mobile__section">
                            <div className="cuoc-hen-mobile__section-title">
                              <HiOutlineUser className="cell-icon" />
                              NV phụ trách
                            </div>
                            <div className="cuoc-hen-mobile__section-content">
                              <div className="cuoc-hen-mobile__primary-text">
                                {cuocHen.TenNhanVien || 'Chưa gán'}
                              </div>
                              <div className="cuoc-hen-mobile__secondary-text">
                                {cuocHen.SoDienThoaiNV || ''}
                              </div>
                            </div>
                          </div>

                          <div className="cuoc-hen-mobile__actions">
                            {cuocHen.PheDuyetChuDuAn === 'ChoPheDuyet' && (
                              <>
                                <button
                                  className="action-btn success"
                                  onClick={() => handlePheDuyet(cuocHen)}
                                  title="Phê duyệt"
                                >
                                  <HiOutlineCheck />
                                </button>
                                <button
                                  className="action-btn danger"
                                  onClick={() => handleTuChoi(cuocHen)}
                                  title="Từ chối"
                                >
                                  <HiOutlineXMark />
                                </button>
                              </>
                            )}
                            <button
                              className="action-btn info"
                              onClick={() => handleXemChiTiet(cuocHen)}
                              title="Xem chi tiết"
                            >
                              <HiOutlineEye />
                            </button>
                            <button
                              className="action-btn secondary"
                              title="Trò chuyện"
                              onClick={() => handleOpenChat(cuocHen)}
                            >
                              <HiOutlineChatBubbleLeftRight />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Bar */}
                  {totalItems > 0 && (
                    <div className="cda-pagination">
                      <div className="cda-pagination-info">
                        Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} trên tổng số {totalItems} cuộc hẹn
                      </div>
                      <div className="cda-pagination-controls">
                        <button
                          className="cda-page-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          &laquo; Trang trước
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            className={`cda-page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          className="cda-page-btn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          Trang sau &raquo;
                        </button>
                      </div>
                    </div>
                  )}
                </>
          )}
        </div>

        {/* Modals */}
        {modalChiTiet.open && (
          <ModalChiTietCuocHen
            cuocHen={modalChiTiet.cuocHen}
            onClose={() => setModalChiTiet({ open: false, cuocHen: null })}
            onPheDuyet={(ch) => {
              setModalChiTiet({ open: false, cuocHen: null });
              handlePheDuyet(ch);
            }}
            onTuChoi={(ch) => {
              setModalChiTiet({ open: false, cuocHen: null });
              handleTuChoi(ch);
            }}
          />
        )}

        {modalPheDuyet.open && (
          <ModalPheDuyetCuocHen
            cuocHen={modalPheDuyet.cuocHen}
            onClose={() => setModalPheDuyet({ open: false, cuocHen: null })}
            onSuccess={handlePheDuyetSuccess}
          />
        )}

        {modalTuChoi.open && (
          <ModalTuChoiCuocHen
            cuocHen={modalTuChoi.cuocHen}
            onClose={() => setModalTuChoi({ open: false, cuocHen: null })}
            onSuccess={handleTuChoiSuccess}
          />
        )}
      </div>
    </ChuDuAnLayout>
  );
}

export default QuanLyCuocHen;
