import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

// Leaflet CSS cho Map component
import 'leaflet/dist/leaflet.css'

import App from './App.jsx'
import { ChatProvider } from './context/ChatContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext' // ✨ Auto-redirect theo vai trò
import { buildApiUrl } from './config/api'

// Setup React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút - data coi là fresh trong 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút - data giữ trong cache 10 phút
      refetchOnWindowFocus: false, // Không refetch khi user quay lại tab
      retry: 1, // Retry 1 lần nếu request fail
      refetchOnMount: true, // Refetch khi component mount (nếu data stale)
    }
  }
})

createRoot(document.getElementById('root')).render(
  // Tạm thời disable StrictMode để debug dropdown issue
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
    {/* React Query Devtools - chỉ hiện trong development */}
    {import.meta.env.MODE === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    )}
  </QueryClientProvider>
  // </StrictMode>,
)

// Register Service Worker for PWA and Push Notifications (only in production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ SW registered: ', registration);
      
      // Lắng nghe message từ Service Worker (khi click notification)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          console.log('📬 [SW Message] Notification clicked, navigating to:', event.data.url);
          // Navigate đến URL đích
          if (event.data.url && event.data.url !== window.location.pathname) {
            window.location.href = event.data.url;
          }
        }
      });
      
      // Xin quyền thông báo ngay khi mở app
      if ('PushManager' in window) {
        // Trong môi trường phát triển chúng ta bỏ qua auto-subscribe để tránh lỗi 401/400
        if (!import.meta.env.PROD) {
          console.log('🔔 [Push] Bỏ qua auto-subscribe trong dev');
        } else {
          // Nếu chưa có quyền, xin quyền ngay
          if (Notification.permission === 'default') {
            console.log('🔔 [Push] Đang xin quyền thông báo...');
            const permission = await Notification.requestPermission();
            console.log('🔔 [Push] Kết quả xin quyền:', permission);

            if (permission === 'granted') {
              await autoSubscribePush(registration);
            }
          } else if (Notification.permission === 'granted') {
            // Đã có quyền, đăng ký subscription
            await autoSubscribePush(registration);
          } else {
            console.warn('⚠️ [Push] Người dùng đã từ chối quyền thông báo');
          }
        }
      }
    } catch (error) {
      console.error('❌ SW registration failed: ', error);
    }
  });
}

// Auto-subscribe to push notifications
async function autoSubscribePush(registration) {
  try {
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Get VAPID key from server (use configured API base URL)
      const response = await fetch(buildApiUrl('/api/push/vapid-public-key'));
      const data = await response.json();

      if (!data.success || !data.publicKey) {
        console.warn('[Push] VAPID key not configured on server');
        return;
      }

      // Convert VAPID key
      const vapidKey = urlBase64ToUint8Array(data.publicKey);

      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      console.log('✅ [Push] New subscription created');
    } else {
      console.log('ℹ️ [Push] Using existing subscription');
    }

    // Send subscription to server
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    await fetch(buildApiUrl('/api/push/subscribe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      })
    });

    console.log('✅ [Push] Subscription synced to server');

  } catch (error) {
    console.error('❌ [Push] Auto-subscribe failed:', error);
  }
}

// Helper: Convert VAPID key
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
