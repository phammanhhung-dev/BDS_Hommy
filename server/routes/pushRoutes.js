/**
 * Push Notification Routes
 * Quản lý subscriptions và gửi push notifications
 * 
 * TÁI SỬ DỤNG BẢNG CÓ SẴN:
 * - nhatkyhethong: Lưu push subscriptions với HanhDong='push_subscribe'
 * - thongbao: Log thông báo đã gửi với Kenh='push'
 * 
 * @module routes/pushRoutes
 */

const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ============================================
// OPTIONAL AUTH MIDDLEWARE
// Cho phép request không có token (guest users)
// ============================================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      // Không có token - cho phép tiếp tục như guest
      req.user = null;
      return next();
    }

    // Có token - thử verify
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const [userRows] = await pool.execute(
      'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
      [decoded.userId]
    );

    if (userRows.length > 0) {
      req.user = {
        NguoiDungID: userRows[0].NguoiDungID,
        id: userRows[0].NguoiDungID,
        tenDayDu: userRows[0].TenDayDu,
        email: userRows[0].Email,
        vaiTroId: userRows[0].VaiTroHoatDongID
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Token không hợp lệ - vẫn cho phép tiếp tục như guest
    req.user = null;
    next();
  }
};

// ============================================
// CẤU HÌNH VAPID
// ============================================

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hommy.vn';

// Khởi tạo web-push với VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push VAPID đã được cấu hình');
} else {
  console.warn('⚠️ VAPID keys chưa được cấu hình. Push notifications sẽ không hoạt động.');
  console.warn('   Chạy: npx web-push generate-vapid-keys');
  console.warn('   Sau đó thêm vào .env: VAPID_PUBLIC_KEY và VAPID_PRIVATE_KEY');
}

// ============================================
// HELPER: Lấy subscriptions từ nhatkyhethong
// ============================================

/**
 * Lấy tất cả subscriptions đang active của một user
 * GiaTriTruoc = NULL nghĩa là subscription đang active
 * @param {number|null} nguoiDungId 
 */
async function getSubscriptionsByUser(nguoiDungId) {
  if (!nguoiDungId) return [];
  
  const [rows] = await pool.execute(
    `SELECT NhatKyID, DoiTuongID as Endpoint, GiaTriSau as SubscriptionData, TrinhDuyet as UserAgent
     FROM nhatkyhethong 
     WHERE HanhDong = 'push_subscribe' 
       AND DoiTuong = 'PushSubscription'
       AND NguoiDungID = ?
       AND GiaTriTruoc IS NULL`,
    [nguoiDungId]
  );
  return rows;
}

/**
 * Lấy subscription theo endpoint
 */
async function getSubscriptionByEndpoint(endpoint) {
  const [rows] = await pool.execute(
    `SELECT NhatKyID, NguoiDungID, DoiTuongID as Endpoint, GiaTriSau as SubscriptionData
     FROM nhatkyhethong 
     WHERE HanhDong = 'push_subscribe' 
       AND DoiTuong = 'PushSubscription'
       AND DoiTuongID = ?
       AND GiaTriTruoc IS NULL`,
    [endpoint]
  );
  return rows[0] || null;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/push/vapid-public-key
 * Lấy VAPID public key cho client đăng ký push
 */
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(500).json({
      success: false,
      message: 'VAPID keys chưa được cấu hình trên server'
    });
  }
  res.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
});

/**
 * POST /api/push/subscribe
 * Đăng ký nhận push notifications
 * Lưu vào bảng nhatkyhethong với HanhDong='push_subscribe'
 */
router.post('/subscribe', optionalAuth, async (req, res) => {
  try {
    const { subscription, userAgent, platform } = req.body;
    const nguoiDungId = req.user?.NguoiDungID || null;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Subscription không hợp lệ'
      });
    }

    // Kiểm tra subscription đã tồn tại chưa
    const existing = await getSubscriptionByEndpoint(subscription.endpoint);

    if (existing) {
      // Soft delete cái cũ và tạo mới (immutable log)
      await pool.execute(
        `UPDATE nhatkyhethong 
         SET GiaTriTruoc = 'unsubscribed'
         WHERE NhatKyID = ?`,
        [existing.NhatKyID]
      );
    }
    
    // Tạo subscription mới trong nhatkyhethong
    await pool.execute(
      `INSERT INTO nhatkyhethong 
       (NguoiDungID, HanhDong, DoiTuong, DoiTuongID, GiaTriTruoc, GiaTriSau, DiaChiIP, TrinhDuyet, ThoiGian)
       VALUES (?, 'push_subscribe', 'PushSubscription', ?, NULL, ?, ?, ?, NOW(3))`,
      [
        nguoiDungId, 
        subscription.endpoint,
        JSON.stringify({ ...subscription, platform: platform || 'unknown' }),
        req.ip || '::1',
        userAgent || req.headers['user-agent'] || null
      ]
    );
    
    console.log(`📱 [Push] Đăng ký subscription cho user ${nguoiDungId || 'guest'}`);

    res.json({
      success: true,
      message: 'Đăng ký push notification thành công'
    });

  } catch (error) {
    console.error('[Push] Lỗi subscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký push notification'
    });
  }
});

