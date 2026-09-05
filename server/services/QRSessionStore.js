/**
 * QR Session Store
 * Lưu trữ sessions cho QR "Xem Ngay" trong memory
 * Auto-expire sau 30 phút
 */

/**
 * @typedef {Object} QRSession
 * @property {string} maQR - Mã QR unique
 * @property {number} nhanVienId - ID nhân viên bán hàng
 * @property {number} cuocHenId - ID cuộc hẹn
 * @property {number} tinDangId - ID tin đăng được gợi ý
 * @property {number} phongId - ID phòng được chọn
 * @property {string} trangThai - CHO_PHAN_HOI | DONG_Y | TU_CHOI | HET_HAN
 * @property {Object} thongTinPhong - Thông tin phòng (cache)
 * @property {Object} thongTinNhanVien - Thông tin NVBH (cache)
 * @property {number} taoLuc - Timestamp tạo
 * @property {number} hetHanLuc - Timestamp hết hạn
 * @property {number|null} phanHoiLuc - Timestamp phản hồi
 */

// Session store - Map<maQR, QRSession>
const sessions = new Map();

// Thời gian hết hạn mặc định: 30 phút
const DEFAULT_EXPIRY_MS = 30 * 60 * 1000;

// Interval cleanup: mỗi 5 phút
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Tạo session mới
 * @param {Object} sessionData - Dữ liệu session
 * @param {string} sessionData.maQR - Mã QR unique
 * @param {number} sessionData.nhanVienId - ID nhân viên bán hàng
 * @param {number} sessionData.cuocHenId - ID cuộc hẹn
 * @param {number} sessionData.tinDangId - ID tin đăng
 * @param {number} sessionData.phongId - ID phòng
 * @param {Object} sessionData.thongTinPhong - Thông tin phòng
 * @param {Object} sessionData.thongTinNhanVien - Thông tin NVBH
 * @param {number} [expiryMs] - Thời gian hết hạn (ms)
 * @returns {QRSession}
 */
function create(sessionData, expiryMs = DEFAULT_EXPIRY_MS) {
  const now = Date.now();
  
  const session = {
    maQR: sessionData.maQR,
    nhanVienId: sessionData.nhanVienId,
    cuocHenId: sessionData.cuocHenId,
    tinDangId: sessionData.tinDangId,
    phongId: sessionData.phongId,
    trangThai: 'CHO_PHAN_HOI',
    thongTinPhong: sessionData.thongTinPhong || null,
    thongTinNhanVien: sessionData.thongTinNhanVien || null,
    thongTinTinDang: sessionData.thongTinTinDang || null,
    // Thêm các field cho đặt cọc
    loaiQR: sessionData.loaiQR || 'XEM_NGAY', // 'XEM_NGAY' hoặc 'DAT_COC'
    thongTinDatCoc: sessionData.thongTinDatCoc || null,
    soThangKy: sessionData.soThangKy || null,
    ngayChuyenVao: sessionData.ngayChuyenVao || null,
    taoLuc: now,
    hetHanLuc: now + expiryMs,
    phanHoiLuc: null
  };

  sessions.set(sessionData.maQR, session);
  
  console.log(`[QRSessionStore] Created session: ${sessionData.maQR}, type: ${session.loaiQR}, expires at ${new Date(session.hetHanLuc).toISOString()}`);
  
  return session;
}

/**
 * Lấy session theo mã QR
 * @param {string} maQR - Mã QR
 * @returns {QRSession|null}
 */
function get(maQR) {
  const session = sessions.get(maQR);
  
  if (!session) {
    console.log(`[QRSessionStore] Session not found: ${maQR}`);
    return null;
  }

  // Kiểm tra hết hạn
  if (Date.now() > session.hetHanLuc && session.trangThai === 'CHO_PHAN_HOI') {
    session.trangThai = 'HET_HAN';
    sessions.set(maQR, session);
    console.log(`[QRSessionStore] Session expired: ${maQR}`);
  }

  return session;
}

/**
 * Cập nhật trạng thái session (chỉ đổi trạng thái)
 * @param {string} maQR - Mã QR
 * @param {string} trangThai - Trạng thái mới (DONG_Y | TU_CHOI | HET_HAN)
 * @returns {QRSession|null}
 */
function updateStatus(maQR, trangThai) {
  const session = sessions.get(maQR);
  
  if (!session) {
    console.log(`[QRSessionStore] Cannot update - session not found: ${maQR}`);
    return null;
  }

  // Chỉ cập nhật nếu đang CHO_PHAN_HOI
  if (session.trangThai !== 'CHO_PHAN_HOI') {
    console.log(`[QRSessionStore] Cannot update - session already responded: ${maQR}, status: ${session.trangThai}`);
    return session;
  }

  session.trangThai = trangThai;
  session.phanHoiLuc = Date.now();
  sessions.set(maQR, session);

  console.log(`[QRSessionStore] Updated session: ${maQR}, new status: ${trangThai}`);

  return session;
}

