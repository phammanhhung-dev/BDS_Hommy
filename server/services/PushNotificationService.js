/**
 * Push Notification Service
 * Service quản lý và gửi push notifications
 * 
 * TÁI SỬ DỤNG BẢNG CÓ SẴN:
 * - nhatkyhethong: Lưu push subscriptions với HanhDong='push_subscribe'
 * - thongbao: Log thông báo đã gửi với Kenh='push'
 * 
 * @module services/PushNotificationService
 */

const webpush = require('web-push');
const pool = require('../config/db');

// ============================================
// CẤU HÌNH VAPID
// ============================================

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hommy.vn';

// Khởi tạo web-push với VAPID keys
let isConfigured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  isConfigured = true;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

const NotificationType = {
  // Cuộc hẹn
  CUOC_HEN_MOI: 'cuoc_hen_moi',
  CUOC_HEN_XAC_NHAN: 'cuoc_hen_xac_nhan',
  CUOC_HEN_HUY: 'cuoc_hen_huy',
  CUOC_HEN_NHAC_NHO: 'cuoc_hen_nhac_nho',
  
  // Tin đăng
  TIN_DANG_DUYET: 'tin_dang_duyet',
  TIN_DANG_TU_CHOI: 'tin_dang_tu_choi',
  TIN_DANG_HET_HAN: 'tin_dang_het_han',
  
  // Chat
  TIN_NHAN_MOI: 'tin_nhan_moi',
  
  // Cọc & Thanh toán
  COC_MOI: 'coc_moi',
  COC_XAC_NHAN: 'coc_xac_nhan',
  COC_HET_HAN: 'coc_het_han',
  THANH_TOAN_THANH_CONG: 'thanh_toan_thanh_cong',
  
  // Hệ thống
  THONG_BAO_HE_THONG: 'thong_bao_he_thong',
  CAP_NHAT_APP: 'cap_nhat_app'
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

const NotificationTemplates = {
  [NotificationType.CUOC_HEN_MOI]: {
    title: '📅 Cuộc hẹn mới',
    body: (data) => `Bạn có cuộc hẹn xem phòng mới vào ${data.thoiGian}`,
    url: (data) => `/cuoc-hen/${data.cuocHenId}`
  },
  [NotificationType.CUOC_HEN_XAC_NHAN]: {
    title: '✅ Cuộc hẹn đã xác nhận',
    body: (data) => `Cuộc hẹn xem phòng "${data.tenPhong}" đã được xác nhận`,
    url: (data) => `/cuoc-hen/${data.cuocHenId}`
  },
  [NotificationType.CUOC_HEN_HUY]: {
    title: '❌ Cuộc hẹn đã hủy',
    body: (data) => `Cuộc hẹn xem phòng "${data.tenPhong}" đã bị hủy. Lý do: ${data.lyDo || 'Không rõ'}`,
    url: (data) => `/cuoc-hen`
  },
  [NotificationType.CUOC_HEN_NHAC_NHO]: {
    title: '⏰ Nhắc nhở cuộc hẹn',
    body: (data) => `Bạn có cuộc hẹn xem phòng trong ${data.thoiGianCon}`,
    url: (data) => `/cuoc-hen/${data.cuocHenId}`
  },
  [NotificationType.TIN_DANG_DUYET]: {
    title: '🎉 Tin đăng được duyệt',
    body: (data) => `Tin đăng "${data.tieuDe}" đã được duyệt và hiển thị trên hệ thống`,
    url: (data) => `/tin-dang/${data.tinDangId}`
  },
  [NotificationType.TIN_DANG_TU_CHOI]: {
    title: '⚠️ Tin đăng bị từ chối',
    body: (data) => `Tin đăng "${data.tieuDe}" không được duyệt. Lý do: ${data.lyDo || 'Không đạt yêu cầu'}`,
    url: (data) => `/chu-du-an/tin-dang/${data.tinDangId}`
  },
  [NotificationType.TIN_NHAN_MOI]: {
    title: '💬 Tin nhắn mới',
    body: (data) => `${data.tenNguoiGui}: ${data.noiDung.substring(0, 50)}${data.noiDung.length > 50 ? '...' : ''}`,
    url: (data) => `/chat/${data.conversationId}`
  },
  [NotificationType.COC_MOI]: {
    title: '💰 Yêu cầu đặt cọc mới',
    body: (data) => `Khách hàng yêu cầu đặt cọc phòng "${data.tenPhong}"`,
    url: (data) => `/chu-du-an/coc/${data.cocId}`
  },
  [NotificationType.COC_XAC_NHAN]: {
    title: '✅ Đặt cọc thành công',
    body: (data) => `Đặt cọc phòng "${data.tenPhong}" đã được xác nhận`,
    url: (data) => `/coc/${data.cocId}`
  },
  [NotificationType.THANH_TOAN_THANH_CONG]: {
    title: '💳 Thanh toán thành công',
    body: (data) => `Giao dịch ${data.soTien} đã được xác nhận`,
    url: (data) => `/vi/lich-su`
  },
  [NotificationType.THONG_BAO_HE_THONG]: {
    title: '📢 Thông báo từ Hommy',
    body: (data) => data.noiDung,
    url: (data) => data.url || '/'
  }
};

// ============================================
// PUSH SERVICE CLASS
// ============================================

class PushNotificationService {
  
  /**
   * Kiểm tra VAPID đã được cấu hình chưa
   */
  static isConfigured() {
    return isConfigured;
  }

  /**
   * Lấy VAPID public key
   */
  static getPublicKey() {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Gửi push notification đến một user
   * Sử dụng bảng nhatkyhethong để lấy subscriptions
   * @param {number} nguoiDungId - ID người dùng
   * @param {string} type - Loại notification (từ NotificationType)
   * @param {object} data - Dữ liệu để render template
   */
  static async sendToUser(nguoiDungId, type, data = {}) {
    if (!isConfigured) {
      console.warn('[PushService] VAPID not configured, skipping push');
      return { success: false, reason: 'not_configured' };
    }

    try {
      // Lấy subscriptions của user từ nhatkyhethong
      const [subscriptions] = await pool.execute(
        `SELECT NhatKyID, DoiTuongID as Endpoint, GiaTriSau as SubscriptionData
         FROM nhatkyhethong 
         WHERE HanhDong = 'push_subscribe' 
           AND DoiTuong = 'PushSubscription'
           AND NguoiDungID = ?
           AND GiaTriTruoc IS NULL`,
        [nguoiDungId]
      );

      if (subscriptions.length === 0) {
        return { success: false, reason: 'no_subscription' };
      }

      // Tạo notification từ template
      const template = NotificationTemplates[type] || NotificationTemplates[NotificationType.THONG_BAO_HE_THONG];
      const notification = {
        title: data.title || template.title,
        body: typeof template.body === 'function' ? template.body(data) : data.body || template.body,
        url: typeof template.url === 'function' ? template.url(data) : data.url || '/',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag || type,
        badgeCount: data.badgeCount || 0
      };

      const payload = JSON.stringify({
        ...notification,
        data: {
          url: notification.url,
          type: type,
          timestamp: Date.now(),
          ...data
        }
      });

      // Gửi đến tất cả subscriptions của user
      let successCount = 0;
      for (const sub of subscriptions) {
        try {
          const subscription = JSON.parse(sub.SubscriptionData);
          await webpush.sendNotification(subscription, payload);
          successCount++;
        } catch (error) {
          // Soft delete subscription hết hạn
          if (error.statusCode === 404 || error.statusCode === 410) {
            await pool.execute(
              `UPDATE nhatkyhethong SET GiaTriTruoc = 'expired' WHERE NhatKyID = ?`,
              [sub.NhatKyID]
            );
            console.log(`[PushService] Marked expired subscription for user ${nguoiDungId}`);
          } else {
            console.error(`[PushService] Failed to send to subscription:`, error.message);
          }
        }
      }

      console.log(`📱 [PushService] Sent ${type} to user ${nguoiDungId}: ${successCount}/${subscriptions.length}`);
      
      // Log vào bảng thongbao với Kenh = 'push'
      if (successCount > 0) {
        await this.logToThongBao(nguoiDungId, notification, type, data);
      }
      
      return { success: successCount > 0, sent: successCount, total: subscriptions.length };

    } catch (error) {
      console.error('[PushService] sendToUser error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Ghi log thông báo push vào bảng thongbao có sẵn
   * Tái sử dụng schema hiện tại với Kenh = 'push'
   * @param {number} nguoiNhanId - ID người nhận
   * @param {object} notification - Nội dung notification
   * @param {string} type - Loại notification
   * @param {object} data - Dữ liệu bổ sung
   */
  static async logToThongBao(nguoiNhanId, notification, type, data = {}) {
    try {
      const payload = JSON.stringify({
        type: type,
        url: notification.url,
        ...data
      });
      
      await pool.execute(
        `INSERT INTO thongbao (NguoiNhanID, Kenh, TieuDe, NoiDung, Payload, TrangThai, GuiLuc)
         VALUES (?, 'push', ?, ?, ?, 'DaGui', NOW())`,
        [
          nguoiNhanId,
          notification.title,
          notification.body,
          payload
        ]
      );
    } catch (error) {
      // Không throw lỗi để không ảnh hưởng push - chỉ log
      console.error('[PushService] Failed to log to thongbao:', error.message);
    }
  }

  /**
   * Gửi push notification đến nhiều users
   * @param {number[]} nguoiDungIds - Danh sách ID người dùng
   * @param {string} type - Loại notification
   * @param {object} data - Dữ liệu template
   */
  static async sendToUsers(nguoiDungIds, type, data = {}) {
    const results = await Promise.allSettled(
      nguoiDungIds.map(id => this.sendToUser(id, type, data))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    return { success: successful > 0, sent: successful, total: nguoiDungIds.length };
  }

  /**
   * Gửi push notification broadcast
   * @param {string} type - Loại notification
   * @param {object} data - Dữ liệu template
   * @param {object} filter - Điều kiện lọc users (optional)
   */
  static async broadcast(type, data = {}, filter = {}) {
    if (!isConfigured) {
      return { success: false, reason: 'not_configured' };
    }

    try {
      let query = `SELECT DISTINCT NguoiDungID 
                   FROM nhatkyhethong 
                   WHERE HanhDong = 'push_subscribe' 
                     AND DoiTuong = 'PushSubscription'
                     AND GiaTriTruoc IS NULL 
                     AND NguoiDungID IS NOT NULL`;
      const params = [];

      // Có thể thêm filter theo role, etc.
      if (filter.vaiTroId) {
        query = `
          SELECT DISTINCT nk.NguoiDungID 
          FROM nhatkyhethong nk
          JOIN nguoidung nd ON nk.NguoiDungID = nd.NguoiDungID
          WHERE nk.HanhDong = 'push_subscribe' 
            AND nk.DoiTuong = 'PushSubscription'
            AND nk.GiaTriTruoc IS NULL 
            AND nd.VaiTroHoatDongID = ?
        `;
        params.push(filter.vaiTroId);
      }

      const [users] = await pool.execute(query, params);
      const nguoiDungIds = users.map(u => u.NguoiDungID);

      if (nguoiDungIds.length === 0) {
        return { success: false, reason: 'no_users' };
      }

      return await this.sendToUsers(nguoiDungIds, type, data);
    } catch (error) {
      console.error('[PushService] Broadcast error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gửi thông báo cuộc hẹn mới
   */
  static async notifyCuocHenMoi(nguoiDungId, cuocHenData) {
    return await this.sendToUser(nguoiDungId, NotificationType.CUOC_HEN_MOI, cuocHenData);
  }

  /**
   * Gửi thông báo cuộc hẹn được xác nhận
   */
  static async notifyCuocHenXacNhan(nguoiDungId, cuocHenData) {
    return await this.sendToUser(nguoiDungId, NotificationType.CUOC_HEN_XAC_NHAN, cuocHenData);
  }

  /**
   * Gửi nhắc nhở cuộc hẹn
   */
  static async notifyCuocHenNhacNho(nguoiDungId, cuocHenData) {
    return await this.sendToUser(nguoiDungId, NotificationType.CUOC_HEN_NHAC_NHO, cuocHenData);
  }

  /**
   * Gửi thông báo tin đăng được duyệt
   */
  static async notifyTinDangDuyet(nguoiDungId, tinDangData) {
    return await this.sendToUser(nguoiDungId, NotificationType.TIN_DANG_DUYET, tinDangData);
  }

  /**
   * Gửi thông báo tin đăng bị từ chối
   */
  static async notifyTinDangTuChoi(nguoiDungId, tinDangData) {
    return await this.sendToUser(nguoiDungId, NotificationType.TIN_DANG_TU_CHOI, tinDangData);
  }

  /**
   * Gửi thông báo tin nhắn mới
   */
  static async notifyTinNhanMoi(nguoiDungId, messageData) {
    return await this.sendToUser(nguoiDungId, NotificationType.TIN_NHAN_MOI, messageData);
  }

  /**
   * Gửi thông báo đặt cọc mới
   */
  static async notifyCocMoi(nguoiDungId, cocData) {
    return await this.sendToUser(nguoiDungId, NotificationType.COC_MOI, cocData);
  }

  /**
   * Gửi thông báo thanh toán thành công
   */
  static async notifyThanhToan(nguoiDungId, paymentData) {
    return await this.sendToUser(nguoiDungId, NotificationType.THANH_TOAN_THANH_CONG, paymentData);
  }

  /**
   * Gửi thông báo hệ thống
   */
  static async notifySystem(nguoiDungId, message, url = '/') {
    return await this.sendToUser(nguoiDungId, NotificationType.THONG_BAO_HE_THONG, {
      noiDung: message,
      url: url
    });
  }

  /**
   * Cập nhật badge count cho user
   */
  static async updateBadge(nguoiDungId, count) {
    return await this.sendToUser(nguoiDungId, NotificationType.THONG_BAO_HE_THONG, {
      title: '', // Silent notification
      body: '',
      badgeCount: count,
      tag: 'badge-update'
    });
  }
}

// Export
module.exports = PushNotificationService;
module.exports.NotificationType = NotificationType;