/**
 * POST /api/push/unsubscribe
 * Hủy đăng ký push notifications
 * Soft delete bằng cách set GiaTriTruoc = 'unsubscribed'
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint không hợp lệ'
      });
    }

    // Soft delete: đánh dấu subscription là không còn active
    await pool.execute(
      `UPDATE nhatkyhethong 
       SET GiaTriTruoc = 'unsubscribed'
       WHERE HanhDong = 'push_subscribe' 
         AND DoiTuong = 'PushSubscription'
         AND DoiTuongID = ?
         AND GiaTriTruoc IS NULL`,
      [endpoint]
    );

    console.log(`📱 [Push] Đã hủy subscription: ${endpoint.substring(0, 50)}...`);

    res.json({
      success: true,
      message: 'Đã hủy đăng ký push notification'
    });

  } catch (error) {
    console.error('[Push] Lỗi unsubscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hủy đăng ký'
    });
  }
});

/**
 * POST /api/push/update-subscription
 * Cập nhật subscription khi token thay đổi
 */
router.post('/update-subscription', optionalAuth, async (req, res) => {
  try {
    const { oldEndpoint, newSubscription } = req.body;
    const nguoiDungId = req.user?.NguoiDungID || null;

    if (!newSubscription || !newSubscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Subscription mới không hợp lệ'
      });
    }

    // Soft delete subscription cũ nếu có
    if (oldEndpoint) {
      await pool.execute(
        `UPDATE nhatkyhethong 
         SET GiaTriTruoc = 'replaced'
         WHERE HanhDong = 'push_subscribe' 
           AND DoiTuong = 'PushSubscription'
           AND DoiTuongID = ?
           AND GiaTriTruoc IS NULL`,
        [oldEndpoint]
      );
    }

    // Tạo subscription mới
    await pool.execute(
      `INSERT INTO nhatkyhethong 
       (NguoiDungID, HanhDong, DoiTuong, DoiTuongID, GiaTriTruoc, GiaTriSau, DiaChiIP, TrinhDuyet, ThoiGian)
       VALUES (?, 'push_subscribe', 'PushSubscription', ?, NULL, ?, ?, ?, NOW(3))`,
      [
        nguoiDungId, 
        newSubscription.endpoint,
        JSON.stringify(newSubscription),
        req.ip || '::1',
        req.headers['user-agent'] || null
      ]
    );

    res.json({
      success: true,
      message: 'Cập nhật subscription thành công'
    });

  } catch (error) {
    console.error('[Push] Lỗi update subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật subscription'
    });
  }
});

