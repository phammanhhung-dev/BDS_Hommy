import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./navigation.css";

// Logo Hommy
import HommyLogoIcon from "../../assets/images/Hommy_Logo_Icon.svg";

// React Icons
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineMap,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTrendingUp,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChartPie,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

/**
 * Component Sidebar Navigation cho trang Quản lý
 * Design: Modern sidebar với sections, badges, user profile
 * @returns {JSX.Element}
 */
// Helper function để lấy vai trò người dùng
const getUserRole = (user) => {
  if (!user) return null;
  return user.VaiTroHoatDongID || user.vaiTroId || user.role || user.VaiTroID || null;
};

// Helper function để lấy user từ localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

function Navigation({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    setUserRole(getUserRole(user));
  }, []);

  const isCustomer = userRole === 1;

  const mainMenuItems = [
    !isCustomer && {
      path: "/quan-ly/dashboard",
      tab: "dashboard",
      title: "Tổng quan",
      icon: <HiOutlineChartBar />,
      description: "Dashboard và thống kê",
    },
    !isCustomer && {
      path: "/quanlytaikhoan",
      tab: "taikhoan",
      title: "Tài khoản",
      icon: <HiOutlineUsers />,
      description: "Quản lý người dùng",
    },
    !isCustomer && {
      path: "/quanlytindang",
      tab: "tindang",
      title: "Tin đăng",
      icon: <HiOutlineDocumentText />,
      description: "Duyệt tin đăng",
    },
    !isCustomer && {
      path: "/quanlykhuvuc",
      tab: "quanlykhuvuc",
      title: "Khu vực",
      icon: <HiOutlineMap />,
      description: "Quản lý khu vực",
    },
    !isCustomer && {
      path: "/quan-ly",
      tab: "quanlyduan",
      title: "Dự án",
      icon: <HiOutlineBuildingOffice2 />,
      description: "Quản lý dự án",
    },
    !isCustomer && {
      path: "/quan-ly",
      tab: "chinhsach",
      title: "Chính sách",
      icon: <HiOutlineShieldCheck />,
      description: "Quản lý chính sách hệ thống",
    },
    !isCustomer && {
      path: "/quan-ly",
      tab: "ruttien",
      title: "Yêu cầu rút tiền",
      icon: <HiOutlineBanknotes />,
      description: "Duyệt yêu cầu rút tiền",
    },
  ].filter(Boolean);

  const appointmentMenuItems = [
    {
      path: "/quanlycuochen",
      tab: "cuochen",
      title: "Cuộc hẹn",
      icon: <HiOutlineCalendarDays />,
      description: "Quản lý cuộc hẹn",
    },
    !isCustomer && {
      path: "/quan-ly",
      tab: "yeucau",
      title: "Yêu cầu",
      icon: <HiOutlineChatBubbleLeftRight />,
      description: "Quản lý yêu cầu",
    },
  ].filter(Boolean);

  // Hiển thị tab Hợp đồng cho Admin (role 4), Operator (role 5) hoặc Khách hàng (role 1)
  const shouldShowHopDongTab = userRole === 4 || userRole === 5 || userRole === 1;

  const paymentMenuItems = [
    !isCustomer && {
      path: "/thanhtoan",
      tab: "thanhtoan",
      title: "Thanh toán",
      icon: <HiOutlineCreditCard />,
      description: "Quản lý giao dịch",
    },
    {
      path: "/quanlyvi",
      tab: "vi",
      title: "Ví",
      icon: <HiOutlineArrowTrendingUp />,
      description: "Quản lý ví người dùng",
    },
    // Chỉ hiển thị tab Hợp đồng cho Admin/Operator/Khách hàng
    shouldShowHopDongTab && {
      path: "/quan-ly/hop-dong",
      tab: "hopdong",
      title: "Hợp đồng",
      icon: <HiOutlineDocumentText />,
      description: "Quản lý hợp đồng",
    },
    !isCustomer && {
      path: "/chu-du-an/bao-cao",
      tab: "baocao",
      title: "Báo cáo",
      icon: <HiOutlineChartPie />,
      description: "Thống kê hệ thống",
    },
  ].filter(Boolean);

  const isActive = (path) => {
    if (path === "/quan-ly/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const handleItemClick = (item) => {
    if (onTabChange && item.tab) {
      onTabChange(item.tab);
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const handler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("ql:toggleSidebar", handler);
    return () => window.removeEventListener("ql:toggleSidebar", handler);
  }, []);

  return (
    <>
      <button className="navigation__mobile-toggle" onClick={toggleMobile}>
        {isMobileOpen ? "✕" : "☰"}
      </button>

      <div
        className={`navigation__overlay ${
          isMobileOpen ? "navigation__overlay--active" : ""
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`navigation ${isCollapsed ? "navigation--collapsed" : ""} ${
          isMobileOpen ? "navigation--mobile-open" : ""
        }`}
      >
        {/* Header */}
        <div className="navigation__header">
          <div className="navigation__brand">
            <div className="navigation__brand-icon">
              <img 
                src={HommyLogoIcon} 
                alt="Hommy" 
                className={`navigation__brand-logo ${isCollapsed ? 'navigation__brand-logo--collapsed' : ''}`}
              />
            </div>
            {!isCollapsed && (
              <div className="navigation__brand-text">
                <div className="navigation__brand-title">Quản lý</div>
                <div className="navigation__brand-subtitle">
                  Hệ thống & Vận hành
                </div>
              </div>
            )}
          </div>
          <button className="navigation__toggle" onClick={toggleSidebar}>
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="navigation__user">
            <div className="navigation__user-avatar">
              {(() => {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const name = user.TenDayDu || user.tenDayDu || "Admin";
                return name.charAt(0).toUpperCase();
              })()}
            </div>
            <div className="navigation__user-info">
              <div className="navigation__user-name">
                {(() => {
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  return user.TenDayDu || user.tenDayDu || "Quản trị viên";
                })()}
              </div>
              <div className="navigation__user-role">
                {(() => {
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  return user.TenVaiTro || user.vaiTro || "Admin";
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="navigation__nav">
          {/* Section 1: Quản lý chính */}
          <div className="navigation__section">
            {!isCollapsed && (
              <div className="navigation__section-title">Quản lý chính</div>
            )}
            <ul className="navigation__list">
              {mainMenuItems.map((item, index) => (
                <li key={index} className="navigation__item">
                  <button
                    className={`navigation__link ${
                      (activeTab && item.tab === activeTab) ||
                      (!activeTab && isActive(item.path))
                        ? "navigation__link--active"
                        : ""
                    }`}
                    onClick={() => handleItemClick(item)}
                    title={isCollapsed ? item.title : item.description}
                  >
                    <span className="navigation__link-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="navigation__link-label">
                        {item.title}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Cuộc hẹn & Yêu cầu */}
          <div className="navigation__section">
            {!isCollapsed && (
              <div className="navigation__section-title">Tương tác</div>
            )}
            <ul className="navigation__list">
              {appointmentMenuItems.map((item, index) => (
                <li key={index} className="navigation__item">
                  <button
                    className={`navigation__link ${
                      (activeTab && item.tab === activeTab) ||
                      (!activeTab && isActive(item.path))
                        ? "navigation__link--active"
                        : ""
                    }`}
                    onClick={() => handleItemClick(item)}
                    title={isCollapsed ? item.title : item.description}
                  >
                    <span className="navigation__link-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="navigation__link-label">
                        {item.title}
                      </span>
                    )}
                    {/* Badge cho cuộc hẹn mới */}
                    {item.tab === "cuochep" && !isCollapsed && (
                      <span className="navigation__badge">3</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Tài chính */}
          <div className="navigation__section">
            {!isCollapsed && (
              <div className="navigation__section-title">Tài chính</div>
            )}
            <ul className="navigation__list">
              {paymentMenuItems.map((item, index) => (
                <li key={index} className="navigation__item">
                  <button
                    className={`navigation__link ${
                      (activeTab && item.tab === activeTab) ||
                      (!activeTab && isActive(item.path))
                        ? "navigation__link--active"
                        : ""
                    }`}
                    onClick={() => handleItemClick(item)}
                    title={isCollapsed ? item.title : item.description}
                  >
                    <span className="navigation__link-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="navigation__link-label">
                        {item.title}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Quick Actions - Chỉ hiển thị cho Admin/Operator */}
        {!isCollapsed && !isCustomer && (
          <div className="navigation__actions">
            <button
              className="navigation__action-btn"
              onClick={() => {
                if (onTabChange) {
                  onTabChange("taikhoan");
                } else {
                  navigate("/quanlytaikhoan");
                }
              }}
            >
              <HiOutlineUsers style={{ width: "18px", height: "18px" }} />
              <span>Thêm tài khoản</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="navigation__footer">
          <button
            className="navigation__footer-btn"
            onClick={() => navigate("/")}
            title="Về trang chủ"
          >
            <HiOutlineHome style={{ width: "20px", height: "20px" }} />
            {!isCollapsed && <span>Trang chủ</span>}
          </button>
          <button
            className={`navigation__footer-btn ${
              (activeTab && activeTab === "caidat") || location.pathname === "/cai-dat"
                ? "navigation__footer-btn--active"
                : ""
            }`}
            onClick={() => {
              if (onTabChange) {
                onTabChange("caidat");
              } else {
                navigate("/cai-dat");
              }
            }}
            title="Cài đặt"
          >
            <HiOutlineCog6Tooth style={{ width: "20px", height: "20px" }} />
            {!isCollapsed && <span>Cài đặt</span>}
          </button>
          <button
            className="navigation__footer-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <HiOutlineArrowRightOnRectangle style={{ width: "20px", height: "20px" }} />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navigation;
