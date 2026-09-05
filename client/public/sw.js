/**
 * Service Worker cho Hommy PWA
 * Xử lý Push Notifications, Caching, Background Sync
 * 
 * @version 2.0.0
 */

const CACHE_VERSION = 'hommy-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static assets để cache
const STATIC_ASSETS = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/icons/icon.svg',
  '/Hommy_Logo_Web.svg'
];

// Nếu đang chạy trên localhost (môi trường dev), tự động unregister để tránh cache cũ
if (typeof self !== 'undefined' && self.location && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1')) {
  console.log('[SW] Detected localhost - attempting to unregister and clear caches to avoid dev cache issues');
  // Unregister self and clear caches
  try {
    self.registration.unregister().then(() => {
      caches.keys().then((names) => Promise.all(names.map(n => caches.delete(n)))).catch(()=>{});
    }).catch(()=>{});
  } catch (e) {
    console.warn('[SW] Auto-unregister failed:', e && e.message);
  }
}

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Kích hoạt ngay
  );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('hommy-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => self.clients.claim()) // Kiểm soát tất cả clients ngay
  );
});

// ============================================
// FETCH EVENT (Caching Strategy)
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua requests không phải HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;

  // Bỏ qua API calls (không cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network first for HTML, Cache first for assets
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

// Network First strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/');
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return fallback nếu có
    return new Response('Offline', { status: 503 });
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  // Default notification data
  let notificationData = {
    title: 'Hommy - Thông báo mới',
    body: 'Bạn có thông báo mới',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'hommy-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false, // Cho phép âm thanh mặc định của hệ thống
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Parse data từ push event
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        renotify: payload.renotify !== undefined ? payload.renotify : true,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || notificationData.vibrate,
        silent: payload.silent || false,
        data: {
          ...notificationData.data,
          ...payload.data,
          url: payload.data?.url || payload.url || notificationData.data.url
        }
      };

      // Cập nhật badge count nếu có
      if (payload.badgeCount !== undefined && 'setAppBadge' in navigator) {
        if (payload.badgeCount > 0) {
          navigator.setAppBadge(payload.badgeCount).catch(console.error);
        } else {
          navigator.clearAppBadge().catch(console.error);
        }
      }
    } catch (e) {
      // Nếu không phải JSON, dùng text làm body
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
      console.error('[SW] Error parsing push data:', e);
    }
  }

  console.log('[SW] Showing notification:', notificationData.title);

  // Hiển thị notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      renotify: notificationData.renotify,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      silent: notificationData.silent,
      data: notificationData.data,
      actions: [
        { action: 'open', title: 'Xem chi tiết' },
        { action: 'dismiss', title: 'Bỏ qua' }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// ============================================
// NOTIFICATION CLICK
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);

  // Đóng notification
  event.notification.close();

  // Xử lý action "Bỏ qua"
  if (event.action === 'dismiss') {
    return;
  }

  // Lấy URL để điều hướng từ notification data
  const notificationData = event.notification.data || {};
  let urlToOpen = notificationData.url || '/';
  
  // Nếu URL là tương đối, chuyển thành URL đầy đủ
  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }

  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Tìm window đang mở của app
        for (const client of windowClients) {
          // Kiểm tra xem có window nào của app đang mở không
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('[SW] Found existing window, navigating...');
            
            // Focus vào window hiện có
            return client.focus().then((focusedClient) => {
              // Điều hướng đến URL đích
              if ('navigate' in focusedClient) {
                return focusedClient.navigate(urlToOpen);
              }
              // Fallback: post message để app tự navigate
              focusedClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: urlToOpen,
                data: notificationData
              });
              return focusedClient;
            });
          }
        }
        
        // Nếu không có window nào mở, mở window mới
        console.log('[SW] No existing window, opening new...');
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error);
        // Fallback: mở window mới nếu có lỗi
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// NOTIFICATION CLOSE
// ============================================

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
  // Có thể track analytics ở đây
});

// ============================================
// PUSH SUBSCRIPTION CHANGE
// ============================================

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    })
    .then((newSubscription) => {
      // Gửi subscription mới lên server
      return fetch('/api/push/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          newSubscription: newSubscription.toJSON()
        })
      });
    })
    .catch((error) => {
      console.error('[SW] Failed to update subscription:', error);
    })
  );
});

// ============================================
// BACKGROUND SYNC (Optional)
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Sync pending messages khi có mạng trở lại
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const pendingMessages = await cache.match('pending-messages');
    
    if (pendingMessages) {
      const messages = await pendingMessages.json();
      // Gửi messages lên server
      for (const msg of messages) {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg)
        });
      }
      // Xóa pending messages
      await cache.delete('pending-messages');
    }
  } catch (error) {
    console.error('[SW] Sync messages failed:', error);
  }
}

// ============================================
// MESSAGE HANDLER (Communication with main app)
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);