/**
 * POST /api/push/send
 * Gửi push notification đến user cụ thể hoặc tất cả
 * Yêu cầu quyền admin/operator
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { nguoiDungId, title, body, url, icon, badgeCount, tag } = req.body;

    // Kiểm tra quyền (chỉ admin/operator)
    const userRole = req.user?.VaiTroID;
    if (![4, 5].includes(userRole)) { // 4: Operator, 5: Admin
      return res.status(403).json({
        success: false,
        message: 'Không có quyền gửi push notification'
      });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'VAPID keys chưa được cấu hình'
      });
    }

    // Lấy subscriptions từ nhatkyhethong
    let query = `SELECT NhatKyID, NguoiDungID, DoiTuongID as Endpoint, GiaTriSau as SubscriptionData 
                 FROM nhatkyhethong 
                 WHERE HanhDong = 'push_subscribe' 
                   AND DoiTuong = 'PushSubscription'
                   AND GiaTriTruoc IS NULL`;
    let params = [];
    
    if (nguoiDungId) {
      query += ' AND NguoiDungID = ?';
      params.push(nguoiDungId);
    }

    const [subscriptions] = await pool.execute(query, params);

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: nguoiDungId 
          ? 'User này chưa đăng ký nhận thông báo' 
          : 'Không có subscription nào'
      });
    }

    // Tạo payload
    const payload = JSON.stringify({
      title: title || 'Hommy - Thông báo',
      body: body || 'Bạn có thông báo mới',
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      badgeCount: badgeCount || 0,
      tag: tag || 'hommy-notification',
      data: {
        url: url || '/',
        timestamp: Date.now()
      }
    });

    // Gửi notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = JSON.parse(sub.SubscriptionData);
          await webpush.sendNotification(subscription, payload);
          return { endpoint: sub.Endpoint, success: true };
        } catch (error) {
          // Soft delete subscription không còn hợp lệ
          if (error.statusCode === 404 || error.statusCode === 410) {
            await pool.execute(
              `UPDATE nhatkyhethong SET GiaTriTruoc = 'expired' WHERE NhatKyID = ?`,
              [sub.NhatKyID]
            );
            console.log(`📱 [Push] Đã đánh dấu subscription hết hạn: ${sub.Endpoint.substring(0, 50)}...`);
          }
          return { endpoint: sub.Endpoint, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - successful;

    console.log(`📱 [Push] Gửi ${successful}/${results.length} notifications thành công`);

    res.json({
      success: true,
      message: `Đã gửi ${successful}/${results.length} notifications`,
      details: { successful, failed, total: results.length }
    });

  } catch (error) {
    console.error('[Push] Lỗi gửi notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi push notification'
    });
  }
});

/**
 * POST /api/push/send-to-user
 * Gửi push notification đến một user cụ thể (Internal use)
 * Được gọi từ các service khác
 */
router.post('/send-to-user', async (req, res) => {
  try {
    const { nguoiDungId, title, body, url, icon, badgeCount, tag } = req.body;
    const internalKey = req.headers['x-internal-key'];

    // Kiểm tra internal key (bảo mật cho internal calls)
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!nguoiDungId) {
      return res.status(400).json({
        success: false,
        message: 'nguoiDungId là bắt buộc'
      });
    }

    const result = await sendPushToUser(nguoiDungId, { title, body, url, icon, badgeCount, tag });
    res.json(result);

  } catch (error) {
    console.error('[Push] Lỗi send-to-user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi notification'
    });
  }
});

/**
 * POST /api/push/test
 * Test push notification cho chính user đang đăng nhập
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const nguoiDungId = req.user?.NguoiDungID;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'VAPID keys chưa được cấu hình. Liên hệ admin.'
      });
    }

    const subscriptions = await getSubscriptionsByUser(nguoiDungId);

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký nhận thông báo. Hãy bật thông báo trong cài đặt app.'
      });
    }

    const subscription = JSON.parse(subscriptions[0].SubscriptionData);
    const payload = JSON.stringify({
      title: '🎉 Test thành công!',
      body: 'Push notification đã hoạt động. Bạn sẽ nhận được thông báo khi có tin mới.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      badgeCount: 1,
      tag: 'test-notification',
      data: {
        url: '/',
        timestamp: Date.now(),
        type: 'test'
      }
    });

    await webpush.sendNotification(subscription, payload);

    console.log(`📱 [Push] Test notification sent to user ${nguoiDungId}`);

    res.json({
      success: true,
      message: 'Đã gửi test notification'
    });

  } catch (error) {
    console.error('[Push] Lỗi test:', error);
    
    // Xử lý lỗi subscription hết hạn
    if (error.statusCode === 404 || error.statusCode === 410) {
      return res.status(400).json({
        success: false,
        message: 'Subscription đã hết hạn. Vui lòng đăng ký lại.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi gửi test notification: ' + error.message
    });
  }
});

/**
 * GET /api/push/status
 * Kiểm tra trạng thái subscription của user
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const nguoiDungId = req.user?.NguoiDungID;

    const [result] = await pool.execute(
      `SELECT COUNT(*) as count FROM nhatkyhethong 
       WHERE HanhDong = 'push_subscribe' 
         AND DoiTuong = 'PushSubscription'
         AND NguoiDungID = ?
         AND GiaTriTruoc IS NULL`,
      [nguoiDungId]
    );

    const isSubscribed = result[0].count > 0;

    res.json({
      success: true,
      isSubscribed,
      vapidConfigured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
    });

  } catch (error) {
    console.error('[Push] Lỗi check status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái'
    });
  }
});

// ============================================
// HELPER FUNCTIONS (Export cho các service khác)
// ============================================

/**
 * Gửi push notification đến một user
 * Sử dụng bảng nhatkyhethong để lưu subscriptions
 * @param {number} nguoiDungId - ID người dùng
 * @param {object} notification - Nội dung notification
 *   - title: string
 *   - body: string
 *   - icon: string (optional)
 *   - tag: string (optional) - để nhóm notifications cùng loại
 *   - url: string (optional) - URL khi click
 *   - vibrate: number[] (optional) - pattern rung
 *   - requireInteraction: boolean (optional) - giữ notification đến khi user interact
 *   - data: object (optional) - dữ liệu bổ sung
 */
