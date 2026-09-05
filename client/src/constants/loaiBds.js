/**
 * Danh sách nhóm Loại BĐS chuẩn hóa dành riêng cho Mua Bán
 */
const LOAI_BDS_BAN_GROUPS = [
  {
    label: 'CĂN HỘ / CHUNG CƯ',
    options: [
      { value: 'CanHo', label: 'Căn hộ chung cư', icon: '🏢' },
      { value: 'CanHoMini', label: 'Chung cư mini', icon: '🏬' },
      { value: 'Penthouse', label: 'Penthouse / Duplex', icon: '🏰' },
      { value: 'Shophouse', label: 'Shophouse / Officetel', icon: '🛍️' }
    ]
  },
  {
    label: 'NHÀ Ở / BIỆT THỰ',
    options: [
      { value: 'NhaO', label: 'Nhà riêng / Nhà ở', icon: '🏠' },
      { value: 'NhaPho', label: 'Nhà phố', icon: '🏡' },
      { value: 'NhaLienKe', label: 'Nhà liền kề', icon: '🏘️' },
      { value: 'BietThu', label: 'Biệt thự / Villa', icon: '🏛️' }
    ]
  },
  {
    label: 'ĐẤT ĐAI',
    options: [
      { value: 'DatNen', label: 'Đất nền dự án', icon: '🗺️' },
      { value: 'DatO', label: 'Đất ở / Thổ cư', icon: '📍' },
      { value: 'DatNongNghiep', label: 'Đất nông nghiệp / Trang trại', icon: '🚜' }
    ]
  },
  {
    label: 'THƯƠNG MẠI & KHÁC',
    options: [
      { value: 'VanPhong', label: 'Văn phòng / Mặt bằng kinh doanh', icon: '🏢' },
      { value: 'KhoXuong', label: 'Kho / Nhà xưởng', icon: '🏭' },
      { value: 'Khac', label: 'Loại BDS khác', icon: '🧩' }
    ]
  }
];

/**
 * Danh sách nhóm Loại BĐS chuẩn hóa dành riêng cho Cho Thuê
 */
const LOAI_BDS_THUE_GROUPS = [
  {
    label: 'CĂN HỘ & BẤT ĐỘNG SẢN CHO THUÊ',
    options: [
      { value: 'PhongTro', label: 'Phòng / Studio cho thuê', icon: '🚶' },
      { value: 'CanHo', label: 'Căn hộ chung cư', icon: '🏢' },
      { value: 'CanHoMini', label: 'Chung cư mini / Căn hộ dịch vụ', icon: '🎬' },
      { value: 'Homestay', label: 'Homestay / Serviced Apartment', icon: '🏡' }
    ]
  },
  {
    label: 'NHÀ Ở & MẶT BẰNG CHO THUÊ',
    options: [
      { value: 'NhaO', label: 'Nhà nguyên căn / Nhà riêng', icon: '🏠' },
      { value: 'NhaPho', label: 'Nhà phố nguyên căn', icon: '🏡' },
      { value: 'MatBang', label: 'Mặt bằng kinh doanh', icon: '🏪' },
      { value: 'Shophouse', label: 'Shophouse / Cửa hàng, ki-ốt', icon: '🛍️' },
      { value: 'VanPhong', label: 'Văn phòng cho thuê', icon: '🏢' },
      { value: 'KhoXuong', label: 'Kho / Nhà xưởng cho thuê', icon: '🏭' },
      { value: 'Khac', label: 'Loại BDS khác', icon: '🧩' }
    ]
  }
];

export const LOAI_BDS_GROUPS = {
  Ban: LOAI_BDS_BAN_GROUPS,
  Thue: LOAI_BDS_THUE_GROUPS
};

export const LOAI_BDS_SELECT_GROUPS = [
  {
    label: 'Nhà ở & Căn hộ',
    options: [
      { value: 'CanHoChungCu', label: 'Căn hộ chung cư', icon: '🏢' },
      { value: 'NhaPho', label: 'Nhà phố, liền kề', icon: '🏡' },
      { value: 'NhaO', label: 'Nhà riêng', icon: '🏠' },
      { value: 'BietThu', label: 'Biệt thự, villa', icon: '🏰' }
    ]
  },
  {
    label: 'Đất nền & Dự án',
    options: [
      { value: 'DatNenDuAn', label: 'Đất nền dự án', icon: '🗺️' },
      { value: 'DatO', label: 'Đất ở', icon: '📍' },
      { value: 'DatNongNghiep', label: 'Đất nông nghiệp', icon: '🚜' }
    ]
  },
  {
    label: 'Thương mại & Cơ sở',
    options: [
      { value: 'VanPhong', label: 'Văn phòng, mặt bằng kinh doanh', icon: '🏢' },
      { value: 'KhoNhaXuong', label: 'Kho, bãi, nhà xưởng', icon: '🏭' },
      { value: 'CuaHangKiOt', label: 'Cửa hàng, ki-ốt', icon: '🛒' }
    ]
  },
  {
    label: 'Khác',
    options: [
      { value: 'Khac', label: 'Loại BDS khác', icon: '🧩' }
    ]
  }
];

export const LOAI_BDS_VALUE_ALIASES = {
  CanHoChungCu: 'CanHo',
  NhaORiengLe: 'NhaO',
  NhaOriengLe: 'NhaO',
  DatNenDuAn: 'DatNen',
  KhoNhaXuong: 'KhoXuong',
  CuaHangKiOt: 'CuaHangKiOt',
  Khac: 'Khac'
};

export const normalizeLoaiBdsValue = (value) => {
  if (!value) return '';
  return LOAI_BDS_VALUE_ALIASES[value] || value;
};

export const getLoaiBdsLabel = (loaiBds, hinhThuc) => {
  if (!loaiBds) return '';
  const normalizedValue = normalizeLoaiBdsValue(loaiBds);
  if (normalizedValue === 'Khac') return 'Loại BDS khác';
  
  const groups = hinhThuc && LOAI_BDS_GROUPS[hinhThuc] 
    ? LOAI_BDS_GROUPS[hinhThuc] 
    : [...(LOAI_BDS_GROUPS.Ban || []), ...(LOAI_BDS_GROUPS.Thue || []), ...LOAI_BDS_SELECT_GROUPS];

  for (const group of groups) {
    const option = group.options?.find((item) => item.value === normalizedValue);
    if (option) return option.label;
  }

  return loaiBds === 'Khac' ? 'Loại BDS khác' : loaiBds;
};