/**
 * Test helpers cho Nhan Vien Ban Hang module
 * Setup/teardown, create test data
 */

const db = require('../../config/db');

/**
 * Tạo test user với vai trò NhanVienBanHang
 * @param {string} [suffix] - Suffix để tạo unique email/phone
 */
async function createTestNVBH(suffix = '') {
  const timestamp = Date.now();
  const uniqueSuffix = suffix || timestamp;
  const email = `test.nvbh.${uniqueSuffix}@test.com`;
  const phone = `0123456${String(uniqueSuffix).slice(-4)}`;
  
  const [result] = await db.execute(
    `INSERT INTO nguoidung (TenDayDu, Email, SoDienThoai, MatKhauHash, TrangThai, VaiTroHoatDongID)
     VALUES (?, ?, ?, ?, 'HoatDong', ?)`,
    [`Test NVBH ${uniqueSuffix}`, email, phone, '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 4] // Assuming 4 is NhanVienBanHang role ID
  );
  
  const nvbhId = result.insertId;
  
  // Lấy một KhuVucID hợp lệ từ database (ưu tiên cấp tỉnh/thành phố - ParentKhuVucID IS NULL)
  const [khuVucRows] = await db.execute(
    'SELECT KhuVucID FROM khuvuc WHERE ParentKhuVucID IS NULL LIMIT 1'
  );
  const khuVucId = khuVucRows[0]?.KhuVucID || null;
  
  if (!khuVucId) {
    throw new Error('Không tìm thấy KhuVucID hợp lệ trong database');
  }
  
  // Tạo hồ sơ nhân viên
  await db.execute(
    `INSERT INTO hosonhanvien (NguoiDungID, TyLeHoaHong, KhuVucChinhID)
     VALUES (?, 5.0, ?)`, // 5% commission rate
    [nvbhId, khuVucId]
  );
  
  return nvbhId;
}

/**
 * Tạo test customer
 * @param {string} [suffix] - Suffix để tạo unique email/phone
 */
async function createTestCustomer(suffix = '') {
  const timestamp = Date.now();
  const uniqueSuffix = suffix || timestamp;
  const email = `test.customer.${uniqueSuffix}@test.com`;
  const phone = `0987654${String(uniqueSuffix).slice(-4)}`;
  
  const [result] = await db.execute(
    `INSERT INTO nguoidung (TenDayDu, Email, SoDienThoai, MatKhauHash, TrangThai, VaiTroHoatDongID)
     VALUES (?, ?, ?, ?, 'HoatDong', 1)`, // Assuming 1 is KhachHang role ID
    [`Test Customer ${uniqueSuffix}`, email, phone, '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk']
  );
  
  return result.insertId;
}

/**
 * Tạo test project và tin đăng
 */
async function createTestTinDang(chuDuAnId) {
  // Tạo dự án
  const [duAnResult] = await db.execute(
    `INSERT INTO duan (ChuDuAnID, TenDuAn, DiaChi, TrangThai)
     VALUES (?, ?, ?, 'HoatDong')`,
    [chuDuAnId, 'Test Du An', '123 Test Street']
  );
  
  const duAnId = duAnResult.insertId;
  
  // Tạo tin đăng (không có cột Gia - giá được lưu trong phong.GiaChuan hoặc phong_tindang.GiaTinDang)
  const [tinDangResult] = await db.execute(
    `INSERT INTO tindang (DuAnID, TieuDe, MoTa, TrangThai)
     VALUES (?, ?, ?, 'DaDang')`,
    [duAnId, 'Test Tin Dang', 'Test description']
  );
  
  const tinDangId = tinDangResult.insertId;
  
  // Tạo phòng (phòng thuộc dự án)
  const [phongResult] = await db.execute(
    `INSERT INTO phong (DuAnID, TenPhong, GiaChuan, TrangThai)
     VALUES (?, ?, ?, 'Trong')`,
    [duAnId, 'Test Phong', 5000000]
  );
  
  const phongId = phongResult.insertId;
  
  // Link phòng với tin đăng
  await db.execute(
    `INSERT INTO phong_tindang (PhongID, TinDangID, GiaTinDang)
     VALUES (?, ?, ?)`,
    [phongId, tinDangId, 5000000]
  );
  
  return { duAnId, tinDangId, phongId };
}

/**
 * Tạo test cuộc hẹn
 */
async function createTestCuocHen(nvbhId, khachHangId, phongId, trangThai = 'ChoXacNhan') {
  if (!nvbhId || !khachHangId || !phongId) {
    throw new Error('createTestCuocHen: Missing required parameters');
  }
  
  const thoiGianHen = new Date();
  thoiGianHen.setDate(thoiGianHen.getDate() + 1); // Tomorrow
  
  const [result] = await db.execute(
    `INSERT INTO cuochen (KhachHangID, NhanVienBanHangID, PhongID, ThoiGianHen, TrangThai, SoLanDoiLich)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [khachHangId, nvbhId, phongId, thoiGianHen, trangThai]
  );
  
  return result.insertId;
}

/**
 * Tạo test giao dịch
 */
async function createTestGiaoDich(tinDangId, trangThai = 'DaUyQuyen', loai = 'COC_GIU_CHO') {
  // Generate UUID for KhoaDinhDanh
  const { randomUUID } = require('crypto');
  const khoaDinhDanh = randomUUID();
  
  const [result] = await db.execute(
    `INSERT INTO giaodich (TinDangLienQuanID, SoTien, Loai, TrangThai, KhoaDinhDanh, ThoiGian)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [tinDangId, 1000000, loai, trangThai, khoaDinhDanh]
  );
  
  return result.insertId;
}

/**
 * Cleanup test data
 */
async function cleanupTestData(nvbhId, customerId, duAnId, tinDangId, phongId, chuDuAnId = null) {
  try {
    // Delete appointments
    if (nvbhId) {
      await db.execute('DELETE FROM cuochen WHERE NhanVienBanHangID = ?', [nvbhId]);
    }
    
    // Delete transactions
    if (tinDangId) {
      await db.execute('DELETE FROM giaodich WHERE TinDangLienQuanID = ?', [tinDangId]);
    }
    
    // Delete shifts
    if (nvbhId) {
      await db.execute('DELETE FROM lichlamviec WHERE NhanVienBanHangID = ?', [nvbhId]);
    }
    
    // Delete room-tindang link
    if (phongId && tinDangId) {
      await db.execute('DELETE FROM phong_tindang WHERE PhongID = ? AND TinDangID = ?', [phongId, tinDangId]);
    }
    
    // Delete room
    if (phongId) {
      await db.execute('DELETE FROM phong WHERE PhongID = ?', [phongId]);
    }
    
    // Delete tin dang
    if (tinDangId) {
      await db.execute('DELETE FROM tindang WHERE TinDangID = ?', [tinDangId]);
    }
    
    // Delete du an
    if (duAnId) {
      await db.execute('DELETE FROM duan WHERE DuAnID = ?', [duAnId]);
    }
    
    // Delete ho so nhan vien
    if (nvbhId) {
      await db.execute('DELETE FROM hosonhanvien WHERE NguoiDungID = ?', [nvbhId]);
    }
    
    // Delete user roles first (foreign key constraint)
    if (nvbhId) {
      await db.execute('DELETE FROM nguoidung_vaitro WHERE NguoiDungID = ?', [nvbhId]);
    }
    if (customerId) {
      await db.execute('DELETE FROM nguoidung_vaitro WHERE NguoiDungID = ?', [customerId]);
    }
    if (chuDuAnId) {
      await db.execute('DELETE FROM nguoidung_vaitro WHERE NguoiDungID = ?', [chuDuAnId]);
    }
    
    // Delete system logs (foreign key constraint)
    if (nvbhId) {
      await db.execute('DELETE FROM nhatkyhethong WHERE NguoiDungID = ?', [nvbhId]);
    }
    if (customerId) {
      await db.execute('DELETE FROM nhatkyhethong WHERE NguoiDungID = ?', [customerId]);
    }
    if (chuDuAnId) {
      await db.execute('DELETE FROM nhatkyhethong WHERE NguoiDungID = ?', [chuDuAnId]);
    }
    
    // Delete users
    if (nvbhId) {
      await db.execute('DELETE FROM nguoidung WHERE NguoiDungID = ?', [nvbhId]);
    }
    if (customerId) {
      await db.execute('DELETE FROM nguoidung WHERE NguoiDungID = ?', [customerId]);
    }
    if (chuDuAnId) {
      await db.execute('DELETE FROM nguoidung WHERE NguoiDungID = ?', [chuDuAnId]);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Generate JWT token for test user
 */
function generateTestToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
}

module.exports = {
  createTestNVBH,
  createTestCustomer,
  createTestTinDang,
  createTestCuocHen,
  createTestGiaoDich,
  cleanupTestData,
  generateTestToken
};

