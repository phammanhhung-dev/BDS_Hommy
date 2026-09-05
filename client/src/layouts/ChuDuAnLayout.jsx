import React, { useEffect } from 'react';
import NavigationChuDuAn from '../components/ChuDuAn/NavigationChuDuAn';
import '../styles/ChuDuAnDesignSystem.css';
import './ChuDuAnLayout.css';

/**
 * Layout chung cho tất cả trang Chủ dự án
 * Bao gồm sidebar navigation và content area
 */
function ChuDuAnLayout({ children }) {
  // Auto hide header when scrolling down, show when scrolling up
  useEffect(() => {
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const current = window.scrollY || 0;
      const topbar = document.querySelector('.cda-topbar');
      if (!topbar) return;
      if (current > lastY && current > 64) {
        topbar.classList.add('cda-topbar--hide');
      } else {
        topbar.classList.remove('cda-topbar--hide');
      }
      lastY = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="chu-du-an-layout">
      {/* Topbar chỉ hiển thị trên tablet/mobile */}
      <div className="cda-topbar">
        <button
          className="cda-topbar-burger"
          onClick={() => window.dispatchEvent(new Event('cda:toggleSidebar'))}
          aria-label="Mở/Đóng menu"
        >
          ☰
        </button>
        <div className="cda-topbar-title">Chủ dự án</div>
      </div>
      <NavigationChuDuAn />
      <div className="chu-du-an-main">
        <div className="chu-du-an-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ChuDuAnLayout;
