/**
 * Validation utilities cho Phòng
 * Xử lý vấn đề phòng trùng lặp giữa các tin đăng
 */

const db = require('../config/db');

/**
 * Chuẩn hóa tên phòng (loại bỏ khoảng trắng, viết hoa)
 * @param {string} tenPhong 
 * @returns {string}
 */
function chuanHoaTenPhong(tenPhong) {
  if (!tenPhong) return '';
  return tenPhong.trim().toUpperCase();
}

/**
 * Kiểm tra phòng có tồn tại trong tin đăng khác của cùng dự án không
 * @param {number} duAnID 
 * @param {string} tenPhong 
 * @param {number|null} tinDangIDHienTai - Bỏ qua tin đăng này (khi update)
 * @returns {Promise<Array>} Danh sách phòng trùng lặp
 */
async function kiemTraPhongTrungLap(duAnID, tenPhong, tinDangIDHienTai = null) {
  const tenPhongChuanHoa = chuanHoaTenPhong(tenPhong);
  
  const query = `
    SELECT 
      p.PhongID,
      p.TenPhong,
      p.TrangThai,
      p.Gia,
      p.DienTich,
      td.TinDangID,
      td.TieuDe as TieuDeTinDang,
      td.TrangThai as TrangThaiTinDang,
      td.TaoLuc as TinDangTaoLuc
    FROM phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    WHERE td.DuAnID = ?
      AND UPPER(TRIM(p.TenPhong)) = ?
      AND td.TrangThai IN ('Nhap', 'ChoDuyet', 'DaDuyet', 'DaDang')
      ${tinDangIDHienTai ? 'AND td.TinDangID != ?' : ''}
    ORDER BY 
      CASE p.TrangThai
        WHEN 'DaThue' THEN 1
        WHEN 'GiuCho' THEN 2
        WHEN 'DonDep' THEN 3
        WHEN 'Trong' THEN 4
      END,
      td.TaoLuc DESC
  `;
  
  const params = tinDangIDHienTai 
    ? [duAnID, tenPhongChuanHoa, tinDangIDHienTai]
    : [duAnID, tenPhongChuanHoa];
  
  const [rows] = await db.query(query, params);
  return rows;
}

/**
 * Validate danh sách phòng trước khi thêm vào tin đăng
 * @param {number} tinDangID 
 * @param {Array} danhSachPhong - Array of {tenPhong, gia, dienTich, ...}
 * @param {Object} options - {allowDuplicate: false, autoSync: true}
 * @returns {Promise<{valid: boolean, errors: Array, warnings: Array}>}
 */
