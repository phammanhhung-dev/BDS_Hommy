/**
 * Service Layer cho Thông báo
 * Xử lý business logic tạo và gửi thông báo cho Nhân viên Bán hàng
 * 
 * Tích hợp:
 * - In-app notifications (socket.io)
 * - Push notifications (web-push) cho notification center
 */

const ThongBaoModel = require('../models/ThongBaoModel');
const db = require('../config/db');
const { emitNotificationNew } = require('../socket/notificationHandlers');
const { getIoInstance } = require('../utils/socketIo');

// Import Push Notification helpers từ pushRoutes
let sendPushToUser;
try {
  const pushRoutes = require('../routes/pushRoutes');
  sendPushToUser = pushRoutes.sendPushToUser;
} catch (e) {
  console.warn('[ThongBaoService] Push routes not available:', e.message);
}

// ============================================
// NOTIFICATION SOUNDS & TAGS
// Mỗi loại thông báo có tag riêng để nhóm và âm thanh riêng
// ============================================
const NOTIFICATION_CONFIG = {
  // Tin nhắn
  tro_chuyen_moi: {
    tag: 'chat-message',
    icon: '/icons/icon-chat.png',
    vibrate: [100, 50, 100], // Ngắn, nhẹ
    requireInteraction: false
  },
  // Video call
  video_call: {
    tag: 'video-call',
    icon: '/icons/icon-videocall.png',
    vibrate: [300, 100, 300, 100, 300], // Dài, urgent
    requireInteraction: true // Giữ cho đến khi user tương tác
  },
  // Cuộc hẹn
  cuoc_hen_moi: {
    tag: 'appointment-new',
    icon: '/icons/icon-calendar.png',
    vibrate: [200, 100, 200],
    requireInteraction: false
  },
  cuoc_hen_cho_phe_duyet: {
    tag: 'appointment-pending',
    icon: '/icons/icon-calendar.png',
    vibrate: [200, 100, 200],
    requireInteraction: false
  },
  cuoc_hen_da_phe_duyet: {
    tag: 'appointment-approved',
    icon: '/icons/icon-check.png',
    vibrate: [100, 50, 100, 50, 100],
    requireInteraction: false
  },
  cuoc_hen_bi_tu_choi: {
    tag: 'appointment-rejected',
    icon: '/icons/icon-warning.png',
    vibrate: [300, 100, 300],
    requireInteraction: true
  },
  // Hệ thống
  default: {
    tag: 'system',
    icon: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false
  }
};

class ThongBaoService {
  /**
   * Helper: Tạo và gửi thông báo (in-app + push)
   * @param {number} nguoiNhanId - ID người nhận
   * @param {string} type - Loại thông báo (từ Payload.type)
   * @param {string} tieuDe - Tiêu đề
   * @param {string} noiDung - Nội dung
   * @param {Object} payload - Dữ liệu bổ sung
   * @param {string} url - URL để navigate khi click (optional)
   * @returns {Promise<{ThongBaoID: number}>}
   */
  static async guiThongBao(nguoiNhanId, type, tieuDe, noiDung, payload = {}, url = '/') {
    try {
      // 1. Lưu vào database (in-app)
      const thongBao = await ThongBaoModel.taoMoi({
        NguoiNhanID: nguoiNhanId,
        Kenh: 'in-app',
        TieuDe: tieuDe,
        NoiDung: noiDung,
        Payload: {
          type,
          ...payload
        },
        TrangThai: 'ChuaDoc'
      });

      // 2. Emit socket event để frontend nhận real-time (nếu đang online)
      const io = getIoInstance();
      if (io) {
        try {
          emitNotificationNew(io, nguoiNhanId, thongBao);
        } catch (socketError) {
          console.error('[ThongBaoService] Lỗi emit socket notification:', socketError);
        }
      }

      // 3. Gửi Push Notification (hiện trên notification center)
      if (sendPushToUser) {
        try {
          const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;
          
          await sendPushToUser(nguoiNhanId, {
            title: tieuDe,
            body: noiDung,
            icon: config.icon,
            tag: config.tag,
            url: url,
            vibrate: config.vibrate,
            requireInteraction: config.requireInteraction,
            data: {
              type,
              ThongBaoID: thongBao.ThongBaoID,
              ...payload
            }
          });
          
          console.log(`📱 [ThongBaoService] Push sent to user ${nguoiNhanId}: ${type}`);
        } catch (pushError) {
          // Không throw lỗi push - chỉ log
          console.warn('[ThongBaoService] Push notification failed:', pushError.message);
        }
      }

      return thongBao;
    } catch (error) {
      console.error('[ThongBaoService] Lỗi gửi thông báo:', error);
      throw error;
    }
  }

