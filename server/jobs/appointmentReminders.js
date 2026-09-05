/**
 * Cron Job: Appointment Reminders
 * Gửi thông báo nhắc nhở 1 giờ trước cuộc hẹn
 * Chạy mỗi 15 phút
 */

const cron = require('node-cron');
const db = require('../config/db');
const ThongBaoService = require('../services/ThongBaoService');

/**
 * Gửi thông báo nhắc nhở cho các cuộc hẹn sắp tới (1 giờ trước)
 */
async function guiThongBaoNhacNho() {
  try {
    console.log('[AppointmentReminders] Đang kiểm tra cuộc hẹn cần nhắc nhở...');

    // Lấy các cuộc hẹn:
    // - Trạng thái: DaXacNhan
    // - Thời gian hẹn: trong khoảng 1 giờ tới (từ 55 phút đến 65 phút nữa)
    // - Chưa gửi thông báo nhắc nhở (kiểm tra qua Payload hoặc flag)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiveMinutesBefore = new Date(now.getTime() + 55 * 60 * 1000);
    const fiveMinutesAfter = new Date(now.getTime() + 65 * 60 * 1000);

    const [cuocHenRows] = await db.execute(`
      SELECT 
        ch.CuocHenID,
        ch.ThoiGianHen,
        ch.NhanVienBanHangID,
        ch.KhachHangID,
        ch.PhongID,
        p.TenPhong,
        d.DiaChi as DiaChiPhong
      FROM cuochen ch
      LEFT JOIN phong p ON ch.PhongID = p.PhongID
      LEFT JOIN duan d ON p.DuAnID = d.DuAnID
      WHERE ch.TrangThai = 'DaXacNhan'
        AND ch.ThoiGianHen >= ?
        AND ch.ThoiGianHen <= ?
        AND ch.NhanVienBanHangID IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM thongbao tb
          WHERE tb.NguoiNhanID = ch.NhanVienBanHangID
            AND JSON_UNQUOTE(JSON_EXTRACT(tb.Payload, '$.type')) = 'cuoc_hen_nhac_nho'
            AND JSON_UNQUOTE(JSON_EXTRACT(tb.Payload, '$.cuocHenId')) = CAST(ch.CuocHenID AS CHAR)
            AND tb.TrangThai != 'DaXoa'
        )
      ORDER BY ch.ThoiGianHen ASC
    `, [fiveMinutesBefore, fiveMinutesAfter]);

    console.log(`[AppointmentReminders] Tìm thấy ${cuocHenRows.length} cuộc hẹn cần nhắc nhở`);

    let successCount = 0;
    let errorCount = 0;

    for (const cuocHen of cuocHenRows) {
      try {
        // Gửi thông báo nhắc nhở
        await ThongBaoService.thongBaoReminder(
          cuocHen.CuocHenID,
          cuocHen.NhanVienBanHangID
        );

        successCount++;
        console.log(
          `[AppointmentReminders] ✅ Đã gửi thông báo nhắc nhở cho cuộc hẹn #${cuocHen.CuocHenID} (NVBH: ${cuocHen.NhanVienBanHangID})`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `[AppointmentReminders] ❌ Lỗi gửi thông báo nhắc nhở cho cuộc hẹn #${cuocHen.CuocHenID}:`,
          error.message
        );
      }
    }

    if (cuocHenRows.length > 0) {
      console.log(
        `[AppointmentReminders] Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`
      );
    }
  } catch (error) {
    console.error('[AppointmentReminders] Lỗi khi chạy cron job:', error);
  }
}

/**
 * Khởi động cron job
 * Chạy mỗi 15 phút: *\/15 * * * *
 */
function startAppointmentReminders() {
  console.log('[AppointmentReminders] Khởi động cron job: Gửi thông báo nhắc nhở cuộc hẹn (mỗi 15 phút)');

  // Chạy ngay lần đầu để test
  guiThongBaoNhacNho();

  // Chạy mỗi 15 phút
  cron.schedule('*/15 * * * *', () => {
    guiThongBaoNhacNho();
  });
}

module.exports = {
  startAppointmentReminders,
  guiThongBaoNhacNho // Export để test
};

