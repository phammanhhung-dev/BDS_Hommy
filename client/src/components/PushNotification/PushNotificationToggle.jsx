/**
 * Component Toggle Push Notifications
 * Cho phép user bật/tắt thông báo đẩy
 */

import React from 'react';
import { HiOutlineBell, HiOutlineBellSlash, HiOutlineBellAlert } from 'react-icons/hi2';
import usePushNotifications from '../../hooks/usePushNotifications';
import './PushNotificationToggle.css';

const PushNotificationToggle = ({ 
  showLabel = true, 
  showTestButton = false,
  className = '' 
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    canSubscribe,
    toggleSubscription,
    testNotification
  } = usePushNotifications();

  // Không hỗ trợ
  if (!isSupported) {
    return (
      <div className={`push-toggle push-toggle--unsupported ${className}`}>
        <HiOutlineBellSlash className="push-toggle__icon" />
        {showLabel && (
          <span className="push-toggle__label">Trình duyệt không hỗ trợ</span>
        )}
      </div>
    );
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className={`push-toggle push-toggle--denied ${className}`}>
        <HiOutlineBellSlash className="push-toggle__icon push-toggle__icon--denied" />
        {showLabel && (
          <div className="push-toggle__content">
            <span className="push-toggle__label">Thông báo bị chặn</span>
            <span className="push-toggle__hint">Bật trong cài đặt trình duyệt</span>
          </div>
        )}
      </div>
    );
  }

  const handleToggle = async () => {
    if (isLoading) return;
    await toggleSubscription();
  };

  const handleTest = async () => {
    if (isLoading || !isSubscribed) return;
    await testNotification();
  };

  return (
    <div className={`push-toggle ${isSubscribed ? 'push-toggle--active' : ''} ${className}`}>
      <button
        type="button"
        className={`push-toggle__button ${isLoading ? 'push-toggle__button--loading' : ''}`}
        onClick={handleToggle}
        disabled={isLoading || !canSubscribe}
        title={isSubscribed ? 'Tắt thông báo' : 'Bật thông báo'}
      >
        {isLoading ? (
          <span className="push-toggle__spinner" />
        ) : isSubscribed ? (
          <HiOutlineBellAlert className="push-toggle__icon push-toggle__icon--active" />
        ) : (
          <HiOutlineBell className="push-toggle__icon" />
        )}
        
        {showLabel && (
          <span className="push-toggle__label">
            {isLoading 
              ? 'Đang xử lý...' 
              : isSubscribed 
                ? 'Thông báo đã bật' 
                : 'Bật thông báo'}
          </span>
        )}
      </button>

      {showTestButton && isSubscribed && (
        <button
          type="button"
          className="push-toggle__test"
          onClick={handleTest}
          disabled={isLoading}
          title="Gửi thông báo test"
        >
          Test
        </button>
      )}

      {error && (
        <div className="push-toggle__error">
          {error}
        </div>
      )}
    </div>
  );
};

export default PushNotificationToggle;
