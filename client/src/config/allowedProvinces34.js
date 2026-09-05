// Danh sách 34 tỉnh/thành phố sau Nghị quyết số 202/2025/QH15.
// Dùng để lọc danh sách tỉnh gốc (root provinces) trong các form địa chỉ.

export const ALLOWED_PROVINCES = [
  'Hà Nội',
  'Huế',
  'Lai Châu',
  'Điện Biên',
  'Sơn La',
  'Lạng Sơn',
  'Quảng Ninh',
  'Thanh Hóa',
  'Nghệ An',
  'Hà Tĩnh',
  'Cao Bằng',
  'Hồ Chí Minh',
  'Hải Phòng',
  'Đà Nẵng',
  'Cần Thơ',
  'Đồng Nai',
  'Tuyên Quang',
  'Lào Cai',
  'Thái Nguyên',
  'Phú Thọ',
  'Bắc Ninh',
  'Hưng Yên',
  'Ninh Bình',
  'Quảng Trị',
  'Quảng Ngãi',
  'Gia Lai',
  'Khánh Hòa',
  'Lâm Đồng',
  'Đắk Lắk',
  'Tây Ninh',
  'Vĩnh Long',
  'Đồng Tháp',
  'Cà Mau',
  'An Giang'
];

const ALLOWED_PROVINCE_ALIASES = [
  'thua thien hue',
  'thanh pho hue',
  'thanh pho ho chi minh',
  'tp ho chi minh',
  'tp. ho chi minh',
  'hcm'
];

const DISPLAY_NAME_OVERRIDES = {
  'ho chi minh': 'Thành phố Hồ Chí Minh',
  'hcm': 'Thành phố Hồ Chí Minh',
  'thanh pho ho chi minh': 'Thành phố Hồ Chí Minh',
  'thua thien hue': 'Thành phố Huế',
  'thanh pho hue': 'Thành phố Huế'
};

export const normalizeProvinceName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^((thanh pho|tp\.|tp|tinh|tỉnh)\s*)/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const allowedIds = ALLOWED_PROVINCES.filter((item) => Number.isInteger(item));
const allowedNames = new Set(
  ALLOWED_PROVINCES.filter((item) => typeof item === 'string').map(normalizeProvinceName)
);
ALLOWED_PROVINCE_ALIASES.forEach((alias) => allowedNames.add(normalizeProvinceName(alias)));

const getProvinceDisplayName = (value) => {
  const raw = String(value || '').trim();
  const normalized = normalizeProvinceName(raw);
  return DISPLAY_NAME_OVERRIDES[normalized] || raw;
};

export const isAllowedProvince = (item) => {
  if (!item) return false;

  if (typeof item.KhuVucID === 'number' && allowedIds.length > 0) {
    return allowedIds.includes(item.KhuVucID);
  }

  const name = normalizeProvinceName(item.TenKhuVuc || item.name || '');
  return allowedNames.has(name);
};

export const mapProvinceDisplayName = (item) => {
  if (!item) return item;
  const rawName = item.TenKhuVuc || item.name || '';
  const displayName = getProvinceDisplayName(rawName);
  return displayName === rawName ? item : { ...item, TenKhuVuc: displayName };
};

export const normalizeProvince = normalizeProvinceName;
