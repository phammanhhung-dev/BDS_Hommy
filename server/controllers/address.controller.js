const db = require('../config/db');

const safeJsonResponse = (res, status, payload) => res.status(status).json(payload);

const normalizeProvinceRow = (row = {}) => ({
  KhuVucID: row.KhuVucID ?? row.ProvinceID ?? row.id ?? null,
  TenKhuVuc: row.TenKhuVuc ?? row.ProvinceName ?? row.name ?? '',
  MaKhuVuc: row.MaKhuVuc ?? row.ProvinceCode ?? row.code ?? '',
  ProvinceType: row.ProvinceType ?? row.type ?? 'Tinh',
  LoaiKhuVuc: row.LoaiKhuVuc ?? row.ProvinceType ?? row.type ?? 'Tinh'
});

const normalizeDistrictRow = (row = {}) => ({
  KhuVucID: row.KhuVucID ?? row.DistrictID ?? row.id ?? null,
  TenKhuVuc: row.TenKhuVuc ?? row.DistrictName ?? row.name ?? '',
  MaKhuVuc: row.MaKhuVuc ?? row.DistrictCode ?? row.code ?? '',
  ProvinceID: row.ProvinceID ?? row.province_id ?? null,
  ProvinceName: row.ProvinceName ?? row.province_name ?? '',
  LoaiKhuVuc: row.LoaiKhuVuc ?? row.DistrictType ?? 'QuanHuyen'
});

const normalizeWardRow = (row = {}) => ({
  KhuVucID: row.KhuVucID ?? row.WardID ?? row.CommuneID ?? row.id ?? null,
  TenKhuVuc: row.TenKhuVuc ?? row.WardName ?? row.CommuneName ?? row.name ?? '',
  MaKhuVuc: row.MaKhuVuc ?? row.WardCode ?? row.CommuneCode ?? row.code ?? '',
  ProvinceID: row.ProvinceID ?? row.province_id ?? null,
  ProvinceName: row.ProvinceName ?? row.province_name ?? '',
  DistrictID: row.DistrictID ?? row.district_id ?? null,
  DistrictName: row.DistrictName ?? row.district_name ?? '',
  LoaiKhuVuc: row.LoaiKhuVuc ?? row.WardType ?? row.CommuneType ?? 'PhuongXa'
});

const tableExists = async (tableName) => {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return Array.isArray(rows) && rows.length > 0;
};

