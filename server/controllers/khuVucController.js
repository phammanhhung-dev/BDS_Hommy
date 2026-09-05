const KhuVuc = require('../models/khuVucModel');
const HoSoNhanVienModel = require('../models/HoSoNhanVienModel');
const db = require('../config/db');

const hasLegacyKhuVucTable = async () => {
  try {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'KhuVuc'`
    );
    return Number(rows[0]?.total || 0) > 0;
  } catch (error) {
    console.warn('[khuVucController] Không kiểm tra được bảng KhuVuc, coi như không tồn tại:', error.message);
    return false;
  }
};

const mapRow = (r) => ({
  KhuVucID: r.KhuVucID,
  TenKhuVuc: r.TenKhuVuc,
  ParentKhuVucID: r.ParentKhuVucID,
  ViDo: r.ViDo,
  KinhDo: r.KinhDo
});

// build nested tree from flat list
const buildTree = (rows) => {
  const map = new Map();
  rows.forEach(r => map.set(r.KhuVucID, { ...mapRow(r), children: [] }));
  const roots = [];
  for (const node of map.values()) {
    if (node.ParentKhuVucID == null) {
      roots.push(node);
    } else {
      const parent = map.get(node.ParentKhuVucID);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphan, treat as root
    }
  }
  return roots;
};

exports.getAll = async (req, res) => {
  try {
    const legacyExists = await hasLegacyKhuVucTable();
    if (!legacyExists) {
      const { parentId } = req.query;

      if (typeof parentId !== 'undefined') {
        const normalizedParentId = parentId === '' || parentId === 'null' || parentId === 'root' || parentId === null
          ? null
          : Number(parentId);

        if (normalizedParentId !== null && Number.isNaN(normalizedParentId)) {
          return res.status(400).json({ error: 'parentId không hợp lệ' });
        }

        if (normalizedParentId === null) {
          const [rows] = await db.execute(
            `SELECT ProvinceID AS KhuVucID, ProvinceName AS TenKhuVuc, NULL AS ParentKhuVucID
             FROM legacy_provinces
             ORDER BY ProvinceName ASC`
          );
          return res.json(rows.map(mapRow));
        }

        const [rows] = await db.execute(
          `SELECT 
             lc.CommuneID AS KhuVucID, 
             CONCAT(lc.CommuneName, IF(nd.DistrictName IS NOT NULL AND lc.CommuneName NOT LIKE CONCAT('%(', nd.DistrictName, ')%'), CONCAT(' (', nd.DistrictName, ')'), '')) AS TenKhuVuc, 
             lc.ProvinceID AS ParentKhuVucID
           FROM legacy_communes lc
           LEFT JOIN new_districts nd ON lc.DistrictID = nd.DistrictID
           WHERE lc.ProvinceID = ?
           ORDER BY TenKhuVuc ASC`,
          [normalizedParentId]
        );
        return res.json(rows.map(mapRow));
      }

      const [rows] = await db.execute(
        `SELECT ProvinceID AS KhuVucID, ProvinceName AS TenKhuVuc, NULL AS ParentKhuVucID
         FROM legacy_provinces
         ORDER BY ProvinceName ASC`
      );
      return res.json(rows.map(mapRow));
    }

    const { parentId } = req.query;

    if (typeof parentId !== 'undefined') {
      let normalized = null;
      if (
        parentId !== '' &&
        parentId !== 'null' &&
        parentId !== 'root' &&
        parentId !== null
      ) {
        const parsed = Number(parentId);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ error: 'parentId không hợp lệ' });
        }
        normalized = parsed;
      }

      const [rows] = await KhuVuc.getChildren(normalized);
      return res.json(rows.map(mapRow));
    }

    const [rows] = await KhuVuc.getAll();
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTree = async (req, res) => {
  try {
    const [rows] = await KhuVuc.getAll();
    res.json(buildTree(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await KhuVuc.getById(id);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { TenKhuVuc, ParentKhuVucID, ViDo, KinhDo } = req.body;
    if (!TenKhuVuc) return res.status(400).json({ error: 'TenKhuVuc là bắt buộc' });

    const legacyExists = await hasLegacyKhuVucTable();
    if (!legacyExists) {
      if (ParentKhuVucID === null || ParentKhuVucID === 'null' || !ParentKhuVucID) {
        // Tỉnh/Thành
        const code = 'P_' + Date.now();
        const [result] = await db.execute(
          `INSERT INTO legacy_provinces (ProvinceCode, ProvinceName, ProvinceType, CreatedAt, UpdatedAt) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [code, TenKhuVuc, 'Tinh']
        );
        return res.status(201).json({
          KhuVucID: result.insertId,
          TenKhuVuc,
          ParentKhuVucID: null,
          ViDo: ViDo || null,
          KinhDo: KinhDo || null
        });
      } else {
        // Kiểm tra xem ParentKhuVucID thuộc Tỉnh hay Quận
        const [provinceRows] = await db.execute(
          'SELECT ProvinceID FROM legacy_provinces WHERE ProvinceID = ? LIMIT 1',
          [ParentKhuVucID]
        );
        if (provinceRows.length > 0) {
          // Thêm Quận/Huyện
          const code = 'D_' + Date.now();
          const [result] = await db.execute(
            `INSERT INTO new_districts (ProvinceID, DistrictCode, DistrictName, DistrictType, CreatedAt, UpdatedAt)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [ParentKhuVucID, code, TenKhuVuc, 'QuanHuyen']
          );
          return res.status(201).json({
            KhuVucID: result.insertId,
            TenKhuVuc,
            ParentKhuVucID: Number(ParentKhuVucID),
            ViDo: ViDo || null,
            KinhDo: KinhDo || null
          });
        } else {
          // Thêm Phường/Xã
          const [districtRows] = await db.execute(
            'SELECT ProvinceID FROM new_districts WHERE DistrictID = ? LIMIT 1',
            [ParentKhuVucID]
          );
          if (districtRows.length === 0) {
            return res.status(400).json({ error: 'ParentKhuVucID không tồn tại trong hệ thống' });
          }
          const provinceId = districtRows[0].ProvinceID;
          const code = 'C_' + Date.now();
          const [result] = await db.execute(
            `INSERT INTO legacy_communes (ProvinceID, CommuneCode, CommuneName, CommuneType, DistrictID, CreatedAt, UpdatedAt)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [provinceId, code, TenKhuVuc, 'PhuongXa', ParentKhuVucID]
          );
          return res.status(201).json({
            KhuVucID: result.insertId,
            TenKhuVuc,
            ParentKhuVucID: Number(ParentKhuVucID),
            ViDo: ViDo || null,
            KinhDo: KinhDo || null
          });
        }
      }
    }

    const [result] = await KhuVuc.create(TenKhuVuc, ParentKhuVucID, ViDo, KinhDo);
    res.status(201).json({
      KhuVucID: result.insertId,
      TenKhuVuc,
      ParentKhuVucID: ParentKhuVucID || null,
      ViDo: ViDo || null,
      KinhDo: KinhDo || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { TenKhuVuc } = req.body;

    const legacyExists = await hasLegacyKhuVucTable();
    if (!legacyExists) {
      // Kiểm tra tỉnh
      const [p] = await db.execute('SELECT 1 FROM legacy_provinces WHERE ProvinceID = ? LIMIT 1', [id]);
      if (p.length > 0) {
        await db.execute('UPDATE legacy_provinces SET ProvinceName = ?, UpdatedAt = NOW() WHERE ProvinceID = ?', [TenKhuVuc, id]);
        return res.json({ KhuVucID: Number(id), TenKhuVuc });
      }

      // Kiểm tra quận
      const [d] = await db.execute('SELECT 1 FROM new_districts WHERE DistrictID = ? LIMIT 1', [id]);
      if (d.length > 0) {
        await db.execute('UPDATE new_districts SET DistrictName = ?, UpdatedAt = NOW() WHERE DistrictID = ?', [TenKhuVuc, id]);
        return res.json({ KhuVucID: Number(id), TenKhuVuc });
      }

      // Kiểm tra xã
      const [c] = await db.execute('SELECT 1 FROM legacy_communes WHERE CommuneID = ? LIMIT 1', [id]);
      if (c.length > 0) {
        await db.execute('UPDATE legacy_communes SET CommuneName = ?, UpdatedAt = NOW() WHERE CommuneID = ?', [TenKhuVuc, id]);
        return res.json({ KhuVucID: Number(id), TenKhuVuc });
      }

      return res.status(404).json({ error: 'Khu vực không tồn tại' });
    }

    const { ParentKhuVucID, ViDo, KinhDo } = req.body;
    const updates = {};
    if (TenKhuVuc !== undefined) updates.TenKhuVuc = TenKhuVuc;
    if (ParentKhuVucID !== undefined) updates.ParentKhuVucID = ParentKhuVucID;
    if (ViDo !== undefined) updates.ViDo = ViDo;
    if (KinhDo !== undefined) updates.KinhDo = KinhDo;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
    await KhuVuc.update(id, updates);
    const [rows] = await KhuVuc.getById(id);
    res.json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const legacyExists = await hasLegacyKhuVucTable();
    if (!legacyExists) {
      // Xóa tỉnh
      const [p] = await db.execute('SELECT 1 FROM legacy_provinces WHERE ProvinceID = ? LIMIT 1', [id]);
      if (p.length > 0) {
        await db.execute('DELETE FROM legacy_provinces WHERE ProvinceID = ?', [id]);
        return res.status(204).send();
      }

      // Xóa quận
      const [d] = await db.execute('SELECT 1 FROM new_districts WHERE DistrictID = ? LIMIT 1', [id]);
      if (d.length > 0) {
        await db.execute('DELETE FROM new_districts WHERE DistrictID = ?', [id]);
        return res.status(204).send();
      }

      // Xóa xã
      const [c] = await db.execute('SELECT 1 FROM legacy_communes WHERE CommuneID = ? LIMIT 1', [id]);
      if (c.length > 0) {
        await db.execute('DELETE FROM legacy_communes WHERE CommuneID = ?', [id]);
        return res.status(204).send();
      }

      return res.status(404).json({ error: 'Khu vực không tồn tại' });
    }

    await KhuVuc.delete(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNhanVien = async (req, res) => {
  try {
    const khuVucId = parseInt(req.params.id, 10);
    if (Number.isNaN(khuVucId)) {
      return res.status(400).json({ error: 'ID khu vực không hợp lệ' });
    }

    const nhanVien = await HoSoNhanVienModel.layNhanVienTheoKhuVuc(khuVucId);
    return res.json(nhanVien);
  } catch (err) {
    console.error('[khuVucController] Lỗi getNhanVien:', err);
    res.status(500).json({ error: err.message });
  }
};