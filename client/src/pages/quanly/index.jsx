import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/navigation/Navigation";
import "./QuanLy.css";

// Import các components có sẵn
import QuanLyTaiKhoan from "../quanlytaikhoan/index";
import QuanLyTinDang from "../quanlytindang/index";
import QuanLyKhuVuc from "../quanlykhuvuc/index";
import Appointments from "../cuochencuatoi/index";
import ViPage from "../Vi/index";
import QuanLyHopDongAdmin from "../quanlyhopdong/index";
import QuanLyDuAnAdmin from "./QuanLyDuAnAdmin";
import QuanLyChinhSach from "./QuanLyChinhSach";
import QuanLyRutTien from "./QuanLyRutTien";
import CaiDatAdmin from "./CaiDatAdmin";

import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineBuildingOffice2,
  HiOutlineCalendar,
  HiOutlineCreditCard,
} from "react-icons/hi2";

import { dashboardOperatorApi } from "../../api/operatorApi";

function QuanLy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const actualUser = user.user || user;
      const roleId = actualUser?.VaiTroHoatDongID || actualUser?.vaiTroId || actualUser?.role || actualUser?.VaiTroID;
      return Number(roleId) === 1 ? "hopdong" : "dashboard";
    } catch {
      return "dashboard";
    }
  }); // Tab hiện tại
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    projects: 0,
    appointments: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const actualUser = user.user || user;
      const roleId = actualUser?.VaiTroHoatDongID || actualUser?.vaiTroId || actualUser?.role || actualUser?.VaiTroID;
      const rId = Number(roleId);
      setUserRole(rId);
      if (rId !== 1) {
        loadStats();
      }
    } catch {
      loadStats();
    }
  }, []);

  const isCustomer = userRole === 1;

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardOperatorApi.getStats();
      if (res?.data?.success && res.data.data) {
        const d = res.data.data;
        setStats({
          users: d.TongNguoiDung || 0,
          posts: d.TongSoTinDang || 0,
          projects: d.TongDuAn || 0,
          appointments: d.TongCuocHen || 0,
        });
        setActivities(d.RecentActivities || []);
      }
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Quản lý tài khoản",
      description: "Thêm, sửa, xóa người dùng",
      icon: <HiOutlineUsers />,
      tab: "taikhoan", // ← Đổi từ path thành tab
      color: "#3b82f6",
    },
    {
      title: "Duyệt tin đăng",
      description: "Phê duyệt tin đăng mới",
      icon: <HiOutlineDocumentText />,
      tab: "tindang",
      color: "#10b981",
    },
    {
      title: "Quản lý dự án",
      description: "Theo dõi các dự án",
      icon: <HiOutlineBuildingOffice2 />,
      tab: "quanlyduan",
      color: "#8b5cf6",
    },
    {
      title: "Quản lý cuộc hẹn",
      description: "Theo dõi các cuộc hẹn",
      icon: <HiOutlineCalendar />,
      tab: "cuochen",
      color: "#8b5cf6",
    },
    {
      title: "Quản lý thanh toán",
      description: "Xem giao dịch & hóa đơn",
      icon: <HiOutlineCreditCard />,
      tab: "thanhtoan",
      color: "#f59e0b",
    },
  ];

  // Function chuyển tab thay vì navigate
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Render nội dung theo tab
  const renderContent = () => {
    switch (activeTab) {
      case "taikhoan":
        return <QuanLyTaiKhoan />;
      case "tindang":
        return <QuanLyTinDang />;
      case "quanlykhuvuc":
        return <QuanLyKhuVuc />;
      case "cuochen":
        return <Appointments />;
      case "quanlyduan":
        return <QuanLyDuAnAdmin />;
      case "thanhtoan":
        return (
          <div className="quanly__placeholder">
            <h2>💳 Quản lý Thanh toán</h2>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case "vi":
        return <ViPage />;
      case "hopdong":
        return <QuanLyHopDongAdmin />;
      case "chinhsach":
        return <QuanLyChinhSach />;
      case "ruttien":
        return <QuanLyRutTien />;
      case "caidat":
        return <CaiDatAdmin />;
      case "yeucau":
        return (
          <div className="quanly__placeholder">
            <h2>💬 Quản lý Yêu cầu</h2>
            <p>Quản lý yêu cầu đang phát triển...</p>
          </div>
        );
      case "baocao":
        return (
          <div className="quanly__placeholder">
            <h2>📊 Báo cáo</h2>
            <p>Báo cáo thống kê đang phát triển...</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const formatActivityText = (act) => {
    const user = act.TenDayDu || "Người dùng ẩn danh";
    const targetId = act.DoiTuongID ? `#${act.DoiTuongID}` : "";

    switch (act.HanhDong) {
      case "tao_tin_dang":
        return <>Tin đăng <strong>{targetId}</strong> được tạo nháp bởi <strong>{user}</strong></>;
      case "DUYET_TIN_DANG":
        return <>Tin đăng <strong>{targetId}</strong> đã được phê duyệt hoạt động bởi <strong>{user}</strong></>;
      case "gui_tin_dang_de_duyet":
        return <>Tin đăng <strong>{targetId}</strong> gửi yêu cầu duyệt bởi <strong>{user}</strong></>;
      case "dang_ky":
      case "tao_tai_khoan":
        return <>Người dùng mới <strong>{user}</strong> đã đăng ký tài khoản</>;
      case "cap_nhat_tin_dang":
        return <>Cập nhật thông tin tin đăng <strong>{targetId}</strong> bởi <strong>{user}</strong></>;
      case "chu_du_an_xem_bao_cao_chi_tiet":
        return <><strong>{user}</strong> đã xem báo cáo chi tiết</>;
      default:
        const actionFriendly = String(act.HanhDong)
          .replace(/_/g, " ")
          .toLowerCase();
        return <><strong>{user}</strong> thực hiện: {actionFriendly} {act.DoiTuong ? `trên ${act.DoiTuong}` : ""} {targetId}</>;
    }
  };

  const getActivityIcon = (action) => {
    if (action === "DUYET_TIN_DANG") return { symbol: "✓", cls: "success" };
    if (action === "gui_tin_dang_de_duyet" || action === "yeu_cau_xem_xet") return { symbol: "⚠", cls: "warning" };
    return { symbol: "👤", cls: "info" };
  };

  const formatTimeDifference = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước (${date.toLocaleDateString("vi-VN")})`;
  };

  // Dashboard component
  const renderDashboard = () => (
    <>
      {/* Header */}
      <header className="quanly__header">
        <div className="quanly__header-text">
          <h1 className="quanly__title">Tổng quan hệ thống</h1>
          <p className="quanly__subtitle">
            Quản lý và giám sát toàn bộ hoạt động
          </p>
        </div>
        <button
          className="quanly__refresh-btn"
          onClick={loadStats}
          disabled={loading}
        >
          🔄 Làm mới
        </button>
      </header>

      {/* Stats Grid */}
      <div className="quanly__stats">
        <div className="quanly__stat-card">
          <div className="quanly__stat-icon quanly__stat-icon--blue">
            <HiOutlineUsers />
          </div>
          <div className="quanly__stat-content">
            <div className="quanly__stat-label">Người dùng</div>
            <div className="quanly__stat-value">
              {loading ? "..." : stats.users.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="quanly__stat-card">
          <div className="quanly__stat-icon quanly__stat-icon--green">
            <HiOutlineDocumentText />
          </div>
          <div className="quanly__stat-content">
            <div className="quanly__stat-label">Tin đăng</div>
            <div className="quanly__stat-value">
              {loading ? "..." : stats.posts.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="quanly__stat-card">
          <div className="quanly__stat-icon quanly__stat-icon--purple">
            <HiOutlineBuildingOffice2 />
          </div>
          <div className="quanly__stat-content">
            <div className="quanly__stat-label">Dự án</div>
            <div className="quanly__stat-value">
              {loading ? "..." : stats.projects.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="quanly__stat-card">
          <div className="quanly__stat-icon quanly__stat-icon--orange">
            <HiOutlineCalendar />
          </div>
          <div className="quanly__stat-content">
            <div className="quanly__stat-label">Cuộc hẹn</div>
            <div className="quanly__stat-value">
              {loading ? "..." : stats.appointments.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="quanly__section">
        <h2 className="quanly__section-title">Thao tác nhanh</h2>
        <div className="quanly__actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quanly__action-card"
              onClick={() => handleTabChange(action.tab)} // ← Đổi từ navigate
              style={{ "--accent-color": action.color }}
            >
              <div className="quanly__action-icon">{action.icon}</div>
              <div className="quanly__action-content">
                <h3 className="quanly__action-title">{action.title}</h3>
                <p className="quanly__action-description">
                  {action.description}
                </p>
              </div>
              <div className="quanly__action-arrow">→</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="quanly__section">
        <h2 className="quanly__section-title">Hoạt động gần đây</h2>
        <div className="quanly__activity">
          {loading ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
              Đang tải hoạt động...
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
              Không có hoạt động nào gần đây.
            </div>
          ) : (
            activities.map((act) => {
              const iconObj = getActivityIcon(act.HanhDong);
              return (
                <div key={act.NhatKyID} className="quanly__activity-item">
                  <div className={`quanly__activity-icon quanly__activity-icon--${iconObj.cls}`}>
                    {iconObj.symbol}
                  </div>
                  <div className="quanly__activity-content">
                    <div className="quanly__activity-text">
                      {formatActivityText(act)}
                    </div>
                    <div className="quanly__activity-time">
                      {formatTimeDifference(act.ThoiGian)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );

  return (
    <div className="quanly">
      {/* Sidebar Navigation - truyền activeTab để highlight */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="quanly__content">
        <div className="quanly__container">
          {/* Breadcrumb */}
          {activeTab !== "dashboard" && !isCustomer && (
            <nav className="quanly__breadcrumb">
              <button
                className="quanly__breadcrumb-btn"
                onClick={() => setActiveTab("dashboard")}
              >
                ← Quay lại Dashboard
              </button>
            </nav>
          )}

          {/* Render content theo tab */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default QuanLy;
