/**
 * ErrorBanner Component
 * Error display with retry button
 * @component
 */

import React from 'react';
import { HiOutlineExclamationTriangle, HiOutlineXCircle } from 'react-icons/hi2';
import './ErrorBanner.css';

/**
 * @param {Object} props
 * @param {string} props.message - Error message
 * @param {string} props.type - Error type: 'error', 'warning'
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onDismiss - Dismiss callback
 * @param {boolean} props.dismissible - Can be dismissed
 */
const ErrorBanner = ({ 
  message = 'Đã xảy ra lỗi. Vui lòng thử lại.',
  type = 'error',
  onRetry,
  onDismiss,
  dismissible = true
}) => {
  const Icon = type === 'warning' ? HiOutlineExclamationTriangle : HiOutlineXCircle;

  return (
    <div 
      className={`nvbh-error-banner nvbh-error-banner--${type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="nvbh-error-banner__icon">
        <Icon />
      </div>
      <div className="nvbh-error-banner__content">
        <p className="nvbh-error-banner__message">{message}</p>
        {onRetry && (
          <button
            className="nvbh-error-banner__retry"
            onClick={onRetry}
            type="button"
          >
            Thử lại
          </button>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          className="nvbh-error-banner__dismiss"
          onClick={onDismiss}
          type="button"
          aria-label="Đóng thông báo lỗi"
        >
          <HiOutlineXCircle />
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;