async function sendPushToUser(nguoiDungId, notification) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys chưa cấu hình');
    return { success: false, message: 'VAPID not configured' };
  }

  try {
    const subscriptions = await getSubscriptionsByUser(nguoiDungId);

    if (subscriptions.length === 0) {
      return { success: false, message: 'No subscription found' };
    }

    const payload = JSON.stringify({
      title: notification.title || 'Hommy - Thông báo',
      body: notification.body || 'Bạn có thông báo mới',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: notification.tag || 'hommy-notification',
      url: notification.url || '/',
      vibrate: notification.vibrate || [200, 100, 200],
      requireInteraction: notification.requireInteraction || false,
      renotify: true, // Luôn thông báo lại dù cùng tag
      silent: false, // Cho phép âm thanh
      badgeCount: notification.badgeCount || 0,
      data: {
        url: notification.url || '/',
        timestamp: Date.now(),
        ...notification.data
      }
    });

    let successCount = 0;
    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.SubscriptionData);
        await webpush.sendNotification(subscription, payload);
        successCount++;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Soft delete subscription hết hạn
          await pool.execute(
            `UPDATE nhatkyhethong SET GiaTriTruoc = 'expired' WHERE NhatKyID = ?`,
            [sub.NhatKyID]
          );
        }
      }
    }

    return { success: successCount > 0, sent: successCount, total: subscriptions.length };
  } catch (error) {
    console.error('[Push] sendPushToUser error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Gửi push notification đến nhiều users
 * @param {number[]} nguoiDungIds - Danh sách ID người dùng
 * @param {object} notification - Nội dung notification
 */
async function sendPushToUsers(nguoiDungIds, notification) {
  const results = await Promise.allSettled(
    nguoiDungIds.map(id => sendPushToUser(id, notification))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  return { success: successful > 0, sent: successful, total: nguoiDungIds.length };
}

/**
 * Gửi push notification broadcast đến tất cả users
 * @param {object} notification - Nội dung notification
 */
async function sendPushBroadcast(notification) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, message: 'VAPID not configured' };
  }

  try {
    const [subscriptions] = await pool.execute(
      `SELECT NhatKyID, NguoiDungID, DoiTuongID as Endpoint, GiaTriSau as SubscriptionData 
       FROM nhatkyhethong 
       WHERE HanhDong = 'push_subscribe' 
         AND DoiTuong = 'PushSubscription'
         AND GiaTriTruoc IS NULL`
    );

    if (subscriptions.length === 0) {
      return { success: false, message: 'No subscriptions' };
    }

    const payload = JSON.stringify({
      title: notification.title || 'Hommy - Thông báo',
      body: notification.body || 'Bạn có thông báo mới',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: notification.tag || 'hommy-broadcast',
      data: {
        url: notification.url || '/',
        timestamp: Date.now()
      }
    });

    let successCount = 0;
    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.SubscriptionData);
        await webpush.sendNotification(subscription, payload);
        successCount++;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await pool.execute(
            `UPDATE nhatkyhethong SET GiaTriTruoc = 'expired' WHERE NhatKyID = ?`,
            [sub.NhatKyID]
          );
        }
      }
    }

    console.log(`📱 [Push] Broadcast sent: ${successCount}/${subscriptions.length}`);
    return { success: successCount > 0, sent: successCount, total: subscriptions.length };
  } catch (error) {
    console.error('[Push] Broadcast error:', error);
    return { success: false, message: error.message };
  }
}

// Export helper functions
module.exports = router;
module.exports.sendPushToUser = sendPushToUser;
module.exports.sendPushToUsers = sendPushToUsers;
module.exports.sendPushBroadcast = sendPushBroadcast;
