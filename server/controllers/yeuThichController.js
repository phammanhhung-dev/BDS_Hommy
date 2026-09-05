const YT = require('../models/yeuThichModel');

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getAuthenticatedUserId = (req) => {
  return parsePositiveInt(req.user?.id);
};

exports.add = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const tinDangId = parsePositiveInt(req.body?.TinDangID);
  if (!userId || !tinDangId) {
    return res.status(400).json({ error: 'TinDangID là bắt buộc và phải hợp lệ' });
  }

  try {
    await YT.addFavorite(userId, tinDangId);
    return res.status(201).json({ TinDangID: tinDangId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const authUserId = getAuthenticatedUserId(req);
  const userId = parsePositiveInt(req.params.userId);
  const tinId = parsePositiveInt(req.params.tinId);
  if (!authUserId || !userId || !tinId) {
    return res.status(400).json({ error: 'Tham số không hợp lệ' });
  }
  if (authUserId !== userId) {
    return res.status(403).json({ error: 'Không có quyền truy cập dữ liệu người dùng khác' });
  }

  try {
    await YT.removeFavorite(userId, tinId);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listByUser = async (req, res) => {
  const authUserId = getAuthenticatedUserId(req);
  const userId = parsePositiveInt(req.params.userId);
  if (!authUserId || !userId) {
    return res.status(400).json({ error: 'Tham số không hợp lệ' });
  }
  if (authUserId !== userId) {
    return res.status(403).json({ error: 'Không có quyền truy cập dữ liệu người dùng khác' });
  }

  try {
    const [rows] = await YT.getByUser(userId);
    return res.json(rows.map(r => ({
      TinDangID: r.TinDangID,
      TieuDe: r.TieuDe || null,
      Gia: r.Gia != null ? r.Gia : null,
      // model trả DiaChi (chú ý chữ hoa), map về diachi để frontend dùng
      diachi: r.DiaChi || r.diachi || null,
      // trả đường dẫn ảnh đầy đủ nếu model đã thêm HinhAnhFull, fallback sang các cột khác
      Img: r.HinhAnhFull || r.HinhAnhPhong || r.Img || null
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listWithTinDetails = async (req, res) => {
  const authUserId = getAuthenticatedUserId(req);
  const userId = parsePositiveInt(req.params.userId);
  if (!authUserId || !userId) {
    return res.status(400).json({ error: 'Tham số không hợp lệ' });
  }
  if (authUserId !== userId) {
    return res.status(403).json({ error: 'Không có quyền truy cập dữ liệu người dùng khác' });
  }

  try {
    const [rows] = await YT.getByUserWithTin(userId);
    return res.json(rows.map(r => ({
      TinDangID: r.TinDangID,
      TieuDe: r.TieuDe || null,
      Img: r.HinhAnhFull || r.HinhAnhPhong || r.Img || null,
      Gia: r.Gia != null ? r.Gia : null,
      diachi: r.DiaChi || r.diachi || null
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.check = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const tinId = parsePositiveInt(req.query.tinId);
  if (!userId || !tinId) {
    return res.status(400).json({ error: 'tinId là bắt buộc và phải hợp lệ' });
  }

  try {
    const [rows] = await YT.existsFavorite(userId, tinId);
    const exists = rows.length > 0;
    return res.json({ exists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};