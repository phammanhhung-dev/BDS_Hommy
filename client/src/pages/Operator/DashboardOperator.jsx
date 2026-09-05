import React, { useEffect, useState } from 'react';
import OperatorLayout from '../../layouts/OperatorLayout';
import operatorApi from '../../api/operatorApi';
import { Link } from 'react-router-dom';
import './DashboardOperator.css';
import IconOperator from '../../components/Operator/Icon';
import { useOperatorPageSEO } from './seo';
import {
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiArrowPath
} from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

function DashboardOperator() {
  useOperatorPageSEO({
    title: 'Bảng điều khiển Điều hành',
    description: 'Tổng quan vận hành hệ thống NVDH, theo dõi nhanh tin đăng chờ duyệt, dự án, nhân viên và biên bản.',
    keywords: 'NVDH, bảng điều khiển điều hành, dashboard điều hành, quản lý tin đăng, quản lý dự án, quản lý nhân viên, biên bản bàn giao',
    canonicalPath: '/nvdh/dashboard',
  });

  const [oldMetrics, setOldMetrics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch old metrics (for Nhân viên and Biên bản cards)
      const oldData = await operatorApi.dashboard.getMetrics();
      setOldMetrics(oldData);

      // Fetch new dashboard data (6 endpoints in parallel)
      const newData = await operatorApi.dashboard.getDashboardData();
      setDashboardData(newData);
    } catch (error) {
      console.error('Lỗi lấy dashboard data:', error);
      setError('Không tải được dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <OperatorLayout>
        <div className="dashboard-operator">
          <div className="operator-shimmer" style={{height: '100px', marginBottom: '1rem'}} />
          <div className="operator-shimmer" style={{height: '200px', marginBottom: '2rem'}} />
          <div className="operator-shimmer" style={{height: '300px', marginBottom: '2rem'}} />
        </div>
      </OperatorLayout>
    );
  }

  if (error) {
    return (
      <OperatorLayout>
        <div className="dashboard-operator">
          <div className="operator-card" style={{padding: '2rem', textAlign: 'center'}}>
            <HiOutlineExclamationTriangle size={48} style={{color: '#ef4444', marginBottom: '1rem'}} />
            <h3 style={{marginBottom: '0.5rem'}}>Lỗi tải dữ liệu</h3>
            <p style={{color: '#6b7280', marginBottom: '1rem'}}>{error}</p>
            <button onClick={handleRetry} className="operator-btn operator-btn--primary">
              <HiArrowPath size={18} />
              <span style={{marginLeft: '0.5rem'}}>Thử lại</span>
            </button>
          </div>
        </div>
      </OperatorLayout>
    );
  }

  const stats = dashboardData?.stats || {};
  const revenueChart = dashboardData?.revenueChart || [];
  const occupancy = dashboardData?.occupancy || [];
  const statusDistribution = dashboardData?.statusDistribution || [];
  const recentListings = dashboardData?.recentListings || [];
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];

  // Stat cards for new metrics
  const statCards = [
    {
      title: 'Tổng tin đăng',
      value: stats.TongSoTinDang || 0,
      icon: <HiOutlineDocumentText />,
      link: '/nvdh/duyet-tin-dang',
      color: 'primary'
    },
    {
      title: 'Đang hoạt động',
      value: stats.DaDang || 0,
      icon: <HiOutlineBuildingOffice2 />,
      link: '/nvdh/du-an',
      color: 'success'
    },
    {
      title: 'Chờ duyệt',
      value: stats.ChoDuyet || 0,
      icon: <HiOutlineClock />,
      link: '/nvdh/duyet-tin-dang',
      color: 'warning'
    },
    {
      title: 'Cuộc hẹn 7 ngày',
      value: stats.CuocHen7Ngay || 0,
      icon: <HiOutlineCalendar />,
      link: '/nvdh/lich-nvbh',
      color: 'info'
    },
    {
      title: 'Doanh thu tháng',
      value: stats.DoanhThuThangNay || '0',
      format: 'currency',
      icon: <HiOutlineCurrencyDollar />,
      link: '/nvdh/thu-nhap',
      color: 'success'
    }
  ];

  // Old cards to keep (Nhân viên and Biên bản)
  const oldCards = [
    {
      title: 'Nhân viên active',
      value: oldMetrics?.nhanVien?.Active || 0,
      icon: <HiOutlineUsers />,
      link: '/nvdh/nhan-vien',
      color: 'primary'
    },
    {
      title: 'Biên bản chờ',
      value: oldMetrics?.bienBan?.ChuaBanGiao || 0,
      icon: <HiOutlineClipboardDocumentList />,
      link: '/nvdh/bien-ban',
      color: 'info'
    }
  ];

  // Status distribution colors
  const statusColors = {
    'DaDang': '#10b981',
    'ChoDuyet': '#f59e0b',
    'DaDuyet': '#3b82f6',
    'Nhap': '#6b7280',
    'TamNgung': '#ef4444',
    'TuChoi': '#dc2626',
    'LuuTru': '#8b5cf6'
  };

  // Top 5 projects by occupancy
  const topOccupancy = occupancy
    .sort((a, b) => parseFloat(b.TyLeLapDay) - parseFloat(a.TyLeLapDay))
    .slice(0, 5);

  // Format currency
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <OperatorLayout>
      <main className="dashboard-operator" aria-label="Dashboard Điều hành">
        <header className="dashboard-operator__header">
          <h1 className="dashboard-operator__title">Bảng điều khiển Điều hành</h1>
          <p className="dashboard-operator__subtitle">Tổng quan vận hành hệ thống</p>
        </header>

        {/* Error banner */}
        {error && (
          <div className="operator-card" style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <HiOutlineExclamationTriangle style={{color: '#ef4444'}} />
              <span style={{color: '#991b1b'}}>{error}</span>
              <button onClick={handleRetry} style={{marginLeft: 'auto', padding: '0.25rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer'}}>
                <HiArrowPath size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Stat Cards Row */}
        <section className="dashboard-operator__section" aria-labelledby="stats-title">
          <div className="dashboard-operator__section-header">
            <h2 id="stats-title" className="dashboard-operator__section-title">Thống kê tổng quan</h2>
          </div>
          <div className="dashboard-operator__metrics">
            {statCards.map((card, index) => {
              const cardContent = (
                <>
                  <div className="dashboard-operator__metric-icon">
                    <IconOperator size={24} title={card.title}>
                      {card.icon}
                    </IconOperator>
                  </div>
                  <div className="dashboard-operator__metric-content">
                    <div className="dashboard-operator__metric-value">
                      {card.format === 'currency' ? formatCurrency(card.value) : card.value}
                    </div>
                    <div className="dashboard-operator__metric-label">{card.title}</div>
                  </div>
                </>
              );

              return card.link ? (
                <Link
                  key={index}
                  to={card.link}
                  className="operator-card dashboard-operator__metric-card dashboard-operator__metric-card--clickable operator-stagger-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={index}
                  className="operator-card dashboard-operator__metric-card operator-stagger-item"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Revenue Chart */}
        <section className="dashboard-operator__section" aria-labelledby="revenue-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="revenue-title" className="dashboard-operator__section-title">Doanh thu 6 tháng gần nhất</h2>
          </div>
          <div className="operator-card">
            <div className="operator-card__body">
              {revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Thang" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Tháng ${label}`}
                    />
                    <Bar dataKey="DoanhThu" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                  <HiOutlineCurrencyDollar size={48} style={{marginBottom: '1rem'}} />
                  <p>Chưa có dữ liệu doanh thu</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Status Distribution */}
        <section className="dashboard-operator__section" aria-labelledby="status-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="status-title" className="dashboard-operator__section-title">Phân bố trạng thái tin đăng</h2>
          </div>
          <div className="operator-card">
            <div className="operator-card__body">
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({TrangThai, SoLuong, percent}) => `${TrangThai}: ${SoLuong} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="SoLuong"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[entry.TrangThai] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                  <HiOutlineDocumentText size={48} style={{marginBottom: '1rem'}} />
                  <p>Chưa có tin đăng nào</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Occupancy by Project */}
        <section className="dashboard-operator__section" aria-labelledby="occupancy-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="occupancy-title" className="dashboard-operator__section-title">Tỷ lệ lấp đầy theo dự án (Top 5)</h2>
          </div>
          <div className="operator-card">
            <div className="operator-card__body">
              {topOccupancy.length > 0 ? (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                      <th style={{textAlign: 'left', padding: '0.75rem', fontWeight: '600'}}>Dự án</th>
                      <th style={{textAlign: 'center', padding: '0.75rem', fontWeight: '600'}}>Tổng căn</th>
                      <th style={{textAlign: 'center', padding: '0.75rem', fontWeight: '600'}}>Tin đăng</th>
                      <th style={{textAlign: 'center', padding: '0.75rem', fontWeight: '600'}}>Tỷ lệ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOccupancy.map((project) => (
                      <tr key={project.DuAnID} style={{borderBottom: '1px solid #e5e7eb'}}>
                        <td style={{padding: '0.75rem'}}>{project.TenDuAn}</td>
                        <td style={{textAlign: 'center', padding: '0.75rem'}}>{project.TongPhong}</td>
                        <td style={{textAlign: 'center', padding: '0.75rem'}}>{project.PhongDaThue}</td>
                        <td style={{textAlign: 'center', padding: '0.75rem'}}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: parseFloat(project.TyLeLapDay) > 70 ? '#d1fae5' : parseFloat(project.TyLeLapDay) > 30 ? '#fef3c7' : '#fee2e2',
                            color: parseFloat(project.TyLeLapDay) > 70 ? '#065f46' : parseFloat(project.TyLeLapDay) > 30 ? '#92400e' : '#991b1b',
                            fontWeight: '600'
                          }}>
                            {project.TyLeLapDay}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                  <HiOutlineBuildingOffice2 size={48} style={{marginBottom: '1rem'}} />
                  <p>Chưa có dữ liệu dự án</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 5: Recent Listings */}
        <section className="dashboard-operator__section" aria-labelledby="recent-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="recent-title" className="dashboard-operator__section-title">Tin đăng gần đây</h2>
          </div>
          <div className="operator-card">
            <div className="operator-card__body">
              {recentListings.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {recentListings.map((listing) => (
                    <div
                      key={listing.TinDangID}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem'}}>
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>{listing.TieuDe}</div>
                          <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                            {listing.TenDuAn}
                          </div>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: statusColors[listing.TrangThai] + '20',
                          color: statusColors[listing.TrangThai]
                        }}>
                          {listing.TrangThai}
                        </span>
                      </div>
                      <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>
                        {formatDate(listing.TaoLuc)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                  <HiOutlineDocumentText size={48} style={{marginBottom: '1rem'}} />
                  <p>Chưa có tin đăng nào</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Upcoming Appointments */}
        <section className="dashboard-operator__section" aria-labelledby="appointments-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="appointments-title" className="dashboard-operator__section-title">Cuộc hẹn sắp tới (7 ngày)</h2>
          </div>
          <div className="operator-card">
            <div className="operator-card__body">
              {upcomingAppointments.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.CuocHenID}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>
                        {formatDate(appointment.ThoiGianHen)}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        {appointment.TieuDeTinDang}
                      </div>
                      {appointment.TenKhachHang && (
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                          Khách: {appointment.TenKhachHang}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                  <HiOutlineCalendar size={48} style={{marginBottom: '1rem'}} />
                  <p>Không có cuộc hẹn nào trong 7 ngày tới</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 7: Old Cards (Nhân viên and Biên bản) */}
        <section className="dashboard-operator__section" aria-labelledby="legacy-title" style={{marginTop: '2rem'}}>
          <div className="dashboard-operator__section-header">
            <h2 id="legacy-title" className="dashboard-operator__section-title">Chỉ số khác</h2>
          </div>
          <div className="dashboard-operator__metrics">
            {oldCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                aria-label={`Mở ${card.title}`}
                className="operator-card operator-card--interactive dashboard-operator__metric-card operator-stagger-item"
              >
                <div className="dashboard-operator__metric-icon">
                  <IconOperator size={24} title={card.title}>
                    {card.icon}
                  </IconOperator>
                </div>
                <div className="dashboard-operator__metric-content">
                  <div className="dashboard-operator__metric-value">{card.value}</div>
                  <div className="dashboard-operator__metric-label">{card.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="dashboard-operator__quick-actions operator-card" aria-labelledby="dashboard-operator-actions-title" style={{marginTop: '2rem'}}>
          <div className="operator-card__header">
            <h2 id="dashboard-operator-actions-title" className="operator-card__title">Thao tác nhanh</h2>
          </div>
          <div className="operator-card__body">
            <div className="dashboard-operator__actions">
              <Link to="/nvdh/duyet-tin-dang" className="operator-btn operator-btn--primary">
                <span className="operator-btn__icon"><IconOperator size={18} title="Duyệt Tin đăng"><HiOutlineCheckCircle /></IconOperator></span>
                <span className="operator-btn__text">Duyệt Tin đăng</span>
              </Link>
              <Link to="/nvdh/nhan-vien" className="operator-btn operator-btn--success">
                <span className="operator-btn__icon"><IconOperator size={18} title="Tạo mới"><HiOutlinePlus /></IconOperator></span>
                <span className="operator-btn__text">Tạo Nhân viên mới</span>
              </Link>
              <Link to="/nvdh/lich-nvbh" className="operator-btn operator-btn--ghost">
                <span className="operator-btn__icon"><IconOperator size={18} title="Lịch NVBH"><HiOutlineCalendar /></IconOperator></span>
                <span className="operator-btn__text">Xem Lịch NVBH</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </OperatorLayout>
  );
}

export default DashboardOperator;






