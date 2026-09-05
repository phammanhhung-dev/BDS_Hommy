//  # thao tác DB (SQL query)
// models/userModel.js
const db = require("../config/db");

// Lấy tất cả users
exports.getAll = () => {
  return db.query("SELECT * FROM nguoidung");
};

// Thêm user

exports.createNguoiDung = async (
  tenDayDu,
  email,
  soDienThoai,
  matKhauHash,
  vaiTroID
) => {
  const sql = `
    INSERT INTO nguoidung
      (TenDayDu, Email, SoDienThoai, MatKhauHash, VaiTroHoatDongID, TaoLuc, CapNhatLuc)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;
  const [result] = await db.query(sql, [
    tenDayDu,
    email,
    soDienThoai,
    matKhauHash,
    vaiTroID,
  ]);

  return [result];
};

exports.getById = (id) => {
  return db.query("SELECT * FROM nguoidung WHERE NguoiDungID = ?", [id]);
};

exports.updateNguoiDung = (id, updates) => {
  const keys = Object.keys(updates);
  if (keys.length === 0) return Promise.resolve();
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  const sql = `UPDATE nguoidung SET ${sets}, CapNhatLuc = NOW() WHERE NguoiDungID = ?`;
  return db.query(sql, [...values, id]);
};

exports.deleteNguoiDung = (id) => {
  return db.query("DELETE FROM nguoidung WHERE NguoiDungID = ?", [id]);
};