let cachedCommuneHasDistrictColumn = null;
const communeHasDistrictColumn = async () => {
  if (typeof cachedCommuneHasDistrictColumn === 'boolean') {
    return cachedCommuneHasDistrictColumn;
  }

  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
     LIMIT 1`,
    ['legacy_communes', 'DistrictID']
  );
  cachedCommuneHasDistrictColumn = Array.isArray(rows) && rows.length > 0;
  return cachedCommuneHasDistrictColumn;
};

const normalizeStringValue = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const buildSuggestedMappingPayload = (row = {}) => ({
  old_ward_code: normalizeStringValue(row.old_ward_code),
  old_ward_name: normalizeStringValue(row.old_ward_name),
  old_district_code: normalizeStringValue(row.old_district_code),
  old_district_name: normalizeStringValue(row.old_district_name),
  new_ward_code: normalizeStringValue(row.new_ward_code),
  new_ward_name: normalizeStringValue(row.new_ward_name),
  new_district_code: normalizeStringValue(row.new_district_code),
  new_district_name: normalizeStringValue(row.new_district_name),
  province_code: normalizeStringValue(row.province_code),
  province_name: normalizeStringValue(row.province_name)
});

exports.getSuggestedMapping = async (req, res) => {
  try {
    const wardCode = normalizeStringValue(req.query.ward_code || req.query.wardCode || '');
    const fromVersion = normalizeStringValue(req.query.from_version || req.query.fromVersion || '').toUpperCase();

    if (!wardCode) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Tham số ward_code là bắt buộc.'
      });
    }

    const hasMappingTable = await tableExists('address_mappings');
    if (!hasMappingTable) {
      return safeJsonResponse(res, 200, {
        success: true,
        data: null
      });
    }

    const queryBy = fromVersion === 'POST_2025' ? 'new_ward_code' : 'old_ward_code';
    const [rows] = await db.query(
      `SELECT * FROM address_mappings WHERE ${queryBy} = ? LIMIT 1`,
      [wardCode]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return safeJsonResponse(res, 200, {
        success: true,
        data: null
      });
    }

    return safeJsonResponse(res, 200, {
      success: true,
      data: buildSuggestedMappingPayload(rows[0])
    });
  } catch (error) {
    console.error('[address.controller.getSuggestedMapping] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy mapping địa chỉ đề xuất.'
    });
  }
};

const normalizeLegacyNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const buildCrosswalkSuggestion = (row, mode = 'old-to-new') => {
  const labelParts = [];
  const legacyProvinceId = normalizeLegacyNumber(row.old_province_id ?? row.legacyProvinceId ?? row.oldProvinceId ?? null);
  const legacyDistrictId = normalizeLegacyNumber(row.legacy_district_id ?? row.legacyDistrictId ?? null);
  const legacyWardId = normalizeLegacyNumber(row.legacy_ward_id ?? row.legacyWardId ?? null);
  const newProvinceId = normalizeLegacyNumber(row.new_province_id ?? row.newProvinceId ?? null);
  const newWardId = normalizeLegacyNumber(row.new_ward_id ?? row.newWardId ?? null);
  const streetName = normalizeStringValue(row.street_name ?? row.streetName ?? '');

  if (mode === 'new-to-old') {
    const legacyWardName = normalizeStringValue(row.legacy_ward_name ?? row.legacyWardName ?? '');
    const legacyDistrictName = normalizeStringValue(row.legacy_district_name ?? row.legacyDistrictName ?? '');
    const provinceName = normalizeStringValue(row.province_name ?? row.provinceName ?? '');
    if (legacyWardName) labelParts.push(legacyWardName);
    if (legacyDistrictName) labelParts.push(legacyDistrictName);
    if (provinceName) labelParts.push(provinceName);
  } else {
    const newWardName = normalizeStringValue(row.new_ward_name ?? row.newWardName ?? '');
    const newDistrictName = normalizeStringValue(row.new_district_name ?? row.newDistrictName ?? '');
    const provinceName = normalizeStringValue(row.province_name ?? row.provinceName ?? '');
    if (newWardName) labelParts.push(newWardName);
    if (newDistrictName) labelParts.push(newDistrictName);
    if (provinceName) labelParts.push(provinceName);
  }

  if (!labelParts.length && streetName) {
    labelParts.push(streetName);
  }

  return {
    label: labelParts.join(', '),
    provinceId: mode === 'new-to-old' ? newProvinceId : newProvinceId || legacyProvinceId,
    legacyDistrictId,
    legacyWardId,
    legacyProvinceId,
    newProvinceId,
    newWardId,
    streetName,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined
  };
};

exports.suggestMapping = async (req, res) => {
  try {
    const payload = req.body || {};
    const mode = String(payload.mode || '').toLowerCase();
    const provinceId = normalizeLegacyNumber(payload.provinceId ?? payload.province_id ?? null);
    const legacyDistrictId = normalizeLegacyNumber(payload.legacyDistrictId ?? payload.legacy_district_id ?? null);
    const legacyWardId = normalizeLegacyNumber(payload.legacyWardId ?? payload.legacy_ward_id ?? null);
    const newWardId = normalizeLegacyNumber(payload.wardId ?? payload.ward_id ?? null);
    const streetName = normalizeStringValue(payload.streetName ?? payload.street_name ?? '');

    const effectiveMode = mode === 'new-to-old' ? 'new-to-old' : 'old-to-new';

    if (effectiveMode === 'old-to-new') {
      if (!provinceId || !legacyDistrictId || !legacyWardId) {
        return safeJsonResponse(res, 200, {
          success: true,
          suggestions: [],
          isCurrentAdminUnit: false,
          needManualInput: true
        });
      }

      const [rows] = await db.query(
        `SELECT *
         FROM address_crosswalk
         WHERE old_province_id = ?
           AND legacy_district_id = ?
           AND legacy_ward_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [provinceId, legacyDistrictId, legacyWardId]
      );

      const suggestions = Array.isArray(rows) && rows.length > 0
        ? [buildCrosswalkSuggestion(rows[0], 'old-to-new')]
        : [];

      return safeJsonResponse(res, 200, {
        success: true,
        suggestions,
        isCurrentAdminUnit: false,
        needManualInput: suggestions.length === 0
      });
    }

    if (!provinceId || !newWardId) {
      return safeJsonResponse(res, 200, {
        success: true,
        suggestions: [],
        isCurrentAdminUnit: true,
        needManualInput: true
      });
    }

    let sql = `
      SELECT *
      FROM address_crosswalk
      WHERE new_province_id = ?
        AND new_ward_id = ?
    `;
    const params = [provinceId, newWardId];

    if (streetName) {
      sql += ` AND (street_name IS NULL OR LOWER(street_name) LIKE ?)`;
      params.push(`%${streetName.toLowerCase()}%`);
    }

    sql += ` ORDER BY confidence DESC, created_at DESC`;

    const [rows] = await db.query(sql, params);
    const suggestions = Array.isArray(rows)
      ? rows.map((row) => buildCrosswalkSuggestion(row, 'new-to-old'))
      : [];

    return safeJsonResponse(res, 200, {
      success: true,
      suggestions,
      isCurrentAdminUnit: true,
      needManualInput: suggestions.length === 0
    });
  } catch (error) {
    console.error('[address.controller.suggestMapping] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      suggestions: [],
      isCurrentAdminUnit: false,
      needManualInput: true,
      message: 'Không thể đề xuất mapping địa chỉ.'
    });
  }
};

