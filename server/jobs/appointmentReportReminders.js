/**
 * Cron Job: Appointment Report Reminders
 * Gửi thông báo nhắc nhở báo cáo kết quả cho các cuộc hẹn đã hoàn thành nhưng chưa có báo cáo
 * Chạy mỗi 6 giờ
 */

const cron = require('node-cron');
const db = require('../config/db');
const ThongBaoService = require('../services/ThongBaoService');

/**
 * Gửi thông báo nhắc nhở báo cáo kết quả cho các cuộc hẹn đã hoàn thành
 */
async function guiThongBaoNhacBaoCao() {
  try {
    console.log('[AppointmentReportReminders] Đang kiểm tra cuộc hẹn cần nhắc báo cáo...');

    // Lấy các cuộc hẹn:
    // - Trạng thái: HoanThanh
    // - Đã hoàn thành từ 24 giờ trước (không quá cũ)
    // - Chưa có GhiChuKetQua hoặc GhiChuKetQua rỗng
    // - Chưa gửi thông báo nhắc báo cáo trong 24 giờ qua
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [cuocHenRows] = await db.execute(`
      SELECT 
        ch.CuocHenID,
        ch.CapNhatLuc,
        ch.NhanVienBanHangID,
        ch.KhachHangID,
        ch.PhongID,
        p.TenPhong,
        kh.TenDayDu as TenKhachHang
      FROM cuochen ch
      LEFT JOIN phong p ON ch.PhongID = p.PhongID
      LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
      WHERE ch.TrangThai = 'HoanThanh'
        AND ch.CapNhatLuc >= ?
        AND ch.CapNhatLuc <= ?
        AND ch.NhanVienBanHangID IS NOT NULL
        AND (
          ch.GhiChuKetQua IS NULL 
          OR ch.GhiChuKetQua = ''
          OR JSON_EXTRACT(ch.GhiChuKetQua, '$.ketQua') IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM thongbao tb
          WHERE tb.NguoiNhanID = ch.NhanVienBanHangID
            AND JSON_UNQUOTE(JSON_EXTRACT(tb.Payload, '$.type')) = 'cuoc_hen_nhac_bao_cao'
            AND JSON_UNQUOTE(JSON_EXTRACT(tb.Payload, '$.cuocHenId')) = CAST(ch.CuocHenID AS CHAR)
            AND tb.TrangThai != 'DaXoa'
            AND tb.TaoLuc >= ?
        )
      ORDER BY ch.CapNhatLuc DESC
      LIMIT 50
    `, [twoDaysAgo, oneDayAgo, oneDayAgo]);

    console.log(`[AppointmentReportReminders] Tìm thấy ${cuocHenRows.length} cuộc hẹn cần nhắc báo cáo`);

    let successCount = 0;
    let errorCount = 0;

    for (const cuocHen of cuocHenRows) {
      try {
        // Gửi thông báo nhắc báo cáo
        await ThongBaoService.thongBaoNhacBaoCaoKetQua(
          cuocHen.CuocHenID,
          cuocHen.NhanVienBanHangID
        );

        successCount++;
        console.log(
          `[AppointmentReportReminders] ✅ Đã gửi thông báo nhắc báo cáo cho cuộc hẹn #${cuocHen.CuocHenID} (NVBH: ${cuocHen.NhanVienBanHangID})`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `[AppointmentReportReminders] ❌ Lỗi gửi thông báo nhắc báo cáo cho cuộc hẹn #${cuocHen.CuocHenID}:`,
          error.message
        );
      }
    }

    if (cuocHenRows.length > 0) {
      console.log(
        `[AppointmentReportReminders] Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`
      );
    }
  } catch (error) {
    console.error('[AppointmentReportReminders] Lỗi khi chạy cron job:', error);
  }
}

/**
 * Khởi động cron job
 * Chạy mỗi 6 giờ: 0 *\/6 * * *
 */
function startAppointmentReportReminders() {
  console.log('[AppointmentReportReminders] Khởi động cron job: Gửi thông báo nhắc báo cáo (mỗi 6 giờ)');

  // Chạy ngay lần đầu để test
  guiThongBaoNhacBaoCao();

  // Chạy mỗi 6 giờ
  cron.schedule('0 */6 * * *', () => {
    guiThongBaoNhacBaoCao();
  });
}

module.exports = {
  startAppointmentReportReminders,
  guiThongBaoNhacBaoCao // Export để test
};

