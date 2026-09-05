/**
 * Dashboard - Trang tổng quan cho Nhân viên Bán hàng
 * Hiển thị metrics, schedule hôm nay, và pending actions
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../components/NhanVienBanHang/MetricCard';
import StatusBadge from '../../components/NhanVienBanHang/StatusBadge';
import { layDashboard, formatDate, formatCurrency } from '../../api/nhanVienBanHangApi';
import './Dashboard.css';

// Icons
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    metrics: {
      cuocHenHomNay: 0,
      choXacNhan: 0,
      hoanThanhTuan: 0,
      thuNhapThang: 0
    },
    cuocHenHomNay: [],
    hieuSuat7Ngay: [],
    lichLamViecTuan: {},
    activities: []
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await layDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Lỗi load dashboard:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="nvbh-loading">
        <div className="nvbh-loading-spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nvbh-error">
        <p>{error}</p>
        <button className="nvbh-btn nvbh-btn--primary" onClick={loadDashboard}>
          Thử lại
        </button>
      </div>
    );
  }

  // Lấy giờ hiện tại để hiển thị lời chào
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Lấy tên người dùng
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const nameField = user.TenDayDu || user.tenDayDu;
  const userName = nameField ? nameField.split(' ').pop() : 'Nhân viên';

  return (
    <div className="nvbh-dashboard">
      {/* Greeting Header */}
      <div className="nvbh-dashboard__header">
        <div>
          <h1 className="nvbh-dashboard__title">{getGreeting()}, {userName}!</h1>
          <p className="nvbh-dashboard__subtitle">
            Đây là tổng quan nhanh về hoạt động bán hàng của bạn hôm nay.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="nvbh-dashboard__metrics nvbh-grid nvbh-grid-cols-4 nvbh-gap-md">
        <MetricCard
          icon={CalendarIcon}
          label="Cuộc hẹn hôm nay"
          value={data.metrics.cuocHenHomNay}
          color="primary"
          onClick={() => navigate('/nhan-vien-ban-hang/cuoc-hen')}
        />
        <MetricCard
          icon={ClockIcon}
          label="Chờ xác nhận"
          value={data.metrics.choXacNhan}
          color="warning"
          onClick={() => navigate('/nhan-vien-ban-hang/cuoc-hen?trangThai=ChoXacNhan')}
        />
        <MetricCard
          icon={CheckIcon}
          label="Hoàn thành tuần này"
          value={data.metrics.hoanThanhTuan}
          color="success"
        />
        <MetricCard
          icon={DollarIcon}
          label="Thu nhập tháng này"
          value={formatCurrency(data.metrics.thuNhapThang)}
          color="primary"
          onClick={() => navigate('/nhan-vien-ban-hang/thu-nhap')}
        />
      </div>

      {/* Calendar & Upcoming Appointments - 2 columns */}
      <div className="nvbh-dashboard__calendar-upcoming nvbh-grid nvbh-grid-cols-2 nvbh-gap-md">
        {/* Mini Calendar */}
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <h2 className="nvbh-card__title">Lịch tuần này</h2>
          </div>
          <div className="nvbh-card__body">
            <div className="nvbh-mini-calendar">
              <div className="nvbh-mini-calendar__days">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <div key={day} className="nvbh-mini-calendar__day-label">{day}</div>
                ))}
              </div>
              <div className="nvbh-mini-calendar__dates">
                {(() => {
                  const today = new Date();
                  const weekStart = new Date(today);
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  
                  const dates = [];
                  for (let i = 0; i < 21; i++) {
                    const date = new Date(weekStart);
                    date.setDate(date.getDate() + i);
                    dates.push(date);
                  }
                  
                  return dates.map((date, i) => {
                    const day = date.getDate();
                    const isToday = date.toDateString() === today.toDateString();
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const localDateStr = `${year}-${month}-${d}`;
                    const dateStr = date.toISOString().split('T')[0];
                    const hasAppointments = (data.lichLamViecTuan?.[localDateStr] > 0) || (data.lichLamViecTuan?.[dateStr] > 0);

                    return (
                      <div
                        key={i}
                        className={`nvbh-mini-calendar__date ${isToday ? 'nvbh-mini-calendar__date--today' : ''} ${hasAppointments ? 'nvbh-mini-calendar__date--has-appointments' : ''}`}
                      >
                        {day}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments (≤2h) */}
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <h2 className="nvbh-card__title">Sắp diễn ra (≤2h)</h2>
          </div>
          <div className="nvbh-card__body">
            {data.cuocHenHomNay.length > 0 ? (
              <div className="nvbh-upcoming-list">
                {data.cuocHenHomNay.slice(0, 3).map((cuocHen, index) => (
                  <div
                    key={`cuoc-hen-${cuocHen.CuocHenID}-${index}`}
                    className="nvbh-upcoming-item"
                    onClick={() => navigate(`/nhan-vien-ban-hang/cuoc-hen/${cuocHen.CuocHenID}`)}
                  >
                    <div className="nvbh-upcoming-item__icon nvbh-upcoming-item__icon--primary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="nvbh-upcoming-item__content">
                      <div className="nvbh-upcoming-item__title">
                        {cuocHen.TenKhachHang || 'Khách hàng'}
                      </div>
                      <div className="nvbh-upcoming-item__time">
                        {formatDate(cuocHen.ThoiGianHen, 'time')}
                      </div>
                    </div>
                    <svg className="nvbh-upcoming-item__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div className="nvbh-empty-state">
                <p>Không có cuộc hẹn sắp diễn ra</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="nvbh-dashboard__activities">
        <div className="nvbh-card">
          <div className="nvbh-card__header">
            <h2 className="nvbh-card__title">Hoạt động gần đây</h2>
          </div>
          <div className="nvbh-card__body">
            {data.activities && data.activities.length > 0 ? (
              <div className="nvbh-activities-list">
                {data.activities.map((activity, index) => {
                  const getActivityType = () => {
                    if (activity.status === 'DaXacNhan' || activity.status === 'success') {
                      return 'success';
                    }
                    if (activity.status === 'warning') {
                      return 'warning';
                    }
                    return 'info';
                  };

                  const getActivityIcon = () => {
                    if (getActivityType() === 'success') {
                      return <CheckIcon />;
                    }
                    if (getActivityType() === 'warning') {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      );
                    }
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    );
                  };

                  const getTimeAgo = (time) => {
                    const now = new Date();
                    const activityTime = new Date(time);
                    const diffMs = now - activityTime;
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffMins < 1) return 'Vừa xong';
                    if (diffMins < 60) return `${diffMins} phút trước`;
                    if (diffHours < 24) return `${diffHours} giờ trước`;
                    return `${diffDays} ngày trước`;
                  };

                  const getBadgeText = () => {
                    if (getActivityType() === 'success') return 'Thành công';
                    if (getActivityType() === 'warning') return 'Thông báo';
                    return 'Mới';
                  };

                  return (
                    <div key={index} className={`nvbh-activity-item nvbh-activity-item--${getActivityType()}`}>
                      <div className="nvbh-activity-item__icon">
                        {getActivityIcon()}
                      </div>
                      <div className="nvbh-activity-item__content">
                        <div className="nvbh-activity-item__text">
                          {activity.highlight ? (
                            <>
                              {activity.message.split(activity.highlight)[0]}
                              <span className="nvbh-activity-item__highlight">{activity.highlight}</span>
                              {activity.message.split(activity.highlight)[1]}
                            </>
                          ) : (
                            activity.message
                          )}
                        </div>
                        <div className="nvbh-activity-item__time">{getTimeAgo(activity.time)}</div>
                      </div>
                      <div className={`nvbh-badge nvbh-badge--${getActivityType()}`}>
                        {getBadgeText()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="nvbh-empty-state">
                <p>Chưa có hoạt động gần đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;