exports.manualReport = async (req, res) => {
  try {
    const payload = req.body || {};
    const currentAddress = payload.currentAddress || {};
    const legacyAddressRef = payload.legacyAddressRef || {};
    const reporterNote = normalizeStringValue(payload.reporterNote || payload.note || '');
    const displayPreference = normalizeStringValue(payload.displayPreference || 'current');

    const sql = `
      INSERT INTO address_crosswalk_pending (
        old_province_id,
        legacy_district_id,
        legacy_ward_id,
        new_province_id,
        new_ward_id,
        street_name,
        confidence,
        reporter_note,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, 'pending', NOW(), NOW())`;

    const values = [
      normalizeLegacyNumber(legacyAddressRef.legacyProvinceId ?? legacyAddressRef.legacy_province_id ?? null),
      normalizeLegacyNumber(legacyAddressRef.legacyDistrictId ?? legacyAddressRef.legacy_district_id ?? null),
      normalizeLegacyNumber(legacyAddressRef.legacyWardId ?? legacyAddressRef.legacy_ward_id ?? null),
      normalizeLegacyNumber(currentAddress.provinceId ?? currentAddress.province_id ?? null),
      normalizeLegacyNumber(currentAddress.wardId ?? currentAddress.ward_id ?? null),
      normalizeStringValue(currentAddress.streetName ?? currentAddress.street_name ?? ''),
      reporterNote || `displayPreference=${displayPreference}; ${normalizeStringValue(currentAddress.detailAddress || currentAddress.detail_address || '')}`
    ];

    await db.query(sql, values);
    return safeJsonResponse(res, 200, {
      success: true,
      message: 'Đã gửi báo cáo địa chỉ để kiểm tra lại.'
    });
  } catch (error) {
    console.error('[address.controller.manualReport] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể gửi báo cáo địa chỉ.'
    });
  }
};