/**
 * Cập nhật nhiều field của session (merge data)
 * Dùng cho các luồng cần lưu thêm cocId, ngayChuyenVao, v.v.
 * @param {string} maQR
 * @param {Partial<QRSession>} data
 * @returns {QRSession|null}
 */
function update(maQR, data) {
  const session = sessions.get(maQR);

  if (!session) {
    console.log(`[QRSessionStore] Cannot update (merge) - session not found: ${maQR}`);
    return null;
  }

  // Nếu có truyền trangThai mới, đảm bảo chỉ cho phép đổi từ CHO_PHAN_HOI
  if (data.trangThai && session.trangThai !== 'CHO_PHAN_HOI') {
    console.log(
      `[QRSessionStore] Cannot update (merge) status - session already responded: ${maQR}, status: ${session.trangThai}`
    );
  } else if (data.trangThai) {
    session.trangThai = data.trangThai;
    session.phanHoiLuc = Date.now();
  }

  // Merge các field khác
  Object.assign(session, data);
  sessions.set(maQR, session);

  console.log(`[QRSessionStore] Merged session: ${maQR}`, {
    trangThai: session.trangThai,
    cocId: session.cocId,
    ngayChuyenVao: session.ngayChuyenVao
  });

  return session;
}

/**
 * Xóa session
 * @param {string} maQR - Mã QR
 * @returns {boolean}
 */
function remove(maQR) {
  const deleted = sessions.delete(maQR);
  
  if (deleted) {
    console.log(`[QRSessionStore] Deleted session: ${maQR}`);
  }
  
  return deleted;
}

/**
 * Dọn dẹp sessions hết hạn
 * @returns {number} Số session đã xóa
 */
function cleanup() {
  const now = Date.now();
  let deletedCount = 0;
  
  // Xóa sessions đã hết hạn quá 1 giờ (giữ lại để có thể xem lịch sử)
  const expiredThreshold = now - (60 * 60 * 1000); // 1 giờ trước
  
  for (const [maQR, session] of sessions) {
    // Xóa nếu:
    // 1. Đã hết hạn quá 1 giờ
    // 2. Đã phản hồi (DONG_Y/TU_CHOI) quá 1 giờ
    const shouldDelete = 
      (session.trangThai === 'HET_HAN' && session.hetHanLuc < expiredThreshold) ||
      (session.trangThai !== 'CHO_PHAN_HOI' && session.phanHoiLuc && session.phanHoiLuc < expiredThreshold);
    
    if (shouldDelete) {
      sessions.delete(maQR);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[QRSessionStore] Cleanup: deleted ${deletedCount} expired sessions`);
  }

  return deletedCount;
}

/**
 * Lấy số lượng sessions đang active
 * @returns {number}
 */
function getActiveCount() {
  let count = 0;
  const now = Date.now();
  
  for (const session of sessions.values()) {
    if (session.trangThai === 'CHO_PHAN_HOI' && session.hetHanLuc > now) {
      count++;
    }
  }
  
  return count;
}

/**
 * Lấy tất cả sessions của một nhân viên
 * @param {number} nhanVienId - ID nhân viên
 * @returns {QRSession[]}
 */
function getByNhanVien(nhanVienId) {
  const result = [];
  
  for (const session of sessions.values()) {
    if (session.nhanVienId === nhanVienId) {
      result.push(session);
    }
  }
  
  return result;
}

/**
 * Kiểm tra session còn valid không (chưa hết hạn và đang chờ phản hồi)
 * @param {string} maQR - Mã QR
 * @returns {boolean}
 */
function isValid(maQR) {
  const session = get(maQR);
  
  if (!session) return false;
  
  return session.trangThai === 'CHO_PHAN_HOI' && Date.now() <= session.hetHanLuc;
}

/**
 * Lấy thời gian còn lại (giây)
 * @param {string} maQR - Mã QR
 * @returns {number} Số giây còn lại, 0 nếu hết hạn
 */
function getRemainingTime(maQR) {
  const session = sessions.get(maQR);
  
  if (!session) return 0;
  
  const remaining = session.hetHanLuc - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// Bắt đầu cleanup interval
let cleanupIntervalId = null;

function startCleanup() {
  if (cleanupIntervalId) return;
  
  cleanupIntervalId = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  console.log('[QRSessionStore] Started cleanup interval');
}

function stopCleanup() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('[QRSessionStore] Stopped cleanup interval');
  }
}

// Auto-start cleanup khi module được load
startCleanup();

module.exports = {
  create,
  get,
  updateStatus,
  update,
  remove,
  cleanup,
  getActiveCount,
  getByNhanVien,
  isValid,
  getRemainingTime,
  startCleanup,
  stopCleanup,
  
  // Constants
  DEFAULT_EXPIRY_MS,
  
  // Status constants
  STATUS: {
    CHO_PHAN_HOI: 'CHO_PHAN_HOI',
    DONG_Y: 'DONG_Y',
    TU_CHOI: 'TU_CHOI',
    HET_HAN: 'HET_HAN'
  }
};

