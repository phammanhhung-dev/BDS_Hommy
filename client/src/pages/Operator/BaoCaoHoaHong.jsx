import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import OperatorLayout from '../../layouts/OperatorLayout';
import TableOperator from '../../components/Operator/shared/TableOperator';
import FilterPanelOperator from '../../components/Operator/shared/FilterPanelOperator';
import BadgeStatusOperator from '../../components/Operator/shared/BadgeStatusOperator';
import { operatorApi } from '../../api/operatorApi';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import './BaoCaoHoaHong.css';

/**
 * UC-OPER-02: Báo cáo Hoa hồng Dự án
 * Operator xem thống kê và báo cáo về hoa hồng các dự án
 */
const BaoCaoHoaHong = () => {
  const [filters, setFilters] = useState({
    keyword: '',
    trangThaiDuyetHoaHong: '',
    tuNgay: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    denNgay: format(new Date(), 'yyyy-MM-dd'),
    page: 1,
    limit: 20
  });

  // Query danh sách dự án với hoa hồng
  const { data: duAnData, isLoading, error } = useQuery({
    queryKey: ['duAnOperator', filters],
    queryFn: async () => {
      const response = await operatorApi.duAn.getDanhSach(filters);
      const payload = response.data?.data || response.data || [];
      return {
        data: Array.isArray(payload) ? payload : [],
        total: response.data?.total || payload.length || 0,
        totalPages: response.data?.totalPages || 1
      };
    },
    keepPreviousData: true
  });

  // Query thống kê hoa hồng
  const { data: thongKeData } = useQuery({
    queryKey: ['thongKeHoaHong'],
    queryFn: async () => {
      const response = await operatorApi.duAn.getThongKe();
      return response.data?.data || response.data || response;
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

  // Tính toán thống kê từ dữ liệu
  const stats = duAnData?.data ? {
    tongDuAn: duAnData.data.length,
    choDuyet: duAnData.data.filter(d => d.TrangThaiDuyetHoaHong === 'ChoDuyet').length,
    daDuyet: duAnData.data.filter(d => d.TrangThaiDuyetHoaHong === 'DaDuyet').length,
    tuChoi: duAnData.data.filter(d => d.TrangThaiDuyetHoaHong === 'TuChoi').length,
    chuaCauHinh: duAnData.data.filter(d => !d.BangHoaHong).length
  } : null;

  // Dữ liệu cho biểu đồ
  const chartData = duAnData?.data ? [
    { name: 'Chờ duyệt', value: stats?.choDuyet || 0, color: '#f59e0b' },
    { name: 'Đã duyệt', value: stats?.daDuyet || 0, color: '#10b981' },
    { name: 'Từ chối', value: stats?.tuChoi || 0, color: '#ef4444' },
    { name: 'Chưa cấu hình', value: stats?.chuaCauHinh || 0, color: '#6b7280' }
  ] : [];

  // Export to Excel
  const exportToExcel = () => {
    if (!duAnData?.data) return;

    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Tổng quan
    const tongQuanData = [
      ['Báo cáo Hoa hồng Dự án'],
      ['Từ ngày', filters.tuNgay],
      ['Đến ngày', filters.denNgay],
      [''],
      ['Chỉ số', 'Giá trị'],
      ['Tổng dự án', stats?.tongDuAn || 0],
      ['Chờ duyệt', stats?.choDuyet || 0],
      ['Đã duyệt', stats?.daDuyet || 0],
      ['Từ chối', stats?.tuChoi || 0],
      ['Chưa cấu hình', stats?.chuaCauHinh || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(tongQuanData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
    // Sheet 2: Chi tiết dự án
    const chiTietData = [
      ['ID', 'Tên dự án', 'Chủ dự án', 'Bảng hoa hồng (%)', 'Số tháng cọc', 'Trạng thái duyệt', 'Ngày tạo']
    ];
    
    duAnData.data.forEach(duAn => {
      chiTietData.push([
        duAn.DuAnID,
        duAn.TenDuAn,
        duAn.TenChuDuAn,
        duAn.BangHoaHong || 'N/A',
        duAn.SoThangCocToiThieu || 'N/A',
        duAn.TrangThaiDuyetHoaHong || 'Chưa cấu hình',
        new Date(duAn.TaoLuc).toLocaleDateString('vi-VN')
      ]);
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet(chiTietData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết');
    
    XLSX.writeFile(wb, `BaoCaoHoaHong_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  // Table columns
  const columns = [
    {
      key: 'DuAnID',
      label: 'ID',
      width: '60px',
      render: (row) => (
        <div style={{ paddingLeft: '8px' }}>
          #{row.DuAnID}
        </div>
      )
    },
    {
      key: 'TenDuAn',
      label: 'Tên dự án',
      width: '250px',
      render: (row) => (
        <div className="bao-cao-hoa-hong__ten-du-an">
          <div className="bao-cao-hoa-hong__ten">{row.TenDuAn}</div>
          <div className="bao-cao-hoa-hong__dia-chi">{row.DiaChi}</div>
        </div>
      )
    },
    {
      key: 'TenChuDuAn',
      label: 'Chủ dự án',
      width: '180px',
      render: (row) => row.TenChuDuAn
    },
    {
      key: 'BangHoaHong',
      label: 'Bảng hoa hồng',
      width: '140px',
      render: (row) => (
        <div className="bao-cao-hoa-hong__hoa-hong">
          {row.BangHoaHong ? (
            <>
              <span className="bao-cao-hoa-hong__hoa-hong-value">
                {row.BangHoaHong}%
              </span>
              {row.SoThangCocToiThieu && (
                <span className="bao-cao-hoa-hong__hoa-hong-thang">
                  ({row.SoThangCocToiThieu} tháng)
                </span>
              )}
            </>
          ) : (
            <span className="bao-cao-hoa-hong__hoa-hong-empty">Chưa cấu hình</span>
          )}
        </div>
      )
    },
    {
      key: 'TrangThaiDuyetHoaHong',
      label: 'Trạng thái',
      width: '140px',
      render: (row) => {
        if (!row.TrangThaiDuyetHoaHong) {
          return (
            <span className="bao-cao-hoa-hong__trang-thai-empty">
              Chưa cấu hình
            </span>
          );
        }
        
        return (
          <BadgeStatusOperator
            status={row.TrangThaiDuyetHoaHong}
            statusMap={{
              'ChoDuyet': { label: 'Chờ duyệt', variant: 'warning' },
              'DaDuyet': { label: 'Đã duyệt', variant: 'success' },
              'TuChoi': { label: 'Từ chối', variant: 'danger' }
            }}
          />
        );
      }
    },
    {
      key: 'TaoLuc',
      label: 'Ngày tạo',
      width: '140px',
      render: (row) => new Date(row.TaoLuc).toLocaleDateString('vi-VN')
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
      name: 'trangThaiDuyetHoaHong',
      label: 'Trạng thái hoa hồng',
      value: filters.trangThaiDuyetHoaHong || '',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'ChoDuyet', label: 'Chờ duyệt' },
        { value: 'DaDuyet', label: 'Đã duyệt' },
        { value: 'TuChoi', label: 'Từ chối' }
      ]
    },
    {
      type: 'date',
      name: 'tuNgay',
      label: 'Từ ngày',
      value: filters.tuNgay
    },
    {
      type: 'date',
      name: 'denNgay',
      label: 'Đến ngày',
      value: filters.denNgay
    }
  ];

  return (
    <OperatorLayout>
      <div className="bao-cao-hoa-hong">
        {/* Header */}
        <div className="bao-cao-hoa-hong__header">
          <div className="bao-cao-hoa-hong__title-section">
            <h1 className="bao-cao-hoa-hong__title">💰 Báo cáo Hoa hồng Dự án</h1>
            <p className="bao-cao-hoa-hong__subtitle">
              Thống kê và báo cáo về hoa hồng các dự án trên hệ thống
            </p>
          </div>
          
          <button
            className="operator-btn operator-btn--primary"
            onClick={exportToExcel}
            disabled={!duAnData?.data}
          >
            📥 Xuất Excel
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="bao-cao-hoa-hong__stats">
            <div className="bao-cao-hoa-hong__stat-card bao-cao-hoa-hong__stat-card--total">
              <div className="bao-cao-hoa-hong__stat-icon">📊</div>
              <div className="bao-cao-hoa-hong__stat-content">
                <div className="bao-cao-hoa-hong__stat-value">{stats.tongDuAn}</div>
                <div className="bao-cao-hoa-hong__stat-label">Tổng dự án</div>
              </div>
            </div>
            
            <div className="bao-cao-hoa-hong__stat-card bao-cao-hoa-hong__stat-card--warning">
              <div className="bao-cao-hoa-hong__stat-icon">⏳</div>
              <div className="bao-cao-hoa-hong__stat-content">
                <div className="bao-cao-hoa-hong__stat-value">{stats.choDuyet}</div>
                <div className="bao-cao-hoa-hong__stat-label">Chờ duyệt</div>
              </div>
            </div>
            
            <div className="bao-cao-hoa-hong__stat-card bao-cao-hoa-hong__stat-card--success">
              <div className="bao-cao-hoa-hong__stat-icon">✅</div>
              <div className="bao-cao-hoa-hong__stat-content">
                <div className="bao-cao-hoa-hong__stat-value">{stats.daDuyet}</div>
                <div className="bao-cao-hoa-hong__stat-label">Đã duyệt</div>
              </div>
            </div>
            
            <div className="bao-cao-hoa-hong__stat-card bao-cao-hoa-hong__stat-card--danger">
              <div className="bao-cao-hoa-hong__stat-icon">❌</div>
              <div className="bao-cao-hoa-hong__stat-content">
                <div className="bao-cao-hoa-hong__stat-value">{stats.tuChoi}</div>
                <div className="bao-cao-hoa-hong__stat-label">Từ chối</div>
              </div>
            </div>
            
            <div className="bao-cao-hoa-hong__stat-card bao-cao-hoa-hong__stat-card--secondary">
              <div className="bao-cao-hoa-hong__stat-icon">⚙️</div>
              <div className="bao-cao-hoa-hong__stat-content">
                <div className="bao-cao-hoa-hong__stat-value">{stats.chuaCauHinh}</div>
                <div className="bao-cao-hoa-hong__stat-label">Chưa cấu hình</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="bao-cao-hoa-hong__charts">
            <div className="bao-cao-hoa-hong__chart-card">
              <h3 className="bao-cao-hoa-hong__chart-title">Phân bổ Trạng thái Hoa hồng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bao-cao-hoa-hong__chart-card">
              <h3 className="bao-cao-hoa-hong__chart-title">Thống kê theo Trạng thái</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        <FilterPanelOperator
          fields={filterFields}
          onFilterChange={handleFilterChange}
          onReset={() => setFilters({
            keyword: '',
            trangThaiDuyetHoaHong: '',
            tuNgay: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            denNgay: format(new Date(), 'yyyy-MM-dd'),
            page: 1,
            limit: 20
          })}
        />

        {/* Table */}
        <div className="bao-cao-hoa-hong__content">
          {error ? (
            <div className="bao-cao-hoa-hong__error">
              ❌ Lỗi tải dữ liệu: {error.message}
            </div>
          ) : (
            <TableOperator
              columns={columns}
              data={duAnData?.data || []}
              isLoading={isLoading}
              pagination={{
                currentPage: filters.page,
                totalPages: duAnData?.totalPages || 1,
                total: duAnData?.total || 0,
                limit: filters.limit,
                onPageChange: handlePageChange
              }}
              emptyMessage="Không có dự án nào"
            />
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default BaoCaoHoaHong;