exports.convertLegacyAddress = async (req, res) => {
  try {
    const payload = req.body || {};
    const oldProvinceId = normalizeLegacyNumber(payload.provinceId ?? payload.province_id ?? null);
    const legacyDistrictId = normalizeLegacyNumber(payload.legacyDistrictId ?? payload.legacy_district_id ?? null);
    const legacyWardId = normalizeLegacyNumber(payload.legacyWardId ?? payload.legacy_ward_id ?? null);

    if (!oldProvinceId || !legacyDistrictId || !legacyWardId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'provinceId, legacyDistrictId và legacyWardId là bắt buộc.'
      });
    }

    const [rows] = await db.query(
      `SELECT new_province_id, new_ward_id
       FROM address_crosswalk
       WHERE old_province_id = ?
         AND legacy_district_id = ?
         AND legacy_ward_id = ?
       ORDER BY confidence DESC, created_at DESC
       LIMIT 1`,
      [oldProvinceId, legacyDistrictId, legacyWardId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const match = rows[0];
      return safeJsonResponse(res, 200, {
        success: true,
        newProvinceId: match.new_province_id,
        newWardId: match.new_ward_id
      });
    }

    return safeJsonResponse(res, 200, {
      success: false,
      message: 'Không tìm thấy mapping phù hợp.'
    });
  } catch (error) {
    console.error('[address.controller.convertLegacyAddress] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể chuyển đổi địa chỉ legacy.'
    });
  }
};

exports.getCurrentProvinces = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ProvinceID AS KhuVucID,
              ProvinceCode AS MaKhuVuc,
              ProvinceName AS TenKhuVuc,
              ProvinceType AS ProvinceType
       FROM new_provinces
       ORDER BY ProvinceName ASC`
    );

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeProvinceRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getCurrentProvinces] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách tỉnh/thành phố.'
    });
  }
};

exports.getLegacyProvinces = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ProvinceID AS KhuVucID,
              ProvinceCode AS MaKhuVuc,
              ProvinceName AS TenKhuVuc,
              ProvinceType AS ProvinceType
       FROM legacy_provinces
       ORDER BY ProvinceName ASC`
    );

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeProvinceRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getLegacyProvinces] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách tỉnh/thành phố (legacy).'
    });
  }
};

exports.getProvinces = exports.getCurrentProvinces;

exports.getDistricts = async (req, res) => {
  try {
    const provinceId = Number(req.params.provinceId || req.query.province_id || req.query.provinceId || 0);

    if (!provinceId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Tham số province_id là bắt buộc.'
      });
    }

    const hasDistrictTable = await tableExists('new_districts');
    if (!hasDistrictTable) {
      return safeJsonResponse(res, 200, {
        success: true,
        data: []
      });
    }

    const [rows] = await db.query(
      `SELECT d.DistrictID AS KhuVucID,
              d.DistrictCode AS MaKhuVuc,
              d.DistrictName AS TenKhuVuc,
              d.ProvinceID
       FROM new_districts d
       WHERE d.ProvinceID = ?
       ORDER BY d.DistrictName ASC`,
      [provinceId]
    );

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeDistrictRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getDistricts] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách quận/huyện.'
    });
  }
};

exports.getWards = async (req, res) => {
  try {
    const districtId = Number(req.params.districtId || req.query.district_id || req.query.districtId || 0);

    if (!districtId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Tham số district_id là bắt buộc.'
      });
    }

    const hasCommuneDistrict = await communeHasDistrictColumn();
    let rows = [];

    if (hasCommuneDistrict) {
      [rows] = await db.query(
        `SELECT c.CommuneID AS KhuVucID,
                c.CommuneCode AS MaKhuVuc,
                c.CommuneName AS TenKhuVuc,
                c.ProvinceID,
                c.DistrictID
         FROM legacy_communes c
         WHERE c.DistrictID = ?
         ORDER BY c.CommuneName ASC`,
        [districtId]
      );
    } else {
      const [districtRows] = await db.query(
        `SELECT DistrictID, ProvinceID, DistrictName
         FROM new_districts
         WHERE DistrictID = ?
         LIMIT 1`,
        [districtId]
      );

      if (!Array.isArray(districtRows) || districtRows.length === 0) {
        return safeJsonResponse(res, 200, {
          success: true,
          data: []
        });
      }

      const district = districtRows[0];
      const districtName = normalizeStringValue(district.DistrictName);

      [rows] = await db.query(
        `SELECT c.CommuneID AS KhuVucID,
                c.CommuneCode AS MaKhuVuc,
                c.CommuneName AS TenKhuVuc,
                c.ProvinceID,
                ? AS DistrictID
         FROM legacy_communes c
         WHERE c.ProvinceID = ?
           AND LOWER(c.CommuneName) LIKE CONCAT('%(', LOWER(?), ')%')
         ORDER BY c.CommuneName ASC`,
        [districtId, district.ProvinceID, districtName]
      );
    }

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeWardRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getWards] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách phường/xã.'
    });
  }
};

