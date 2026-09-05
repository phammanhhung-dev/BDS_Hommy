/**
 * Sidebar Navigation cho Nhân viên Bán hàng
 * Hiển thị menu với 6 mục chính
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useChatContext } from '../../context/ChatContext';
import './NavigationNhanVienBanHang.css';

// Logo Hommy
import HommyLogoIcon from '../../assets/images/Hommy_Logo_Icon.svg';

// Icons (sử dụng SVG inline để tránh phụ thuộc thư viện)
// Icon Sparkles cho logo (theo Figma)
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// LayoutDashboard icon
const LayoutDashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

// Calendar icon
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// CalendarCheck icon
const CalendarCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

// FileText icon (cho Giao dịch & Cọc)
const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

// DollarSign icon
const DollarSignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// MessageCircle icon (cho Feedback)
const MessageCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

// MessageSquare icon (cho Tin nhắn)
const MessageSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NavigationNhanVienBanHang = ({ collapsed, mobileOpen, onToggle, onCloseMobile, onFeedbackClick, user }) => {
  // Get unread count from ChatContext
  const { unreadCount } = useChatContext();

  // Thêm prop onToggle nếu chưa có
  const handleToggle = onToggle || (() => { });
  // Menu items theo Fig design
  const navItems = [
    { icon: LayoutDashboardIcon, label: 'Bảng điều khiển', path: '/nhan-vien-ban-hang' },
    { icon: CalendarIcon, label: 'Lịch làm việc', path: '/nhan-vien-ban-hang/lich-lam-viec' },
    { icon: CalendarCheckIcon, label: 'Cuộc hẹn', path: '/nhan-vien-ban-hang/cuoc-hen' },
    { icon: FileTextIcon, label: 'Giao dịch & Cọc', path: '/nhan-vien-ban-hang/giao-dich' },
    { icon: DollarSignIcon, label: 'Thu nhập của tôi', path: '/nhan-vien-ban-hang/thu-nhap' },
    { icon: MessageSquareIcon, label: 'Tin nhắn', path: '/nhan-vien-ban-hang/tin-nhan', badge: unreadCount }
  ];

  return (
    <aside
      className={`nvbh-sidebar ${collapsed ? 'nvbh-sidebar--collapsed' : ''} ${mobileOpen ? 'nvbh-sidebar--open' : ''}`}
    >
      {/* Logo */}
      <div className="nvbh-sidebar__logo">
        <div className="nvbh-sidebar__logo-content">
          <div className="nvbh-sidebar__logo-icon">
            <img src={HommyLogoIcon} alt="Hommy" className="nvbh-sidebar__logo-img" />
          </div>
          {!collapsed && (
            <span className="nvbh-sidebar__logo-text">Sales Hub</span>
          )}
        </div>
        {onToggle && (
          <button
            className="nvbh-sidebar__collapse-btn"
            onClick={onToggle}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="nvbh-sidebar__collapse-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="nvbh-sidebar__nav">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={index === 0}
            className={({ isActive }) =>
              `nvbh-nav-item ${isActive ? 'nvbh-nav-item--active' : ''}`
            }
            onClick={onCloseMobile}
          >
            <span className="nvbh-nav-item__icon">
              <item.icon />
            </span>
            {!collapsed && (
              <>
                <span className="nvbh-nav-item__label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="nvbh-nav-item__badge">{item.badge}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions - Feedback button */}
      {!collapsed && (
        <div className="nvbh-sidebar__bottom">
          <button
            className="nvbh-sidebar__feedback-btn"
            onClick={onFeedbackClick}
          >
            <MessageCircleIcon />
            <span className="nvbh-sidebar__feedback-label">Gửi phản hồi</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default NavigationNhanVienBanHang;
