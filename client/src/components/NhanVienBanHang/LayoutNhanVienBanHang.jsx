/**
 * Layout chính cho module Nhân viên Bán hàng
 * Bao gồm Sidebar navigation và Main content area
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import NavigationNhanVienBanHang from './NavigationNhanVienBanHang';
import FeedbackModal from './FeedbackModal';
import NotificationBadge from './NotificationBadge/NotificationBadge';
import NotificationCenter from './NotificationCenter/NotificationCenter';
import ToastNotification from './ToastNotification/ToastNotification';
import VideoCallNotification from './VideoCallNotification/VideoCallNotification';
import '../../styles/NhanVienBanHangDesignSystem.css';
import './LayoutNhanVienBanHang.css';

const getFirstValidString = (data, keys = []) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const LayoutNhanVienBanHang = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Toggle sidebar (desktop)
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    // Force reload để clear React state và redirect to login
    window.location.href = '/login';
  };

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const userDisplayName =
    getFirstValidString(user, [
      'tenDayDu',
      'TenDayDu',
      'hoTen',
      'HoTen',
      'hoVaTen',
      'HoVaTen',
      'fullName',
      'name',
      'email',
    ]) || 'Nhân viên';

  const userRole =
    getFirstValidString(user, [
      'tenVaiTro',
      'TenVaiTro',
      'vaiTro',
      'VaiTro',
      'vaiTroHienTai',
      'roleName',
      'role',
    ]) || 'Nhân viên Bán hàng';

  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div className="nvbh-layout">
      {/* Sidebar Navigation */}
      <NavigationNhanVienBanHang
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggle={toggleSidebar}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onFeedbackClick={() => setFeedbackModalOpen(true)}
        user={user}
      />

      {/* Header - Fixed top với search, notifications, user menu */}
      <header className={`nvbh-header ${sidebarCollapsed ? 'nvbh-header--sidebar-collapsed' : ''}`}>
        <div className="nvbh-header__container">
          {/* Burger Menu - Mobile only */}
          <button
            className="nvbh-header__burger-btn"
            onClick={toggleMobileMenu}
            aria-label="Mở menu"
          >
            <svg className="nvbh-header__burger-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Search */}
          <div className="nvbh-header__search">
            <div className="nvbh-header__search-wrapper">
              <svg className="nvbh-header__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng, giao dịch..."
                className="nvbh-header__search-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="nvbh-header__actions">
            {/* Notifications */}
            <NotificationBadge
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setUserMenuOpen(false);
              }}
              onUnreadCountChange={setUnreadCount}
              className="nvbh-header__notification-btn"
            />

            {/* Messages */}
            <button
              className="nvbh-header__message-btn"
              onClick={() => navigate('/nhan-vien-ban-hang/tin-nhan')}
              aria-label="Messages"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            {/* User Profile Dropdown */}
            <div className="nvbh-header__user">
              <button
                className="nvbh-header__user-trigger"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotificationOpen(false);
                }}
                aria-label="User menu"
              >
                <div className="nvbh-header__user-avatar">
                  {userInitial}
                </div>
                <div className="nvbh-header__user-info">
                  <div className="nvbh-header__user-name">{userDisplayName}</div>
                  <div className="nvbh-header__user-role">{userRole}</div>
                </div>
                <svg className="nvbh-header__user-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="nvbh-header__user-dropdown">
                  <div className="nvbh-header__user-dropdown-header">
                    <div className="nvbh-header__user-dropdown-title">Tài khoản của tôi</div>
                  </div>
                  <div className="nvbh-header__user-dropdown-separator"></div>
                  <button className="nvbh-header__user-dropdown-item" onClick={() => navigate('/nhan-vien-ban-hang/cai-dat')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m5.196-15.196l-4.243 4.243m-5.906 5.906l-4.243 4.243m15.198 0l-4.243-4.243m-5.906-5.906l-4.243-4.243" />
                    </svg>
                    <span>Cài đặt</span>
                  </button>
                  <div className="nvbh-header__user-dropdown-separator"></div>
                  <button className="nvbh-header__user-dropdown-item nvbh-header__user-dropdown-item--danger" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`nvbh-main ${sidebarCollapsed ? 'nvbh-main--sidebar-collapsed' : ''}`}>

        {/* Content */}
        <div className="nvbh-content">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="nvbh-footer">
          <div className="nvbh-footer__content">
            <p className="nvbh-footer__copyright">
              © {new Date().getFullYear()} Hommy BĐS. All rights reserved.
            </p>
            <div className="nvbh-footer__links">
              <a href="#" className="nvbh-footer__link">Trợ giúp</a>
              <a href="#" className="nvbh-footer__link">Hướng dẫn</a>
              <a href="#" className="nvbh-footer__link">Liên hệ</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="nvbh-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Toast Notifications */}
      <ToastNotification />

      {/* Video Call Notification */}
      <VideoCallNotification />
    </div>
  );
};

export default LayoutNhanVienBanHang;







