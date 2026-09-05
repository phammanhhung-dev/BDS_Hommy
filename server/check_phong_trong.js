const db = require('./config/db');

async function checkPhongTrong() {
  try {
    console.log('=== KIỂM TRA TIN KIỂU CŨ CÓ PHÒNG TRONG ===\n');

    // 1. Tìm tin Thuê có phong_tindang với phòng TrangThai = 'Trong'
    console.log('1. Tin Thuê có phong_tindang với phòng TrangThai = Trong:');
    const [tinCoPhongTrong] = await db.execute(`
      SELECT DISTINCT td.TinDangID, td.TieuDe, td.LoaiGiaoDich, td.TrangThai, td.DuAnID
      FROM tindang td
      JOIN phong_tindang pt ON td.TinDangID = pt.TinDangID
      JOIN phong p ON pt.PhongID = p.PhongID
      WHERE td.LoaiGiaoDich = 'Thue'
        AND td.TrangThai IN ('DaDuyet', 'DaDang')
        AND p.TrangThai = 'Trong'
      ORDER BY td.TinDangID DESC
    `);
    console.table(tinCoPhongTrong);

    // 2. Chi tiết phong cho các tin tìm được
    if (tinCoPhongTrong.length > 0) {
      const tinDangIds = tinCoPhongTrong.map(t => t.TinDangID);
      console.log('\n2. Chi tiết phong cho các tin trên:');
      const placeholders = tinDangIds.map(() => '?').join(',');
      const [phongChiTiet] = await db.execute(`
        SELECT pt.TinDangID, pt.PhongID, p.TenPhong, p.TrangThai, p.GiaChuan, p.DienTichChuan
        FROM phong_tindang pt
        JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID IN (${placeholders})
        ORDER BY pt.TinDangID, p.PhongID
      `, tinDangIds);
      console.table(phongChiTiet);
    } else {
      console.log('\n2. Không tìm thấy tin kiểu cũ nào có phòng TrangThai = Trong');
    }

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkPhongTrong();
