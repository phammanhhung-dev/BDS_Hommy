/**
 * Hook quản lý Push Notifications
 * Sử dụng trong React components
 */

import { useState, useEffect, useCallback } from 'react';
import pushService, { setBadgeCount, clearBadge } from '../services/pushNotificationService';

/**
 * Hook để quản lý Push Notifications
 * @returns {Object} State và methods để quản lý push
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Khởi tạo và kiểm tra trạng thái
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        
        // Kiểm tra support
        const supported = pushService.constructor.isSupported();
        setIsSupported(supported);

        if (!supported) {
          setIsLoading(false);
          return;
        }

        // Kiểm tra permission
        const perm = pushService.constructor.getPermissionStatus();
        setPermission(perm);

        // Kiểm tra subscription
        const subscribed = await pushService.isSubscribed();
        setIsSubscribed(subscribed);

      } catch (err) {
        console.error('[usePushNotifications] Error checking status:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Đăng ký push notifications
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushService.subscribe();
      setIsSubscribed(true);
      setPermission('granted');
      return true;
    } catch (err) {
      setError(err.message);
      if (err.message.includes('từ chối')) {
        setPermission('denied');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hủy đăng ký
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushService.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      return await unsubscribe();
    } else {
      return await subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  // Test notification
  const testNotification = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushService.sendTestNotification();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request permission only
  const requestPermission = useCallback(async () => {
    try {
      const perm = await pushService.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      setError(err.message);
      return 'denied';
    }
  }, []);

  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    
    // Computed
    canSubscribe: isSupported && permission !== 'denied',
    isEnabled: isSupported && isSubscribed && permission === 'granted',
    
    // Methods
    subscribe,
    unsubscribe,
    toggleSubscription,
    testNotification,
    requestPermission,
    
    // Badge API
    setBadgeCount,
    clearBadge
  };
}

export default usePushNotifications;
