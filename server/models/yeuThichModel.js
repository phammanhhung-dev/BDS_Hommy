const db = require('../config/db');

exports.addFavorite = (NguoiDungID, TinDangID) => {
  // nếu đã tồn tại sẽ bị IGNORE
  return db.query(
    'INSERT IGNORE INTO yeuthich (NguoiDungID, TinDangID) VALUES (?, ?)',
    [NguoiDungID, TinDangID]
  );
};

exports.removeFavorite = (NguoiDungID, TinDangID) => {
  return db.query('DELETE FROM yeuthich WHERE NguoiDungID = ? AND TinDangID = ?', [NguoiDungID, TinDangID]);
};

exports.getByUser = (NguoiDungID) => {
  return db.query(
    `SELECT
       y.NguoiDungID,
       y.TinDangID,
       t.TieuDe,
       t.URL AS Img,
       -- giá nhỏ nhất của các phòng liên quan tới TinDang (ưu tiên GiáTinDang nếu có, fallback GiáChuan của phòng)
       (
         SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
         FROM phong_tindang pt
         JOIN phong p ON pt.PhongID = p.PhongID
         WHERE pt.TinDangID = t.TinDangID
       ) AS Gia,
       -- lấy 1 ảnh phòng (nếu có)
       (
         SELECT p.HinhAnhPhong
         FROM phong_tindang pt
         JOIN phong p ON pt.PhongID = p.PhongID
         WHERE pt.TinDangID = t.TinDangID AND p.HinhAnhPhong IS NOT NULL AND p.HinhAnhPhong <> ''
         LIMIT 1
       ) AS HinhAnhPhong,
       -- địa chỉ lấy từ bảng duan
       da.DiaChi AS DiaChi
     FROM yeuthich y
     LEFT JOIN tindang t ON t.TinDangID = y.TinDangID
     LEFT JOIN duan da ON t.DuAnID = da.DuAnID
     WHERE y.NguoiDungID = ?`,
    [NguoiDungID]
  );
};

// Thêm: trả thêm ảnh (sử dụng cột URL của tindang làm ảnh nếu có)
exports.getByUserWithTin = (NguoiDungID) => {
  return db.query(
    `SELECT
       y.NguoiDungID,
       y.TinDangID,
       t.TieuDe,
       t.URL AS Img,
       (
         SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
         FROM phong_tindang pt
         JOIN phong p ON pt.PhongID = p.PhongID
         WHERE pt.TinDangID = t.TinDangID
       ) AS Gia,
       (
         SELECT p.HinhAnhPhong
         FROM phong_tindang pt
         JOIN phong p ON pt.PhongID = p.PhongID
         WHERE pt.TinDangID = t.TinDangID AND p.HinhAnhPhong IS NOT NULL AND p.HinhAnhPhong <> ''
         LIMIT 1
       ) AS HinhAnhPhong,
       da.DiaChi AS DiaChi
     FROM yeuthich y
     LEFT JOIN tindang t ON t.TinDangID = y.TinDangID
     LEFT JOIN duan da ON t.DuAnID = da.DuAnID
     WHERE y.NguoiDungID = ?`,
    [NguoiDungID]
  );
};

exports.existsFavorite = (NguoiDungID, TinDangID) => {
  return db.query('SELECT 1 AS exists_flag FROM yeuthich WHERE NguoiDungID = ? AND TinDangID = ? LIMIT 1', [NguoiDungID, TinDangID]);
};