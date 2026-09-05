/**
 * Push Notification Service cho PWA (Frontend)
 * Quản lý đăng ký, hủy đăng ký và thông báo đẩy
 * 
 * @module services/pushNotificationService
 */

import { API_BASE_URL } from '../config/api';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Chuyển đổi VAPID key từ base64 sang Uint8Array
 * @param {string} base64String - VAPID public key dạng base64
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Lấy token từ localStorage
 */
function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

// ============================================
// PUSH NOTIFICATION SERVICE
// ============================================

class PushNotificationService {
  constructor() {
    this.vapidPublicKey = null;
    this.subscription = null;
    this.isInitialized = false;
  }

  // ========================================
  // CHECK SUPPORT
  // ========================================

  /**
   * Kiểm tra browser có hỗ trợ Push Notifications không
   */
  static isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Kiểm tra quyền notification hiện tại
   * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
   */
  static getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Kiểm tra app đã được cài đặt (PWA) chưa
   */
  static isAppInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Khởi tạo service - lấy VAPID key từ server
   */
  async init() {
    if (this.isInitialized) return true;

    if (!PushNotificationService.isSupported()) {
      console.warn('[Push] Push notifications không được hỗ trợ trên trình duyệt này');
      return false;
    }

    try {
      // Lấy VAPID public key từ server
      const response = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
      const data = await response.json();

      if (data.success && data.publicKey) {
        this.vapidPublicKey = data.publicKey;
        this.isInitialized = true;
        console.log('[Push] Service initialized successfully');
        return true;
      } else {
        console.warn('[Push] VAPID key chưa được cấu hình trên server');
        return false;
      }
    } catch (error) {
      console.error('[Push] Lỗi khởi tạo push service:', error);
      return false;
    }
  }

  // ========================================
  // PERMISSION & SUBSCRIPTION
  // ========================================

  /**
   * Yêu cầu quyền notification từ user
   * @returns {Promise<'granted' | 'denied' | 'default'>}
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Trình duyệt không hỗ trợ thông báo');
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  }

  /**
   * Đăng ký nhận push notifications
   * @returns {Promise<PushSubscription>}
   */
  async subscribe() {
    // Khởi tạo nếu chưa
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Không thể khởi tạo push service');
      }
    }

    // Kiểm tra quyền
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Người dùng từ chối quyền thông báo');
    }

    // Lấy service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Kiểm tra subscription hiện có
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Tạo subscription mới
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(this.vapidPublicKey)
      });
      console.log('[Push] Tạo subscription mới');
    } else {
      console.log('[Push] Sử dụng subscription hiện có');
    }

    this.subscription = subscription;

    // Gửi subscription lên server
    await this.saveSubscriptionToServer(subscription);

    return subscription;
  }

  /**
   * Hủy đăng ký push notifications
   */
  async unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Hủy trên browser
      await subscription.unsubscribe();
      
      // Xóa trên server
      await this.removeSubscriptionFromServer(subscription);
      
      this.subscription = null;
      console.log('[Push] Đã hủy đăng ký');
      return true;
    }

    return false;
  }

  /**
   * Kiểm tra trạng thái subscription hiện tại
   */
  async getSubscription() {
    if (!PushNotificationService.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra user đã đăng ký push chưa
   */
  async isSubscribed() {
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  // ========================================
  // SERVER COMMUNICATION
  // ========================================

  /**
   * Gửi subscription lên server
   */
  async saveSubscriptionToServer(subscription) {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Không thể lưu subscription');
    }

    console.log('[Push] Đã lưu subscription lên server');
    return data;
  }

  /**
   * Xóa subscription khỏi server
   */
  async removeSubscriptionFromServer(subscription) {
    const token = getAuthToken();

    try {
      const response = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[Push] Lỗi xóa subscription:', error);
      return false;
    }
  }

  /**
   * Kiểm tra trạng thái đăng ký trên server
   */
  async checkServerStatus() {
    const token = getAuthToken();
    
    if (!token) {
      return { isSubscribed: false, vapidConfigured: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/push/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('[Push] Lỗi kiểm tra status:', error);
      return { isSubscribed: false, vapidConfigured: false };
    }
  }

  /**
   * Gửi test notification
   */
  async sendTestNotification() {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để test notification');
    }

    const response = await fetch(`${API_BASE_URL}/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Lỗi gửi test notification');
    }

    return data;
  }
}

// ============================================
// BADGE API
// ============================================

/**
 * Đặt badge count trên app icon
 * @param {number} count - Số lượng hiển thị
 */
export async function setBadgeCount(count) {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
      console.log('[Badge] Đã đặt badge:', count);
      return true;
    } catch (error) {
      console.error('[Badge] Lỗi đặt badge:', error);
      return false;
    }
  }
  console.warn('[Badge] Badge API không được hỗ trợ');
  return false;
}

/**
 * Xóa badge
 */
export async function clearBadge() {
  if ('clearAppBadge' in navigator) {
    try {
      await navigator.clearAppBadge();
      console.log('[Badge] Đã xóa badge');
      return true;
    } catch (error) {
      console.error('[Badge] Lỗi xóa badge:', error);
      return false;
    }
  }
  return false;
}

// ============================================
// LOCAL NOTIFICATIONS (Test/Fallback)
// ============================================

/**
 * Hiển thị notification local (không qua push server)
 */
export async function showLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    throw new Error('Trình duyệt không hỗ trợ thông báo');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Không có quyền hiển thị thông báo');
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    return registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/badge-72x72.png',
      tag: options.tag || 'hommy-local',
      renotify: options.renotify || false,
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200],
      data: options.data || { url: '/' },
      actions: options.actions || []
    });
  } catch (error) {
    // Fallback to basic Notification API
    return new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/icons/icon-192x192.png',
      tag: options.tag || 'hommy-local'
    });
  }
}

// ============================================
// EXPORTS
// ============================================

// Singleton instance
const pushService = new PushNotificationService();

export default pushService;
export { PushNotificationService };