exports.getWardsByCurrentProvince = async (req, res) => {
  try {
    const provinceId = Number(req.params.provinceId || 0);

    if (!provinceId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Tham số provinceId là bắt buộc.'
      });
    }

    const [rows] = await db.query(
      `SELECT CommuneID AS KhuVucID,
              CommuneCode AS MaKhuVuc,
              CommuneName AS TenKhuVuc,
              ProvinceID
       FROM new_communes
       WHERE ProvinceID = ?
       ORDER BY CommuneName ASC`,
      [provinceId]
    );

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeWardRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getWardsByCurrentProvince] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách phường/xã theo tỉnh/thành phố.'
    });
  }
};

exports.getWardsByCurrentDistrict = async (req, res) => {
  try {
    const districtId = Number(req.params.districtId || 0);

    if (!districtId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Tham số districtId là bắt buộc.'
      });
    }

    const [rows] = await db.query(
      `SELECT CommuneID AS KhuVucID,
              CommuneCode AS MaKhuVuc,
              CommuneName AS TenKhuVuc,
              ProvinceID,
              DistrictID
       FROM new_communes
       WHERE DistrictID = ?
       ORDER BY CommuneName ASC`,
      [districtId]
    );

    return safeJsonResponse(res, 200, {
      success: true,
      data: Array.isArray(rows) ? rows.map(normalizeWardRow) : []
    });
  } catch (error) {
    console.error('[address.controller.getWardsByCurrentDistrict] Error:', error);
    return safeJsonResponse(res, 500, {
      success: false,
      message: 'Không thể lấy danh sách phường/xã theo quận/huyện.'
    });
  }
};

exports.getKhuVucTree = async (req, res) => {
  try {
    const trees = [];
    try {
      const [newProvinces] = await db.query(
        'SELECT ProvinceID AS KhuVucID, ProvinceName AS TenkhuVuc FROM new_provinces ORDER BY ProvinceName ASC'
      );
      if (newProvinces && newProvinces.length > 0) {
        const children = await Promise.all(newProvinces.map(async (province) => {
          let communes = [];
          try {
            const [cRows] = await db.query(
              'SELECT CommuneID AS KhuVucID, CommuneName AS TenKhuVuc FROM new_communes WHERE ProvinceID = ? ORDER BY CommuneName ASC',
              [province.KhuVucID]
            );
            communes = cRows || [];
          } catch (_) {}
          return {
            KhuVucID: province.KhuVucID,
            TenKhuVuc: province.TenkhuVuc,
            type: 'new_province',
            children: communes.map(commune => ({
              KhuVucID: commune.KhuVucID,
              TenkhuVuc: commune.TenKhuVuc,
              type: 'new_commune',
              children: []
            }))
          };
        }));
        trees.push({
          KhuVucID: -2,
          TenkhuVuc: 'Theo đơn vị mới',
          type: 'new',
          children
        });
      }
    } catch (e) {
      console.warn('[getKhuVucTree] new_provinces warning:', e.message);
    }
    if (trees.length === 0) {
      try {
        const [kvRows] = await db.query('SELECT KhuVucID, TenKhuVuc FROM khuvuc ORDER BY TenKhuVuc ASC');
        trees.push({
          KhuVucID: -1,
          TenKhuVuc: 'Khu vực',
          type: 'standard',
          children: (kvRows || []).map(kv => ({
            KhuVucID: kv.KhuVucID,
            TenKhuVuc: kv.KhuVucID,
            type: 'khuvuc',
            children: []
          }))
        });
      } catch (_) {}
    }
    return safeJsonResponse(res, 200, trees);
  } catch (error) {
    console.error('[address.controller.getKhuVucTree] Error:', error);
    return safeJsonResponse(res, 200, []);
  }
};
