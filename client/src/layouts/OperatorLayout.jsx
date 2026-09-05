import { useEffect } from 'react';
import NavigationOperator from '../components/Operator/NavigationOperator';
import '../styles/OperatorDesignSystem.css';
import '../styles/OperatorAnimations.css';
import './OperatorLayout.css';
import IconOperator from '../components/Operator/Icon';
import { HiOutlineBars3 } from 'react-icons/hi2';
import OperatorErrorBoundary from '../components/Operator/OperatorErrorBoundary';

/**
 * Layout chung cho tất cả trang Operator
 * Bao gồm sidebar navigation và content area với glass morphism design
 */
function OperatorLayout({ children }) {
  // Auto hide header when scrolling down, show when scrolling up
  useEffect(() => {
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const current = window.scrollY || 0;
      const topbar = document.querySelector('.operator-topbar');
      if (!topbar) return;
      if (current > lastY && current > 64) {
        topbar.classList.add('operator-topbar--hide');
      } else {
        topbar.classList.remove('operator-topbar--hide');
      }
      lastY = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="operator-layout">
      {/* Topbar chỉ hiển thị trên tablet/mobile */}
      <div className="operator-topbar">
        <button
          className="operator-topbar__burger"
          onClick={() => window.dispatchEvent(new Event('operator:toggleSidebar'))}
          aria-label="Mở/Đóng menu"
        >
          <IconOperator size={20} title="Menu"><HiOutlineBars3 /></IconOperator>
        </button>
        <div className="operator-topbar__title">Nhân viên Điều hành</div>
      </div>
      <NavigationOperator />
      <div className="operator-layout__main">
        <div className="operator-layout__content">
          <OperatorErrorBoundary>
          {children}
          </OperatorErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default OperatorLayout;