async function validateDanhSachPhong(tinDangID, danhSachPhong, options = {}) {
  const { 
    allowDuplicate = false,  // Cho phép phòng trùng với tin khác
    autoSync = true           // Tự động đồng bộ trạng thái nếu có trùng
  } = options;
  
  const errors = [];
  const warnings = [];
  
  // Lấy thông tin tin đăng
  const [tinDangRows] = await db.query(
    'SELECT DuAnID, TieuDe FROM tindang WHERE TinDangID = ?',
    [tinDangID]
  );
  
  if (!tinDangRows.length) {
    return {
      valid: false,
      errors: [{ code: 'TIN_DANG_NOT_FOUND', message: 'Tin đăng không tồn tại' }],
      warnings: []
    };
  }
  
  const duAnID = tinDangRows[0].DuAnID;
  
  // Kiểm tra từng phòng
  for (const phong of danhSachPhong) {
    const tenPhongChuanHoa = chuanHoaTenPhong(phong.tenPhong);
    
    if (!tenPhongChuanHoa) {
      errors.push({
        code: 'TEN_PHONG_INVALID',
        tenPhong: phong.tenPhong,
        message: 'Tên phòng không được để trống'
      });
      continue;
    }
    
    // Kiểm tra trùng lặp
    const phongTrungLap = await kiemTraPhongTrungLap(duAnID, tenPhongChuanHoa, tinDangID);
    
    if (phongTrungLap.length > 0) {
      const phongDauTien = phongTrungLap[0];
      
      if (!allowDuplicate) {
        errors.push({
          code: 'PHONG_TRUNG_LAP',
          tenPhong: phong.tenPhong,
          tenPhongChuanHoa: tenPhongChuanHoa,
          message: `Phòng "${phong.tenPhong}" đã tồn tại trong tin đăng khác`,
          tinDangTrungLap: phongTrungLap.map(p => ({
            tinDangID: p.TinDangID,
            tieuDe: p.TieuDeTinDang,
            trangThai: p.TrangThai,
            trangThaiTinDang: p.TrangThaiTinDang
          }))
        });
      } else {
        // Cảnh báo nếu cho phép duplicate nhưng trạng thái khác nhau
        if (autoSync && phongDauTien.TrangThai !== 'Trong') {
          warnings.push({
            code: 'AUTO_SYNC_STATUS',
            tenPhong: phong.tenPhong,
            message: `Phòng "${phong.tenPhong}" sẽ tự động có trạng thái "${phongDauTien.TrangThai}" (từ tin đăng khác)`,
            trangThaiDongBo: phongDauTien.TrangThai,
            tinDangNguon: {
              tinDangID: phongDauTien.TinDangID,
              tieuDe: phongDauTien.TieuDeTinDang
            }
          });
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Lấy trạng thái "ưu tiên" nhất của phòng trong dự án
 * (DaThue > GiuCho > DonDep > Trong)
 * @param {number} duAnID 
 * @param {string} tenPhong 
 * @returns {Promise<string|null>}
 */
async function layTrangThaiUuTien(duAnID, tenPhong) {
  const tenPhongChuanHoa = chuanHoaTenPhong(tenPhong);
  
  const [rows] = await db.query(`
    SELECT p.TrangThai
    FROM phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    WHERE td.DuAnID = ?
      AND UPPER(TRIM(p.TenPhong)) = ?
      AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
    ORDER BY 
      CASE p.TrangThai
        WHEN 'DaThue' THEN 1
        WHEN 'GiuCho' THEN 2
        WHEN 'DonDep' THEN 3
        WHEN 'Trong' THEN 4
      END
    LIMIT 1
  `, [duAnID, tenPhongChuanHoa]);
  
  return rows.length > 0 ? rows[0].TrangThai : null;
}

/**
 * Báo cáo tất cả phòng trùng lặp trong hệ thống
 * @param {number|null} duAnID - Lọc theo dự án (null = tất cả)
 * @returns {Promise<Array>}
 */
async function baoCaoPhongTrungLap(duAnID = null) {
  const query = `
    SELECT 
      td.DuAnID,
      d.TenDuAn,
      d.DiaChi as DiaChiDuAn,
      p.TenPhong,
      COUNT(DISTINCT p.PhongID) as SoLuongBanGhi,
      COUNT(DISTINCT p.TrangThai) as SoTrangThaiKhacNhau,
      GROUP_CONCAT(
        DISTINCT p.TrangThai
        ORDER BY 
          CASE p.TrangThai
            WHEN 'DaThue' THEN 1
            WHEN 'GiuCho' THEN 2
            WHEN 'DonDep' THEN 3
            WHEN 'Trong' THEN 4
          END
        SEPARATOR ', '
      ) as DanhSachTrangThai,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'PhongID', p.PhongID,
          'TinDangID', td.TinDangID,
          'TieuDeTinDang', td.TieuDe,
          'TrangThai', p.TrangThai,
          'Gia', p.Gia,
          'DienTich', p.DienTich
        )
      ) as ChiTietPhong
    FROM phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    JOIN duan d ON td.DuAnID = d.DuAnID
    WHERE td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
      ${duAnID ? 'AND td.DuAnID = ?' : ''}
    GROUP BY td.DuAnID, d.TenDuAn, d.DiaChi, p.TenPhong
    HAVING SoLuongBanGhi > 1
    ORDER BY SoTrangThaiKhacNhau DESC, td.DuAnID, p.TenPhong
  `;
  
  const params = duAnID ? [duAnID] : [];
  const [rows] = await db.query(query, params);
  
  return rows.map(row => {
    let chiTietPhong = null;
    try {
      chiTietPhong = row.ChiTietPhong ? JSON.parse(row.ChiTietPhong) : null;
    } catch (e) {
      console.error('[phongValidation] Lỗi parse ChiTietPhong:', e);
      chiTietPhong = null;
    }
    return {
      ...row,
      ChiTietPhong: chiTietPhong
    };
  });
}

module.exports = {
  chuanHoaTenPhong,
  kiemTraPhongTrungLap,
  validateDanhSachPhong,
  layTrangThaiUuTien,
  baoCaoPhongTrungLap
};

