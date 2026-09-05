const KycModel = require('../models/KycModel');
const db = require('../config/db');
const fs = require('fs');

class KycService {
  static async createVerification(data) {
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Kiểm tra xem đã có KYC record chưa (tránh duplicate)
      const checkSql = `
        SELECT KYCVerificationID, AnhCCCDMatTruoc, AnhCCCDMatSau, AnhSelfie 
        FROM kyc_verification 
        WHERE NguoiDungID = ? 
        ORDER BY TaoLuc DESC 
        LIMIT 1
      `;
      const [existing] = await connection.execute(checkSql, [data.NguoiDungID]);
      
      // 2. Xóa ảnh cũ nếu có (tránh duplicate ảnh)
      if (existing.length > 0) {
        const oldRecord = existing[0];
        const oldImages = [
          oldRecord.AnhCCCDMatTruoc,
          oldRecord.AnhCCCDMatSau,
          oldRecord.AnhSelfie
        ].filter(Boolean);
        
        // Xóa file ảnh cũ
        oldImages.forEach(imagePath => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log('🗑️ [KYC] Deleted old image:', imagePath);
            }
          } catch (err) {
            console.warn('⚠️ [KYC] Failed to delete old image:', imagePath, err);
          }
        });
      }

      // 3. Create KYC record
      const kycId = await KycModel.create(data, connection);

      // 4. Update user profile và trạng thái xác minh
      const updateSql = `
        UPDATE nguoidung 
        SET 
          TenDayDu = COALESCE(?, TenDayDu),
          NgaySinh = COALESCE(?, NgaySinh),
          DiaChi = COALESCE(?, DiaChi),
          SoCCCD = COALESCE(?, SoCCCD),
          NgayCapCCCD = COALESCE(?, NgayCapCCCD),
          AnhCCCDMatTruoc = ?,
          AnhCCCDMatSau = ?,
          AnhSelfie = ?,
          TrangThaiXacMinh = CASE 
            WHEN ? = 'ThanhCong' THEN 'DaXacMinh'
            WHEN ? = 'ThatBai' THEN 'TuChoi'
            ELSE 'ChoDuyet'
          END
        WHERE NguoiDungID = ?
      `;
      const params = [
        data.TenDayDu, data.NgaySinh, data.DiaChi, data.SoCCCD, 
        data.NgayCapCCCD,
        data.AnhCCCDMatTruoc, data.AnhCCCDMatSau, data.AnhSelfie,
        data.TrangThai, data.TrangThai, // 2 lần cho CASE WHEN
        data.NguoiDungID
      ];
      await connection.execute(updateSql, params);

      await connection.commit();
      return kycId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getHistory(userId) {
    return await KycModel.getByUserId(userId);
  }
}

module.exports = KycService;
