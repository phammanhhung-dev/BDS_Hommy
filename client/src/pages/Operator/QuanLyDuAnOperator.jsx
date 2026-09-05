import { useState, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import OperatorLayout from '../../layouts/OperatorLayout';
import TableOperator from '../../components/Operator/shared/TableOperator';
import FilterPanelOperator from '../../components/Operator/shared/FilterPanelOperator';
import BadgeStatusOperator from '../../components/Operator/shared/BadgeStatusOperator';
import ModalTamNgungDuAn from './modals/ModalTamNgungDuAn';
import ModalDuyetHoaHong from './modals/ModalDuyetHoaHong';
import { operatorApi } from '../../api/operatorApi';
import './QuanLyDuAnOperator.css';
import { useOperatorPageSEO } from './seo';

/**
 * UC-OPER-02: Quản lý Dự án
 * Operator quản lý và tạm ngưng hoạt động các dự án
 */
const QuanLyDuAnOperator = () => {
  useOperatorPageSEO({
    title: 'Quản lý dự án',
    description: 'Quản lý danh sách dự án của NVDH, theo dõi trạng thái hoạt động, hoa hồng và thao tác xử lý nhanh.',
    keywords: 'quản lý dự án, nvdh, dự án bất động sản, hoa hồng dự án, trạng thái dự án',
    canonicalPath: '/nvdh/du-an',
  });

  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState({
    keyword: '',
    trangThai: '',
    trangThaiDuyetHoaHong: '',
    page: 1,
    limit: 10
  });
  
  const [selectedDuAn, setSelectedDuAn] = useState(null);
  const [modalTamNgungOpen, setModalTamNgungOpen] = useState(false);
  const [modalDuyetHoaHongOpen, setModalDuyetHoaHongOpen] = useState(false);

  // Query danh sách dự án với infinite scroll
  const {
    data: duAnPages,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage
  } = useInfiniteQuery({
    queryKey: ['duAnOperator', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await operatorApi.duAn.getDanhSach({ ...filters, page: pageParam });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      if (typeof lastPage.page === 'number' && typeof lastPage.totalPages === 'number') {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      }
      return undefined;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2
  });

  const duAnRows = useMemo(() => {
    return duAnPages?.pages?.flatMap((page) => page.data || page.items || []) || [];
  }, [duAnPages]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleTamNgung = (duAn) => {
    setSelectedDuAn(duAn);
    setModalTamNgungOpen(true);
  };

  const handleTamNgungSuccess = () => {
    setModalTamNgungOpen(false);
    setSelectedDuAn(null);
    queryClient.invalidateQueries(['duAnOperator']);
    queryClient.invalidateQueries(['dashboardOperator']);
  };

  const handleXuLyYeuCau = async (duAnId) => {
    // Navigate to detail or open modal for request handling
    alert(`Xử lý yêu cầu mở lại dự án #${duAnId}`);
    // TODO: Implement request handling flow
  };

  const handleDuyetHoaHong = (duAn) => {
    setSelectedDuAn(duAn);
    setModalDuyetHoaHongOpen(true);
  };

  const handleDuyetHoaHongSuccess = () => {
    setModalDuyetHoaHongOpen(false);
    setSelectedDuAn(null);
    queryClient.invalidateQueries(['duAnOperator']);
    queryClient.invalidateQueries(['dashboardOperator']);
  };

  // Table columns
  const columns = [
    {
      key: 'DuAnID',
      label: 'ID',
      width: '80px',
      align: 'center',
      render: (row) => (
        <div className="quan-ly-du-an__cell-id">
          #{row.DuAnID}
        </div>
      )
    },
    {
      key: 'TenDuAn',
      label: 'Tên dự án',
      width: '250px',
      render: (row) => (
        <div className="quan-ly-du-an__ten-du-an">
          <div className="quan-ly-du-an__ten">{row.TenDuAn}</div>
          <div className="quan-ly-du-an__dia-chi">{row.DiaChi}</div>
        </div>
      )
    },
    {
      key: 'ChuDuAn',
      label: 'Chủ dự án',
      width: '200px',
      render: (row) => (
        <div className="quan-ly-du-an__chu-du-an">
          <div className="quan-ly-du-an__ten-chu">{row.TenChuDuAn}</div>
          <div className="quan-ly-du-an__email">{row.EmailChuDuAn}</div>
        </div>
      )
    },
    {
      key: 'TrangThai',
      label: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (row) => (
        <BadgeStatusOperator
          status={row.TrangThai}
          statusMap={{
            'HoatDong': { label: 'Hoạt động', variant: 'success' },
            'NgungHoatDong': { label: 'Ngưng hoạt động', variant: 'danger' },
            'TamNgung': { label: 'Tạm ngưng', variant: 'warning' }
          }}
        />
      )
    },
    {
      key: 'HoaHong',
      label: 'Hoa hồng',
      width: '220px',
      render: (row) => {
        if (!row.BangHoaHong) {
          return (
            <span className="quan-ly-du-an__hoa-hong-empty">
              Chưa cấu hình
            </span>
          );
        }
        
        const trangThaiMap = {
          'ChoDuyet': { label: 'Chờ duyệt', variant: 'warning' },
          'DaDuyet': { label: 'Đã duyệt', variant: 'success' },
          'TuChoi': { label: 'Từ chối', variant: 'danger' }
        };
        
        // Parse BangHoaHong từ JSON
        let bangHoaHongArray = [];
        try {
          if (typeof row.BangHoaHong === 'string') {
            bangHoaHongArray = JSON.parse(row.BangHoaHong);
          } else if (Array.isArray(row.BangHoaHong)) {
            bangHoaHongArray = row.BangHoaHong;
          }
        } catch {
          // Nếu không parse được, hiển thị raw
          bangHoaHongArray = null;
        }
        
        return (
          <div className="quan-ly-du-an__hoa-hong">
            <BadgeStatusOperator
              status={row.TrangThaiDuyetHoaHong || 'ChoDuyet'}
              statusMap={trangThaiMap}
            />
            <div className="quan-ly-du-an__hoa-hong-list">
              {Array.isArray(bangHoaHongArray) && bangHoaHongArray.length > 0 ? (
                bangHoaHongArray.map((muc, idx) => (
                  <div key={idx} className="quan-ly-du-an__hoa-hong-item">
                    <span className="quan-ly-du-an__hoa-hong-thang">
                      {muc.soThang || muc.SoThang} tháng:
                    </span>
                    <span className="quan-ly-du-an__hoa-hong-value">
                      {muc.tyLe || muc.TyLe}%
                    </span>
                  </div>
                ))
              ) : (
                <span className="quan-ly-du-an__hoa-hong-value">
                  {row.BangHoaHong}
                </span>
              )}
            </div>
            {row.SoThangCocToiThieu && (
              <div className="quan-ly-du-an__hoa-hong-coc">
                Cọc tối thiểu: {row.SoThangCocToiThieu} tháng
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'SoTinDang',
      label: 'Số tin đăng',
      width: '120px',
      align: 'center',
      render: (row) => (
        <div className="quan-ly-du-an__so-tin-dang quan-ly-du-an__cell-center">
          <span className="quan-ly-du-an__so-tin-dang-value">
            {row.SoTinDang || 0}
          </span>
          <span className="quan-ly-du-an__so-tin-dang-label">tin</span>
        </div>
      )
    },
    {
      key: 'TaoLuc',
      label: 'Ngày tạo',
      width: '140px',
      align: 'center',
      render: (row) => (
        <div className="quan-ly-du-an__cell-center">
          {new Date(row.TaoLuc).toLocaleDateString('vi-VN')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '150px',
      align: 'center',
      render: (row) => (
        <div className="quan-ly-du-an__actions">
          {/* Nút duyệt hoa hồng - hiển thị nếu có BangHoaHong và chưa duyệt */}
          {row.BangHoaHong && (!row.TrangThaiDuyetHoaHong || row.TrangThaiDuyetHoaHong === 'ChoDuyet') && (
            <button
              className="operator-btn operator-btn--sm operator-btn--success quan-ly-du-an__btn-duyet"
              onClick={() => handleDuyetHoaHong(row)}
            >
              💰 Duyệt hoa hồng
            </button>
          )}
          {/* Nút xem lại hoa hồng đã duyệt */}
          {row.BangHoaHong && row.TrangThaiDuyetHoaHong === 'DaDuyet' && (
            <button
              className="operator-btn operator-btn--sm operator-btn--outline-success"
              onClick={() => handleDuyetHoaHong(row)}
              title="Xem lại thông tin hoa hồng đã duyệt"
            >
              ✅ Đã duyệt
            </button>
          )}
          {row.TrangThai === 'HoatDong' && (
            <button
              className="operator-btn operator-btn--sm operator-btn--warning"
              onClick={() => handleTamNgung(row)}
            >
              ⏸️ Tạm ngưng
            </button>
          )}
          {row.YeuCauMoLai === 'DaGui' && (
            <button
              className="operator-btn operator-btn--sm operator-btn--primary"
              onClick={() => handleXuLyYeuCau(row.DuAnID)}
            >
              📋 Xử lý yêu cầu
            </button>
          )}
          <button
            className="operator-btn operator-btn--sm operator-btn--secondary"
            onClick={() => alert(`Chi tiết dự án #${row.DuAnID}`)}
          >
            👁️ Chi tiết
          </button>
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
      placeholder: 'Tên dự án, chủ dự án...',
      value: filters.keyword
    },
    {
      type: 'select',
      name: 'trangThai',
      label: 'Trạng thái',
      value: filters.trangThai,
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'HoatDong', label: 'Hoạt động' },
        { value: 'NgungHoatDong', label: 'Ngưng hoạt động' },
        { value: 'TamNgung', label: 'Tạm ngưng' }
      ]
    },
    {
      type: 'select',
      name: 'trangThaiDuyetHoaHong',
      label: 'Trạng thái hoa hồng',
      value: filters.trangThaiDuyetHoaHong || '',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'ChoDuyet', label: 'Chờ duyệt' },
        { value: 'DaDuyet', label: 'Đã duyệt' },
        { value: 'TuChoi', label: 'Từ chối' }
      ]
    }
  ];

  const stats = duAnRows.length ? {
    hoatDong: duAnRows.filter(d => d.TrangThai === 'HoatDong').length,
    tamNgung: duAnRows.filter(d => d.TrangThai === 'TamNgung').length,
    ngungHoatDong: duAnRows.filter(d => d.TrangThai === 'NgungHoatDong').length,
    coYeuCau: duAnRows.filter(d => d.YeuCauMoLai === 'DaGui').length
  } : null;

  return (
    <OperatorLayout>
      <div className="quan-ly-du-an">
        {/* Header */}
        <div className="quan-ly-du-an__header">
          <div className="quan-ly-du-an__title-section">
            <h1 className="quan-ly-du-an__title">🏢 Quản lý Dự án</h1>
            <p className="quan-ly-du-an__subtitle">
              Quản lý và giám sát các dự án trên hệ thống
            </p>
          </div>
          
          {/* Quick Stats */}
          {stats && (
            <div className="quan-ly-du-an__stats">
              <div className="quan-ly-du-an__stat-item quan-ly-du-an__stat-item--success">
                <div className="quan-ly-du-an__stat-value">{stats.hoatDong}</div>
                <div className="quan-ly-du-an__stat-label">Hoạt động</div>
              </div>
              <div className="quan-ly-du-an__stat-item quan-ly-du-an__stat-item--warning">
                <div className="quan-ly-du-an__stat-value">{stats.tamNgung}</div>
                <div className="quan-ly-du-an__stat-label">Tạm ngưng</div>
              </div>
              <div className="quan-ly-du-an__stat-item quan-ly-du-an__stat-item--danger">
                <div className="quan-ly-du-an__stat-value">{stats.ngungHoatDong}</div>
                <div className="quan-ly-du-an__stat-label">Ngưng hoạt động</div>
              </div>
              {stats.coYeuCau > 0 && (
                <div className="quan-ly-du-an__stat-item quan-ly-du-an__stat-item--primary">
                  <div className="quan-ly-du-an__stat-value">{stats.coYeuCau}</div>
                  <div className="quan-ly-du-an__stat-label">Có yêu cầu</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className="quan-ly-du-an__toolbar">
          <FilterPanelOperator
            fields={filterFields}
            onApply={handleFilterChange}
            onReset={() => setFilters({
              keyword: '',
              trangThai: '',
              trangThaiDuyetHoaHong: '',
              page: 1,
              limit: 10
            })}
          />
        </div>

        {/* Table */}
        <div className="quan-ly-du-an__content">
          {error ? (
            <div className="quan-ly-du-an__error">
              ❌ Lỗi tải dữ liệu: {error.message}
            </div>
          ) : (
            <TableOperator
              columns={columns}
              data={duAnRows}
              isLoading={isLoading}
              loadingMore={isFetchingNextPage}
              onScrollEnd={handleLoadMore}
              emptyMessage="Không có dự án nào"
            />
          )}
        </div>

        {/* Modals */}
        {modalTamNgungOpen && selectedDuAn && (
          <ModalTamNgungDuAn
            duAnId={selectedDuAn.DuAnID}
            tenDuAn={selectedDuAn.TenDuAn}
            onClose={() => {
              setModalTamNgungOpen(false);
              setSelectedDuAn(null);
            }}
            onSuccess={handleTamNgungSuccess}
          />
        )}

        {modalDuyetHoaHongOpen && selectedDuAn && (
          <ModalDuyetHoaHong
            duAnId={selectedDuAn.DuAnID}
            duAn={selectedDuAn}
            onClose={() => {
              setModalDuyetHoaHongOpen(false);
              setSelectedDuAn(null);
            }}
            onSuccess={handleDuyetHoaHongSuccess}
          />
        )}
      </div>
    </OperatorLayout>
  );
};

export default QuanLyDuAnOperator;