  /**
   * Thông báo: Cuộc hẹn mới được phân công
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoCuocHenMoi(cuocHenId, nhanVienId) {
    try {
      // Lấy thông tin cuộc hẹn
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen, ch.TrangThai,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang,
          da.DiaChi
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) {
        console.warn(`[ThongBaoService] Cuộc hẹn #${cuocHenId} không tồn tại`);
        return;
      }

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'cuoc_hen_moi',
        'Cuộc hẹn mới được phân công',
        `Bạn có cuộc hẹn mới với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} tại ${cuocHen.DiaChi || cuocHen.TenPhong || 'địa chỉ chưa cập nhật'}`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang,
          TenPhong: cuocHen.TenPhong,
          TieuDeTinDang: cuocHen.TieuDeTinDang
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // URL điều hướng đến chi tiết cuộc hẹn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo cuộc hẹn mới:', error);
    }
  }

  /**
   * Thông báo: Cuộc hẹn chờ phê duyệt
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoCuocHenChoPheDuyet(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'cuoc_hen_cho_phe_duyet',
        'Cuộc hẹn chờ phê duyệt',
        `Cuộc hẹn với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} đang chờ Chủ dự án phê duyệt`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // URL điều hướng
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo chờ phê duyệt:', error);
    }
  }

  /**
   * Thông báo: Cuộc hẹn đã được phê duyệt
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoCuocHenDaPheDuyet(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'cuoc_hen_da_phe_duyet',
        'Cuộc hẹn đã được phê duyệt',
        `Cuộc hẹn với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} đã được Chủ dự án phê duyệt`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // URL điều hướng
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo đã phê duyệt:', error);
    }
  }

  /**
   * Thông báo: Cuộc hẹn bị từ chối
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {string} lyDo - Lý do từ chối
   */
  static async thongBaoCuocHenTuChoi(cuocHenId, nhanVienId, lyDo) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'cuoc_hen_tu_choi',
        'Cuộc hẹn bị từ chối',
        `Cuộc hẹn với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} đã bị Chủ dự án từ chối. Lý do: ${lyDo || 'Không có lý do'}`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang,
          LyDo: lyDo
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // URL điều hướng
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo từ chối:', error);
    }
  }

  /**
   * Thông báo: Khách hàng hủy cuộc hẹn
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoKhachHuyCuocHen(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'khach_huy_cuoc_hen',
        'Khách hàng hủy cuộc hẹn',
        `${cuocHen.TenKhachHang || 'Khách hàng'} đã hủy cuộc hẹn vào ${thoiGianHen}`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang
        },
        `/nhan-vien-ban-hang/cuoc-hen` // Điều hướng đến danh sách cuộc hẹn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo khách hủy:', error);
    }
  }

  /**
   * Thông báo: Phản hồi gợi ý phòng
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {Object} data - Dữ liệu phản hồi
   * @param {number} data.KhachHangID
   * @param {number} data.TinDangID
   * @param {string} data.PhanHoi - 'Thich', 'KhongThich', 'XemNgay'
   */
  static async thongBaoPhanHoiGoiY(nhanVienId, data) {
    try {
      const { KhachHangID, TinDangID, PhanHoi } = data;

      // Lấy thông tin khách hàng và tin đăng
      const [rows] = await db.execute(`
        SELECT 
          kh.TenDayDu as TenKhachHang,
          td.TieuDe as TieuDeTinDang
        FROM nguoidung kh
        CROSS JOIN tindang td
        WHERE kh.NguoiDungID = ? AND td.TinDangID = ?
      `, [KhachHangID, TinDangID]);

      if (rows.length === 0) return;

      const info = rows[0];
      let noiDung = '';

      switch (PhanHoi) {
        case 'Thich':
          noiDung = `${info.TenKhachHang || 'Khách hàng'} đã thích gợi ý phòng "${info.TieuDeTinDang || 'tin đăng'}"`;
          break;
        case 'KhongThich':
          noiDung = `${info.TenKhachHang || 'Khách hàng'} không thích gợi ý phòng "${info.TieuDeTinDang || 'tin đăng'}"`;
          break;
        case 'XemNgay':
          noiDung = `${info.TenKhachHang || 'Khách hàng'} muốn xem ngay phòng "${info.TieuDeTinDang || 'tin đăng'}"`;
          break;
        default:
          noiDung = `${info.TenKhachHang || 'Khách hàng'} đã phản hồi gợi ý phòng "${info.TieuDeTinDang || 'tin đăng'}"`;
      }

      return await this.guiThongBao(
        nhanVienId,
        'phan_hoi_goi_y',
        'Phản hồi gợi ý phòng',
        noiDung,
        {
          KhachHangID,
          TinDangID,
          PhanHoi,
          TenKhachHang: info.TenKhachHang,
          TieuDeTinDang: info.TieuDeTinDang
        },
        `/nhan-vien-ban-hang/khach-hang/${KhachHangID}` // Điều hướng đến trang khách hàng
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo phản hồi gợi ý:', error);
    }
  }

  /**
   * Thông báo: Cuộc hẹn từ QR code
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {string} maQR - Mã QR code
   */
  static async thongBaoCuocHenTuQR(cuocHenId, nhanVienId, maQR) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'cuoc_hen_tu_qr',
        'Cuộc hẹn từ QR code',
        `${cuocHen.TenKhachHang || 'Khách hàng'} đã đặt lịch xem phòng "${cuocHen.TieuDeTinDang || 'tin đăng'}" vào ${thoiGianHen} qua QR code`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang,
          TieuDeTinDang: cuocHen.TieuDeTinDang,
          MaQR: maQR
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // Điều hướng đến chi tiết cuộc hẹn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo cuộc hẹn từ QR:', error);
    }
  }

  /**
   * Thông báo: Cọc mới cần xác nhận
   * @param {number} giaoDichId - ID giao dịch
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoCocMoi(giaoDichId, cuocHenId, nhanVienId) {
    try {
      // Lấy thông tin giao dịch và cuộc hẹn
      const [rows] = await db.execute(`
        SELECT 
          gd.GiaoDichID, gd.SoTien,
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang
        FROM giaodich gd
        LEFT JOIN cuochen ch ON gd.GiaoDichID = ch.CuocHenID
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        WHERE gd.GiaoDichID = ? AND ch.CuocHenID = ?
      `, [giaoDichId, cuocHenId]);

      if (rows.length === 0) return;

      const info = rows[0];
      const soTien = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(info.SoTien || 0);

      return await this.guiThongBao(
        nhanVienId,
        'coc_moi',
        'Cọc mới cần xác nhận',
        `${info.TenKhachHang || 'Khách hàng'} đã đặt cọc ${soTien} cho cuộc hẹn. Vui lòng xác nhận.`,
        {
          GiaoDichID: giaoDichId,
          CuocHenID: cuocHenId,
          SoTien: info.SoTien,
          TenKhachHang: info.TenKhachHang
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // Điều hướng đến chi tiết cuộc hẹn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo cọc mới:', error);
    }
  }

  /**
   * Thông báo: Tin nhắn mới trong trò chuyện
   * @param {number} cuocHoiThoaiId - ID cuộc hội thoại
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {number} tinNhanId - ID tin nhắn
   */
  static async thongBaoTroChuyenMoi(cuocHoiThoaiId, nhanVienId, tinNhanId) {
    try {
      // Lấy thông tin tin nhắn và người gửi
      const [rows] = await db.execute(`
        SELECT 
          tn.TinNhanID, tn.NoiDung, tn.ThoiGian,
          nd.TenDayDu as NguoiGuiTen,
          ch.NguCanhID, ch.NguCanhLoai
        FROM tinnhan tn
        LEFT JOIN nguoidung nd ON tn.NguoiGuiID = nd.NguoiDungID
        LEFT JOIN cuochoithoai ch ON tn.CuocHoiThoaiID = ch.CuocHoiThoaiID
        WHERE tn.TinNhanID = ? AND tn.CuocHoiThoaiID = ?
      `, [tinNhanId, cuocHoiThoaiId]);

      if (rows.length === 0) return;

      const tinNhan = rows[0];
      const noiDungRutGon = tinNhan.NoiDung?.length > 50 
        ? tinNhan.NoiDung.substring(0, 50) + '...' 
        : tinNhan.NoiDung;

      return await this.guiThongBao(
        nhanVienId,
        'tro_chuyen_moi',
        'Tin nhắn mới',
        `${tinNhan.NguoiGuiTen || 'Người dùng'}: ${noiDungRutGon || 'Tin nhắn mới'}`,
        {
          CuocHoiThoaiID: cuocHoiThoaiId,
          TinNhanID: tinNhanId,
          NguoiGuiTen: tinNhan.NguoiGuiTen,
          NoiDung: tinNhan.NoiDung,
          NguCanhID: tinNhan.NguCanhID,
          NguCanhLoai: tinNhan.NguCanhLoai
        },
        `/nhan-vien-ban-hang/tin-nhan/${cuocHoiThoaiId}` // URL điều hướng đến cuộc trò chuyện
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo tin nhắn mới:', error);
    }
  }

  /**
   * Thông báo: Video call đến
   * @param {number} cuocHoiThoaiId - ID cuộc hội thoại
   * @param {number} nguoiGoiId - ID người gọi
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {string} roomUrl - URL phòng video call
   */
  static async thongBaoVideoCall(cuocHoiThoaiId, nguoiGoiId, nhanVienId, roomUrl) {
    try {
      // Lấy thông tin người gọi
      const [rows] = await db.execute(`
        SELECT TenDayDu
        FROM nguoidung
        WHERE NguoiDungID = ?
      `, [nguoiGoiId]);

      if (rows.length === 0) return;

      const nguoiGoi = rows[0];

      return await this.guiThongBao(
        nhanVienId,
        'video_call',
        'Cuộc gọi video đến',
        `${nguoiGoi.TenDayDu || 'Người dùng'} đang gọi video cho bạn`,
        {
          CuocHoiThoaiID: cuocHoiThoaiId,
          NguoiGoiID: nguoiGoiId,
          NguoiGoiTen: nguoiGoi.TenDayDu,
          RoomUrl: roomUrl
        },
        roomUrl || `/nhan-vien-ban-hang/tin-nhan/${cuocHoiThoaiId}` // Mở room URL hoặc đến tin nhắn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo video call:', error);
    }
  }

  /**
   * Thông báo: Nhắc báo cáo kết quả cuộc hẹn
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoCanBaoCao(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'can_bao_cao',
        'Nhắc báo cáo kết quả',
        `Cuộc hẹn với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} đã kết thúc. Vui lòng báo cáo kết quả.`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang,
          TenPhong: cuocHen.TenPhong
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // Điều hướng đến chi tiết cuộc hẹn để báo cáo
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo cần báo cáo:', error);
    }
  }

  /**
   * Thông báo: Reminder 1 giờ trước cuộc hẹn
   * @param {number} cuocHenId - ID cuộc hẹn
   * @param {number} nhanVienId - ID nhân viên bán hàng
   */
  static async thongBaoReminder(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.ThoiGianHen,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          da.DiaChi
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      if (rows.length === 0) return;

      const cuocHen = rows[0];
      const thoiGianHen = new Date(cuocHen.ThoiGianHen).toLocaleString('vi-VN');

      return await this.guiThongBao(
        nhanVienId,
        'reminder',
        'Nhắc nhở cuộc hẹn',
        `Bạn có cuộc hẹn với ${cuocHen.TenKhachHang || 'khách hàng'} vào ${thoiGianHen} tại ${cuocHen.DiaChi || cuocHen.TenPhong || 'địa chỉ chưa cập nhật'}. Còn 1 giờ nữa.`,
        {
          CuocHenID: cuocHenId,
          ThoiGianHen: cuocHen.ThoiGianHen,
          TenKhachHang: cuocHen.TenKhachHang,
          TenPhong: cuocHen.TenPhong,
          DiaChi: cuocHen.DiaChi || null
        },
        `/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}` // Điều hướng đến chi tiết cuộc hẹn
      );
    } catch (error) {
      console.error('[ThongBaoService] Lỗi thông báo reminder:', error);
    }
  }
}

module.exports = ThongBaoService;

