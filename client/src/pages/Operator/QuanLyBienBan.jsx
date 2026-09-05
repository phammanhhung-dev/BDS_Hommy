import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OperatorLayout from '../../layouts/OperatorLayout';
import TableNVDH from '../../components/Operator/shared/TableOperator';
import FilterPanelNVDH from '../../components/Operator/shared/FilterPanelOperator';
import BadgeStatusNVDH from '../../components/Operator/shared/BadgeStatusOperator';
import ModalTaoBienBan from './modals/ModalTaoBienBan';
import ModalKyBienBan from './modals/ModalKyBienBan';
import ModalChiTietBienBan from './modals/ModalChiTietBienBan';
import { nvdhApi } from '../../api/operatorApi';
import './QuanLyBienBan.css';
import { useOperatorPageSEO } from './seo';

/**
 * UC-OPER-06: Quản lý Biên bản Bàn giao
 * Operator tạo, ký và quản lý biên bản bàn giao
 */
const QuanLyBienBan = () => {
  useOperatorPageSEO({
    title: 'Quản lý biên bản',
    description: 'Tạo, ký và quản lý biên bản bàn giao phòng cho NVDH với danh sách trạng thái rõ ràng và thao tác nhanh.',
    keywords: 'quản lý biên bản, nvdh, biên bản bàn giao, ký biên bản, quản lý phòng bàn giao',
    canonicalPath: '/nvdh/bien-ban',
  });

  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState({
    keyword: '',
    nhanVienId: '',
    trangThai: '',
    page: 1,
    limit: 20
  });
  
  const [selectedBienBan, setSelectedBienBan] = useState(null);
  const [modalTaoOpen, setModalTaoOpen] = useState(false);
  const [modalKyOpen, setModalKyOpen] = useState(false);
  const [modalChiTietOpen, setModalChiTietOpen] = useState(false);

  // Query danh sách biên bản
  const { data: bienBanData, isLoading, error } = useQuery({
    queryKey: ['bienBanOperator', filters],
    queryFn: async () => {
      const response = await nvdhApi.bienBan.getDanhSach(filters);
      const payload = response.data?.data || response.data || [];
      return {
        data: Array.isArray(payload) ? payload : [],
        total: response.data?.total || payload.length || 0,
        totalPages: response.data?.totalPages || 1
      };
    },
    keepPreviousData: true
  });

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleTaoMoi = () => {
    setModalTaoOpen(true);
  };

  const handleKy = (bienBan) => {
    setSelectedBienBan(bienBan);
    setModalKyOpen(true);
  };

  const handleXemChiTiet = (bienBan) => {
    setSelectedBienBan(bienBan);
    setModalChiTietOpen(true);
  };

  const handleSuccess = () => {
    setModalTaoOpen(false);
    setModalKyOpen(false);
    setModalChiTietOpen(false);
    setSelectedBienBan(null);
    queryClient.invalidateQueries(['bienBanOperator']);
    queryClient.invalidateQueries(['dashboardOperator']);
  };

  // Table columns
  const columns = [
    {
      key: 'BienBanID',
      label: 'Mã BB',
      width: '100px',
      align: 'center',
      render: (row) => (
        <div style={{ paddingLeft: '8px' }}>
          BB-{row.BienBanID}
        </div>
      )
    },
    {
      key: 'KhachHang',
      label: 'Khách hàng',
      width: '180px',
      render: (row) => (
        <div className="quan-ly-bien-ban__khach-hang">
          <div className="quan-ly-bien-ban__ten-khach">{row.TenKhachHang}</div>
          <div className="quan-ly-bien-ban__sdt-khach">{row.SoDienThoaiKhach}</div>
        </div>
      )
    },
    {
      key: 'NhanVien',
      label: 'NVBH',
      width: '160px',
      render: (row) => row.TenNVBH || 'N/A'
    },
    {
      key: 'PhongDuAn',
      label: 'Phòng/Dự án',
      width: '200px',
      render: (row) => (
        <div className="quan-ly-bien-ban__phong-du-an">
          <div className="quan-ly-bien-ban__ten-phong">{row.TenPhong}</div>
          <div className="quan-ly-bien-ban__ten-du-an">{row.TenDuAn}</div>
        </div>
      )
    },
    {
      key: 'NgayTao',
      label: 'Ngày tạo',
      width: '130px',
      align: 'center',
      render: (row) => new Date(row.TaoLuc).toLocaleDateString('vi-VN')
    },
    {
      key: 'TrangThai',
      label: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (row) => (
        <BadgeStatusNVDH
          status={row.TrangThai}
          statusMap={{
            'ChuaBanGiao': { label: 'Chưa bàn giao', variant: 'warning' },
            'DaBanGiao': { label: 'Đã bàn giao', variant: 'success' },
            'DaHuy': { label: 'Đã hủy', variant: 'danger' }
          }}
        />
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '240px',
      align: 'right',
      render: (row) => (
        <div className="quan-ly-bien-ban__actions">
          <button
            className="operator-btn operator-btn--sm operator-btn--primary"
            onClick={() => handleXemChiTiet(row)}
          >
            👁️ Chi tiết
          </button>
          {row.TrangThai === 'ChuaBanGiao' && (
            <button
              className="operator-btn operator-btn--sm operator-btn--success"
              onClick={() => handleKy(row)}
            >
              ✍️ Ký BB
            </button>
          )}
        </div>
      )
    }
  ];

  // Filter fields
  const filterFields = [
    {
      type: 'text',
      name: 'keyword',
      label: 'Tìm kiếm',
      placeholder: 'Mã BB, khách hàng...',
      value: filters.keyword
    },
    {
      type: 'select',
      name: 'trangThai',
      label: 'Trạng thái',
      value: filters.trangThai,
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'ChuaBanGiao', label: 'Chưa bàn giao' },
        { value: 'DaBanGiao', label: 'Đã bàn giao' },
        { value: 'DaHuy', label: 'Đã hủy' }
      ]
    }
  ];

  // Stats
  const stats = bienBanData?.data ? {
    chuaBanGiao: bienBanData.data.filter(bb => bb.TrangThai === 'ChuaBanGiao').length,
    daBanGiao: bienBanData.data.filter(bb => bb.TrangThai === 'DaBanGiao').length,
    daHuy: bienBanData.data.filter(bb => bb.TrangThai === 'DaHuy').length
  } : null;

  return (
    <OperatorLayout>
      <div className="quan-ly-bien-ban">
        {/* Header */}
        <div className="quan-ly-bien-ban__header">
          <div className="quan-ly-bien-ban__title-section">
            <h1 className="quan-ly-bien-ban__title">📋 Quản lý Biên bản</h1>
            <p className="quan-ly-bien-ban__subtitle">
              Quản lý biên bản bàn giao phòng
            </p>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="quan-ly-bien-ban__stats">
              <div className="quan-ly-bien-ban__stat-item quan-ly-bien-ban__stat-item--warning">
                <div className="quan-ly-bien-ban__stat-value">{stats.chuaBanGiao}</div>
                <div className="quan-ly-bien-ban__stat-label">Chưa bàn giao</div>
              </div>
              <div className="quan-ly-bien-ban__stat-item quan-ly-bien-ban__stat-item--success">
                <div className="quan-ly-bien-ban__stat-value">{stats.daBanGiao}</div>
                <div className="quan-ly-bien-ban__stat-label">Đã bàn giao</div>
              </div>
              <div className="quan-ly-bien-ban__stat-item quan-ly-bien-ban__stat-item--danger">
                <div className="quan-ly-bien-ban__stat-value">{stats.daHuy}</div>
                <div className="quan-ly-bien-ban__stat-label">Đã hủy</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            className="operator-btn operator-btn--primary"
            onClick={handleTaoMoi}
          >
            ➕ Tạo Biên bản mới
          </button>
        </div>

        {/* Filter Panel */}
        <FilterPanelNVDH
          fields={filterFields}
          onFilterChange={handleFilterChange}
          onReset={() => setFilters({
            keyword: '',
            nhanVienId: '',
            trangThai: '',
            page: 1,
            limit: 20
          })}
        />

        {/* Table */}
        <div className="quan-ly-bien-ban__content">
          {error ? (
            <div className="quan-ly-bien-ban__error">
              ❌ Lỗi tải dữ liệu: {error.message}
            </div>
          ) : (
            <TableNVDH
              columns={columns}
              data={bienBanData?.data || []}
              isLoading={isLoading}
              pagination={{
                currentPage: filters.page,
                totalPages: bienBanData?.totalPages || 1,
                total: bienBanData?.total || 0,
                limit: filters.limit,
                onPageChange: handlePageChange
              }}
              emptyMessage="Chưa có biên bản nào"
            />
          )}
        </div>

        {/* Modals */}
        {modalTaoOpen && (
          <ModalTaoBienBan
            onClose={() => setModalTaoOpen(false)}
            onSuccess={handleSuccess}
          />
        )}

        {modalKyOpen && selectedBienBan && (
          <ModalKyBienBan
            bienBanId={selectedBienBan.BienBanID}
            bienBan={selectedBienBan}
            onClose={() => {
              setModalKyOpen(false);
              setSelectedBienBan(null);
            }}
            onSuccess={handleSuccess}
          />
        )}

        {modalChiTietOpen && selectedBienBan && (
          <ModalChiTietBienBan
            bienBanId={selectedBienBan.BienBanID}
            onClose={() => {
              setModalChiTietOpen(false);
              setSelectedBienBan(null);
            }}
          />
        )}
      </div>
    </OperatorLayout>
  );
};

export default QuanLyBienBan;






