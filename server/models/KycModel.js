const db = require('../config/db');

class KYCModel {
  static async create(data, connection = null) {
    const conn = connection || db;
    const sql = `
      INSERT INTO kyc_verification 
      (NguoiDungID, SoCCCD, TenDayDu, NgaySinh, DiaChi, NgayCapCCCD, 
       FaceSimilarity, TrangThai, LyDoThatBai, AnhCCCDMatTruoc, AnhCCCDMatSau, AnhSelfie)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.NguoiDungID, data.SoCCCD, data.TenDayDu, data.NgaySinh, data.DiaChi, 
      data.NgayCapCCCD, data.FaceSimilarity, data.TrangThai, 
      data.LyDoThatBai, data.AnhCCCDMatTruoc, data.AnhCCCDMatSau, data.AnhSelfie
    ];
    
    const [result] = await conn.execute(sql, params);
    return result.insertId;
  }

  static async getByUserId(userId) {
    const sql = `
      SELECT 
        KYCVerificationID, NguoiDungID, SoCCCD, TenDayDu, NgaySinh, DiaChi, 
        NgayCapCCCD, FaceSimilarity, TrangThai, LyDoThatBai, 
        AnhCCCDMatTruoc, AnhCCCDMatSau, AnhSelfie, TaoLuc
      FROM kyc_verification 
      WHERE NguoiDungID = ? 
      ORDER BY TaoLuc DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  }

  static async getById(id) {
    const sql = `
      SELECT 
        KYCVerificationID, NguoiDungID, SoCCCD, TenDayDu, NgaySinh, DiaChi, 
        NgayCapCCCD, FaceSimilarity, TrangThai, LyDoThatBai, 
        AnhCCCDMatTruoc, AnhCCCDMatSau, AnhSelfie, TaoLuc
      FROM kyc_verification 
      WHERE KYCVerificationID = ?
    `;
    const [rows] = await db.execute(sql, [id]);
    return rows[0];
  }

  static async updateStatus(id, status, reason = null) {
    const sql = `UPDATE kyc_verification SET TrangThai = ?, LyDoThatBai = ? WHERE KYCVerificationID = ?`;
    const [result] = await db.execute(sql, [status, reason, id]);
    return result.affectedRows > 0;
  }
}

module.exports = KYCModel;
