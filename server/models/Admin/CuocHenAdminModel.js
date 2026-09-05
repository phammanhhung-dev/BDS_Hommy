const db = require("../config/db");

/**
 * Model cuá»™c háº¹n (cuochen)
 * Ghi chĂº: createCuocHen bao gá»“m KhachHangID vĂ  NhanVienBanHangID
 */

exports.createCuocHen = (data) => {
  const sql = `
    INSERT INTO cuochen
      (PhongID, ChuDuAnID, KhachHangID, NhanVienBanHangID, ThoiGianHen, GhiChu, TrangThai, PheDuyetChuDuAn, TaoLuc, CapNhatLuc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  const params = [
    data.PhongID || null,
    data.ChuDuAnID || null,
    data.KhachHangID || null,
    data.NhanVienBanHangID || null,
    data.ThoiGianHen || null,
    data.GhiChu || null,
    data.TrangThai || "ChoXacNhan",
    data.PheDuyetChuDuAn || "ChoPheDuyet",
  ];
  // optional debug
  // console.debug('[createCuocHen] params:', params);
  return db.query(sql, params);
};

exports.getById = (id) => {
  return db.query("SELECT * FROM cuochen WHERE CuocHenID = ?", [id]);
};

exports.getAll = () => {
  return db.query("SELECT * FROM cuochen ORDER BY ThoiGianHen DESC");
};

exports.findByKhachHangId = (khachHangId) => {
  return db.query(
    "SELECT * FROM cuochen WHERE KhachHangID = ? ORDER BY ThoiGianHen DESC",
    [khachHangId]
  );
};

exports.findByNhanVienId = (nhanVienId) => {
  return db.query(
    "SELECT * FROM cuochen WHERE NhanVienBanHangID = ? ORDER BY ThoiGianHen DESC",
    [nhanVienId]
  );
};

exports.findByChuDuAnId = (chuDuAnId) => {
  const sql = `
    SELECT ch.*
    FROM cuochen ch
    LEFT JOIN phong p ON ch.PhongID = p.PhongID
    LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
    LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID
    LEFT JOIN duan da ON td.DuAnID = da.DuAnID
    WHERE td.ChuDuAnID = ?
    GROUP BY ch.CuocHenID
    ORDER BY ch.ThoiGianHen DESC
  `;
  return db.query(sql, [chuDuAnId]);
};

exports.updateCuocHen = async (id, updates = {}) => {
  const allowed = [
    "TrangThai",
    "ThoiGianHen",
    "GhiChu",
    "PhuongThucVao",
    "PheDuyetChuDuAn",
    "NhanVienBanHangID",
    "TenKhachHang",
    "Email",
    "SoDienThoai",
    "PhongID",
    "TinDangID",
    "KhachHangID",
  ];
  const keys = Object.keys(updates).filter((k) => allowed.includes(k));
  if (keys.length === 0) return Promise.resolve([{ affectedRows: 0 }]);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  const sql = `UPDATE cuochen SET ${sets}, CapNhatLuc = NOW() WHERE CuocHenID = ?`;
  return db.query(sql, [...values, id]);
};

exports.deleteCuocHen = (id) => {
  return db.query("DELETE FROM cuochen WHERE CuocHenID = ?", [id]);
};

exports.getPhongIdByTinDang = async (tinDangId) => {
  const sql = "SELECT PhongID FROM phong_tindang WHERE TinDangID = ? LIMIT 1";
  const [rows] = await db.query(sql, [tinDangId]);
  if (rows && rows.length) return rows[0].PhongID;
  return null;
};

exports.getChuDuAnIdByTinDangId = async (tinDangId) => {
  if (!tinDangId) return null;
  const sql = `
    SELECT da.ChuDuAnID
    FROM tindang td
    JOIN duan da ON td.DuAnID = da.DuAnID
    WHERE td.TinDangID = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [tinDangId]);
  return rows && rows.length ? rows[0].ChuDuAnID : null;
};
