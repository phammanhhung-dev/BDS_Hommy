import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import { TinDangService, DuAnService } from '../../services/ChuDuAnService';
import ModalChinhSuaToaDo from '../../components/ChuDuAn/ModalChinhSuaToaDo';
import AddressSyncBlock from '../../components/ChuDuAn/AddressSyncBlock';
import { LOAI_BDS_GROUPS } from '../../constants/loaiBds';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import { getAuthHeaderValue } from '../../utils/authToken';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// React Icons
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineXMark,
  HiOutlineLightBulb,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi2';

const HINH_THUC_OPTIONS = [
  { value: 'Ban', label: 'Bán' },
  { value: 'Thue', label: 'Cho thuê' }
];

const HUONG_OPTIONS = [
  'Đông', 'Tây', 'Nam', 'Bắc',
  'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam'
];

const PHAP_LY_OPTIONS = [
  'Sổ hồng/ Sổ đỏ', 'Hợp đồng mua bán',
  'Đang chờ sổ', 'Giấy tờ khác'
];

// Import helper functions from old file
const chuanHoaTenKhuVuc = (ten = '') => {
  if (!ten) return '';
  const cleaned = ten
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.replace(/\b(\d+)\b/g, (_, group) => {
    const parsed = parseInt(group, 10);
    return Number.isNaN(parsed) ? group : String(parsed);
  });
};

const normalizeGiaInput = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  if (!str) return '';
  str = str.replace(/,/g, '.');
  const decimalMatch = str.match(/^(\d+)\.(\d+)$/);
  if (decimalMatch) {
    const [, intPart, decimalPart] = decimalMatch;
    if (decimalPart.length <= 2) {
      const num = Math.round(parseFloat(str));
      return Number.isFinite(num) ? String(num) : '';
    }
  }
  return str.replace(/\D/g, '');
};

const normalizeAddressData = (payload, context = 'list') => {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

  return rawList
    .map((item) => {
      const source = item || {};
      const id = source.KhuVucID ?? source.id ?? source.ProvinceID ?? source.DistrictID ?? source.WardID ?? source.khuVucId ?? source.province_id ?? source.district_id ?? source.ward_id;
      const name = source.TenKhuVuc ?? source.name ?? source.ProvinceName ?? source.DistrictName ?? source.WardName ?? source.tenKhuVuc ?? source.province_name ?? source.district_name ?? source.ward_name ?? '';
      const code = source.MaKhuVuc ?? source.code ?? source.ProvinceCode ?? source.DistrictCode ?? source.WardCode ?? source.maKhuVuc ?? '';
      const provinceId = source.ProvinceID ?? source.province_id ?? source.ParentProvinceID ?? null;
      const districtId = source.DistrictID ?? source.district_id ?? source.ParentDistrictID ?? null;
      const districtName = source.DistrictName ?? source.district_name ?? source.districtName ?? null;
      const provinceName = source.ProvinceName ?? source.province_name ?? source.provinceName ?? null;
      const normalizedItem = {
        ...source,
        KhuVucID: id ?? '',
        TenKhuVuc: String(name || '').trim(),
        MaKhuVuc: String(code || '').trim(),
        ProvinceID: provinceId ?? source.ParentKhuVucID ?? source.ParentProvinceID ?? null,
        ProvinceName: provinceName ?? source.TenTinh ?? source.ProvinceName ?? '',
        DistrictID: districtId ?? null,
        DistrictName: districtName ?? source.TenQuan ?? source.DistrictName ?? '',
      };

      if (context === 'provinces') {
        return {
          ...normalizedItem,
          KhuVucID: id ?? '',
          TenKhuVuc: String(name || '').trim(),
          MaKhuVuc: String(code || '').trim(),
          LoaiKhuVuc: source.LoaiKhuVuc || source.ProvinceType || 'Tinh'
        };
      }

      if (context === 'districts') {
        return {
          ...normalizedItem,
          KhuVucID: id ?? '',
          TenKhuVuc: String(name || '').trim(),
          MaKhuVuc: String(code || '').trim(),
          ParentKhuVucID: provinceId ?? source.ParentKhuVucID ?? null,
          LoaiKhuVuc: source.LoaiKhuVuc || source.DistrictType || 'QuanHuyen'
        };
      }

      return {
        ...normalizedItem,
        KhuVucID: id ?? '',
        TenKhuVuc: String(name || '').trim(),
        MaKhuVuc: String(code || '').trim(),
        ParentKhuVucID: districtId ?? source.ParentKhuVucID ?? null,
        LoaiKhuVuc: source.LoaiKhuVuc || source.WardType || 'PhuongXa'
      };
    })
    .filter((item) => item && (String(item.KhuVucID ?? '').trim() || String(item.TenKhuVuc || '').trim()));
};

const fetchSuggestedMapping = async (wardCode, fromVersion) => {
  if (!wardCode) return null;

  try {
    const response = await axios.get(buildApiUrl('/api/address/suggest-mapping'), {
      params: {
        ward_code: wardCode,
        from_version: fromVersion
      }
    });

    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Lỗi suggest-mapping:', error);
    return null;
  }
};

/**
 * Format giá tiền: 10000 → "10.000"
 */
const formatGiaTien = (value) => {
  const digits = normalizeGiaInput(value);
  if (!digits) return '';
  // Thêm dấu chấm phân cách hàng nghìn
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse giá tiền về số: "10.000" → 10000
 */
const parseGiaTien = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '');
};

const tachTokenSoVaChu = (text = '') => {
  const soMatch = text.match(/\d+/g);
  const so = soMatch ? soMatch.join('-') : '';
  const chu = text.replace(/\d+/g, '').trim();
  return { so, chu };
};

const timKhuVucTheoTen = (danhSach = [], tenCanTim = '', debugLabel = 'khu-vuc') => {
  if (!tenCanTim) return null;
  const tenChuan = chuanHoaTenKhuVuc(tenCanTim);

  // Exact match
  const exactMatch = danhSach.find((item) => {
    const tenTrongDs = chuanHoaTenKhuVuc(item?.TenKhuVuc || '');
    return tenTrongDs === tenChuan;
  });
  if (exactMatch) return exactMatch;

  // Token match
  const tokenCanTim = tachTokenSoVaChu(tenChuan);
  const tokenMatch = danhSach.find((item) => {
    const tenTrongDs = chuanHoaTenKhuVuc(item?.TenKhuVuc || '');
    const tokenDs = tachTokenSoVaChu(tenTrongDs);
    if (tokenCanTim.so && tokenDs.so && tokenCanTim.so === tokenDs.so) {
      if (!tokenCanTim.chu || !tokenDs.chu) return true;
      if (tokenDs.chu.includes(tokenCanTim.chu) || tokenCanTim.chu.includes(tokenDs.chu)) {
        return true;
      }
    }
    return false;
  });
  if (tokenMatch) return tokenMatch;

  // Include match
  const includesMatch = danhSach.find((item) => {
    const tenTrongDs = chuanHoaTenKhuVuc(item?.TenKhuVuc || '');
    if (!tenTrongDs) return false;
    return tenTrongDs.includes(tenChuan) || tenChuan.includes(tenTrongDs);
  });
  return includesMatch || null;
};

const locKhuVucTheoTuKhoa = (danhSach = [], tuKhoa = '') => {
  const keyword = chuanHoaTenKhuVuc(tuKhoa);
  if (!keyword) return danhSach;

  return danhSach.filter((item) => {
    const tenKhuVuc = chuanHoaTenKhuVuc(item?.TenKhuVuc || '');
    return tenKhuVuc.includes(keyword);
  });
};

const tachDiaChiDuAn = (diaChi = '') => {
  if (!diaChi) return { chiTiet: '', phuong: '', tinh: '' };
  const parts = diaChi.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { chiTiet: '', phuong: '', tinh: '' };
  const tinh = parts.length > 0 ? parts.pop() : '';
  const phuong = parts.length > 0 ? parts.pop() : '';
  const chiTiet = parts.join(', ');
  return { chiTiet: chiTiet || '', phuong, tinh };
};

const toRelativeUploadPath = (url = '') => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads')) return url;
  if (url.startsWith('uploads/')) return `/${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.pathname?.startsWith('/uploads')) {
      return parsed.pathname;
    }
  } catch {
    // không phải absolute URL
  }
  return url;
};

// Fix Leaflet default icon issue for embedded maps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapAutoCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView([position.lat, position.lng], map.getZoom());
  }, [position, map]);
  return null;
}

/**
 * Tạo tin đăng mới - Version Wizard với Accordion Sections
 */
function TaoTinDang() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic info
    HinhThuc: '', // 'Ban' or 'Thue'
    LoaiTaiSan: '',
    TieuDe: '',
    MoTa: '',

    // Location
    Tinh: '',
    Phuong: '',
    Duong: '',
    ViDo: '',
    KinhDo: '',

    // Property details
    DienTichDat: '',
    DienTichSuDung: '',
    GiaTien: '',
    GiaTienTrenM2: '',
    DonViGia: 'm2', // 'm2', 'thang', 'nam'
    SoTang: '',
    Tang: '',
    SoPhongNgu: '',
    SoPhongTam: '',
    Huong: '',
    PhapLy: '',
    NamXayDung: '',
    NoiThat: '',

    // Contact
    TenLienHe: '',
    SoDienThoai: '',
    Email: '',

    // Package & payment
    GoiDangTin: '',

    // Original fields
    DuAnID: '',
    KhuVucID: '',
    ChinhSachCocID: 1,
    URL: [],
    TienIch: [],
    GiaDien: '',
    GiaNuoc: '',
    GiaDichVu: '',
    MoTaGiaDichVu: ''
  });

  // ===== DỰ ÁN STATE & SYNC =====
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        // Tải tất cả các dự án trong hệ thống để người dùng có thể chọn dự án theo khu vực
        const res = await DuAnService.layTatCaDuAn();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setProjects(list);
      } catch (err) {
        console.error('Lỗi tải tất cả dự án, fallback sang dự án của chủ dự án:', err);
        try {
          const fallbackRes = await DuAnService.layDanhSach();
          const list = Array.isArray(fallbackRes?.data) ? fallbackRes.data : [];
          setProjects(list);
        } catch (fErr) {
          console.error('Lỗi fallback tải dự án:', fErr);
        }
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  const handleProjectChange = (project) => {
    if (!project) {
      setSelectedProjectId('');
      setSelectedProject(null);
      setFormData(prev => ({ ...prev, DuAnID: null }));
      return;
    }

    const projId = project.DuAnID || project.id;
    setSelectedProjectId(String(projId));
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      DuAnID: projId,
      ChinhSachCocID: project.ChinhSachCocID || prev.ChinhSachCocID || 1
    }));

    // Cập nhật vị trí bản đồ theo tọa độ của dự án
    if (project.ViDo && project.KinhDo) {
      const lat = parseFloat(project.ViDo);
      const lng = parseFloat(project.KinhDo);
      if (!isNaN(lat) && !isNaN(lng)) {
        setViDo(String(lat));
        setKinhDo(String(lng));
        setMapPosition({ lat, lng });
      }
    }
  };

  const [anhPreview, setAnhPreview] = useState([]);
  const [tinhsLegacy, setTinhsLegacy] = useState([]);
  const [tinhsCurrent, setTinhsCurrent] = useState([]);
  const [phuongs, setPhuongs] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingPhuongs, setLoadingPhuongs] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState('');
  const [displayAddressType, setDisplayAddressType] = useState('old');
  const [suggestedMapping, setSuggestedMapping] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [diaChi, setDiaChi] = useState('');
  const [diaChiChiTiet, setDiaChiChiTiet] = useState('');
  const [syncedProvinceName, setSyncedProvinceName] = useState('');
  const [syncedDistrictName, setSyncedDistrictName] = useState('');
  const [syncedWardName, setSyncedWardName] = useState('');
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [mapPosition, setMapPosition] = useState({ lat: 10.8651, lng: 106.6438 });
  const [mapTileType, setMapTileType] = useState('streets');
  const markerRef = useRef(null);

  const tinhs = displayAddressType === 'old' ? tinhsLegacy : tinhsCurrent;

  const hasAddressData = Boolean(
    selectedProvince || selectedDistrict || selectedCommune || diaChi.trim() || diaChiChiTiet.trim()
  );

  // State cho searchable dropdowns
  const [tinhFilter, setTinhFilter] = useState('');
  const [phuongFilter, setPhuongFilter] = useState('');
  const [showTinhDropdown, setShowTinhDropdown] = useState(false);
  const [showPhuongDropdown, setShowPhuongDropdown] = useState(false);
  const [dangPrefillDiaChi, setDangPrefillDiaChi] = useState(false);
  const [pendingPhuongName, setPendingPhuongName] = useState('');
  const [choPhepChinhSuaDiaChi, setChoPhepChinhSuaDiaChi] = useState(false);
  const [diaChiGoc, setDiaChiGoc] = useState('');

  // State cho tọa độ
  const [viDo, setViDo] = useState('');
  const [kinhDo, setKinhDo] = useState('');
  const [hienModalChinhSuaToaDo, setHienModalChinhSuaToaDo] = useState(false);

  // ===== WIZARD STEP STATE =====
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stepParam = parseInt(params.get('step'), 10);
      return stepParam >= 1 && stepParam <= 10 ? stepParam : 1;
    } catch {
      return 1;
    }
  });
  const TOTAL_STEPS = 10;
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Payment states
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState('VIETQR');
  const [xacNhanDaChuyenKhoan, setXacNhanDaChuyenKhoan] = useState(false);

  // ML AI Valuation Suggestion States
  const [goiYGiaAI, setGoiYGiaAI] = useState(null);
  const [dangPredictGia, setDangPredictGia] = useState(false);

  const xuLyGoiYGiaAI = async () => {
    const dienTich = parseFloat(formData.DienTichSuDung) || parseFloat(formData.DienTichDat) || 0;
    const soPhongNgu = parseInt(formData.SoPhongNgu) || 0;
    const soPhongTam = parseInt(formData.SoPhongTam) || 0;
    const loaiBds = formData.LoaiTaiSan || 'CanHo';
    const quanHuyen = selectedDistrictName || 'Bình Thạnh';

    if (!dienTich) {
      alert("Vui lòng nhập diện tích sử dụng ở bước trước để AI định giá!");
      return;
    }

    setDangPredictGia(true);
    setGoiYGiaAI(null);

    try {
      const response = await axios.post(buildApiUrl("/api/public/tin-dang/predict-price"), {
        dien_tich: dienTich,
        so_phong_ngu: soPhongNgu,
        so_phong_tam: soPhongTam,
        quan_huyen: quanHuyen,
        loai_bds: loaiBds
      });

      if (response?.data?.success && response.data.data) {
        setGoiYGiaAI(response.data.data);
      } else {
        alert("Không nhận được kết quả gợi ý định giá hợp lệ từ AI.");
      }
    } catch (err) {
      console.error("Lỗi định giá AI:", err);
      alert("Lỗi kết nối tới hệ thống định giá AI: " + (err?.response?.data?.message || err.message));
    } finally {
      setDangPredictGia(false);
    }
  };

  // ===== ACCORDION STATE =====
  const [sectionsExpanded, setSectionsExpanded] = useState({
    duAn: true,
    thongTinCoBan: true,
    chonPhong: true, // Redesign 09/10/2025 - mở sẵn để chọn phòng
    tienIch: false, // Đưa xuống sau chọn phòng
    hinhAnh: true
  });

  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ===== WIZARD NAVIGATION HANDLERS =====
  const goToStep = (step) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Danh sách tiện ích
  const DANH_SACH_TIEN_ICH = [
    'Wifi',
    'Máy lạnh',
    'Nóng lạnh',
    'Giường',
    'Tủ lạnh',
    'Máy giặt',
    'Bếp',
    'Chỗ để xe'
  ];

  // ===== EVENT HANDLERS =====
  const xuLyThayDoiInput = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler riêng cho các trường giá tiền (tự động format)
  const xuLyThayDoiGiaTien = (fieldName) => (e) => {
    const value = e.target.value;
    const formatted = formatGiaTien(value);
    setFormData(prev => ({ ...prev, [fieldName]: formatted }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const xuLyChonTienIch = (tienIch) => {
    setFormData(prev => {
      const tienIchMoi = prev.TienIch.includes(tienIch)
        ? prev.TienIch.filter(t => t !== tienIch)
        : [...prev.TienIch, tienIch];
      return { ...prev, TienIch: tienIchMoi };
    });
  };

  const xuLyChonAnh = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isImage && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Một số file không hợp lệ (chỉ chấp nhận ảnh < 5MB)');
    }

    const previews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setAnhPreview(prev => [...prev, ...previews]);
    setFormData(prev => ({
      ...prev,
      URL: [...prev.URL, ...previews.map(p => p.url)]
    }));

    if (errors.URL) {
      setErrors(prev => ({ ...prev, URL: '' }));
    }
  };

  const xoaAnh = (index) => {
    setAnhPreview(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setFormData(prev => ({
      ...prev,
      URL: prev.URL.filter((_, i) => i !== index)
    }));
  };

  // ===== VALIDATION =====
  const validate = () => {
    const newErrors = {};

    if (!formData.TieuDe) newErrors.TieuDe = 'Vui lòng nhập tiêu đề';

    if (anhPreview.length === 0) newErrors.URL = 'Vui lòng tải lên ít nhất 1 hình ảnh';
    if (!selectedCommune) newErrors.KhuVucID = 'Vui lòng chọn địa chỉ đầy đủ';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.warn('TaoTinDang.validate() validation errors:', newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  // ===== SUBMIT =====
  const thucHienGuiTinDang = async (trangThai = 'ChoDuyet') => {
    if (loading) return;

    if (!validate()) {
      alert('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');

      // 1. Upload ảnh tin đăng chính
      let uploadedUrls = [];
      if (anhPreview.length > 0) {
        const files = anhPreview.map(p => p.file);
        uploadedUrls = await uploadAnh(files);
        uploadedUrls = uploadedUrls.map(toRelativeUploadPath).filter(Boolean);
      }

      // Compute address fields for submission
      const inferredDistrictId = selectedDistrict;

      const buildAddressString = (type) => {
        const parts = [];
        const detail = diaChiChiTiet ? diaChiChiTiet.trim() : '';
        const street = diaChi ? diaChi.trim() : '';
        if (detail) parts.push(detail + (street ? ' ' + street : ''));
        else if (street) parts.push(street);

        if (selectedWardName) parts.push(selectedWardName);
        if (type === 'old') {
          const dName = selectedDistrictName || '';
          if (dName) parts.splice(parts.length - 1, 0, dName); // insert before province
        }
        if (selectedProvinceName) parts.push(selectedProvinceName);
        return parts.filter(Boolean).join(', ');
      };

      const fullDisplayAddress = displayAddressType === 'new' ? buildAddressString('new') : buildAddressString('old');

      const tinDangData = {
        DuAnID: selectedProjectId ? parseInt(selectedProjectId, 10) : (formData.DuAnID ? parseInt(formData.DuAnID, 10) : null),
        TieuDe: formData.TieuDe,
        MoTa: formData.MoTa,
        province_id: selectedProvince ? parseInt(selectedProvince, 10) : null,
        district_id: inferredDistrictId ? (Number.isNaN(parseInt(inferredDistrictId, 10)) ? null : parseInt(inferredDistrictId, 10)) : null,
        ward_id: selectedCommune ? parseInt(selectedCommune, 10) : null,
        display_address_type: displayAddressType,
        full_display_address: fullDisplayAddress || null,
        KhuVucID: selectedCommune ? parseInt(selectedCommune, 10) : null,
        ChinhSachCocID: formData.ChinhSachCocID || 1,
        URL: uploadedUrls,
        TienIch: formData.TienIch,
        GiaDien: formData.GiaDien ? parseFloat(parseGiaTien(formData.GiaDien)) : null,
        GiaNuoc: formData.GiaNuoc ? parseFloat(parseGiaTien(formData.GiaNuoc)) : null,
        GiaDichVu: formData.GiaDichVu ? parseFloat(parseGiaTien(formData.GiaDichVu)) : null,
        MoTaGiaDichVu: formData.MoTaGiaDichVu || null,
        DiaChi: diaChi,
        ViDo: viDo ? parseFloat(viDo) : null,
        KinhDo: kinhDo ? parseFloat(kinhDo) : null,
        TrangThai: trangThai,
        LoaiGiaoDich: formData.HinhThuc,
        LoaiBDS: formData.LoaiTaiSan,
        GiaTien: formData.GiaTien ? parseFloat(parseGiaTien(formData.GiaTien)) : null,
        DienTichDat: formData.DienTichDat ? parseFloat(formData.DienTichDat) : null,
        DienTichSuDung: formData.DienTichSuDung ? parseFloat(formData.DienTichSuDung) : null,
        SoTang: formData.SoTang ? parseInt(formData.SoTang, 10) : null,
        SoPhongNgu: formData.SoPhongNgu ? parseInt(formData.SoPhongNgu, 10) : null,
        SoPhongTam: formData.SoPhongTam ? parseInt(formData.SoPhongTam, 10) : null,
        Huong: formData.Huong || null,
        PhapLy: formData.PhapLy || null,
        NamXayDung: formData.NamXayDung ? parseInt(formData.NamXayDung, 10) : null,
        NoiThat: formData.NoiThat || null,
        CapNhatDiaChiDuAn: choPhepChinhSuaDiaChi,
        GoiTin: formData.GoiDangTin || 'basic',
        KenhThanhToan: formData.GoiDangTin === 'basic' ? 'MIEN_PHI' : phuongThucThanhToan,
        TrangThaiThanhToan: 'DaThanhToan'
      };

      console.log('📤 Dữ liệu gửi lên backend:', JSON.stringify(tinDangData, null, 2));

      const response = await TinDangService.tao(tinDangData);

      if (response.success) {
        setSubmitSuccess(true);
        setCurrentStep(10); // Chuyển sang Step 10 khi thành công
      } else {
        setSubmitError(response.message || 'Không thể tạo tin đăng');
      }
    } catch (err) {
      console.error('Lỗi khi tạo tin đăng:', err);
      setSubmitError(err.message || 'Lỗi không xác định khi tạo tin đăng');
    } finally {
      setLoading(false);
    }
  };

  const xuLyGuiForm = async (e) => {
    e.preventDefault();
    await thucHienGuiTinDang('ChoDuyet');
  };

  const xuLyLuuNhap = async () => {
    await thucHienGuiTinDang('Nhap');
  };

  const uploadAnh = async (files) => {
    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('anh', file));
    const response = await fetch(buildApiUrl('/api/chu-du-an/upload-anh'), {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeaderValue()
      },
      body: formDataUpload
    });
    const data = await response.json();
    if (data.success) {
      return data.urls;
    }
    throw new Error(data.message);
  };

  // ===== LIFECYCLE =====
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const [legacyRes, currentRes] = await Promise.all([
          axios.get(buildApiUrl('/api/address/provinces/legacy')),
          axios.get(buildApiUrl('/api/address/provinces/current'))
        ]);
        const legacyNormalized = normalizeAddressData(legacyRes?.data, 'provinces');
        const currentNormalized = normalizeAddressData(currentRes?.data, 'provinces');
        setTinhsLegacy(Array.isArray(legacyNormalized) ? legacyNormalized : []);
        setTinhsCurrent(Array.isArray(currentNormalized) ? currentNormalized : []);
      } catch (err) {
        console.error('Lỗi load tỉnh/thành phố:', err);
        setTinhsLegacy([]);
        setTinhsCurrent([]);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    let isActive = true;
    setSelectedDistrict('');
    setDistricts([]);
    setSelectedCommune('');
    setPhuongs([]);

    if (!selectedProvince) {
      setLoadingDistricts(false);
      setLoadingPhuongs(false);
      return () => { isActive = false; };
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const response = await axios.get(buildApiUrl(`/api/address/districts/${encodeURIComponent(selectedProvince)}`));
        const normalized = normalizeAddressData(response?.data, 'districts');
        if (isActive) setDistricts(Array.isArray(normalized) ? normalized : []);
      } catch (err) {
        console.error('Lỗi load quận/huyện:', err);
        if (isActive) setDistricts([]);
      } finally {
        if (isActive) setLoadingDistricts(false);
      }
    };

    loadDistricts();
    return () => { isActive = false; };
  }, [selectedProvince]);

  // When selectedDistrict changes load wards under that district
  useEffect(() => {
    let isActive = true;
    setSelectedCommune('');
    setPhuongs([]);

    if (!selectedDistrict) {
      setLoadingPhuongs(false);
      return () => { isActive = false; };
    }

    const loadCommunes = async () => {
      setLoadingPhuongs(true);
      try {
        const response = await axios.get(buildApiUrl(`/api/address/wards/${encodeURIComponent(selectedDistrict)}`));
        const normalized = normalizeAddressData(response?.data, 'wards');
        if (isActive) setPhuongs(Array.isArray(normalized) ? normalized : []);
      } catch (err) {
        console.error('Lỗi load phường/xã:', err);
        if (isActive) setPhuongs([]);
      } finally {
        if (isActive) setLoadingPhuongs(false);
      }
    };

    loadCommunes();

    return () => { isActive = false; };
  }, [selectedDistrict]);

  useEffect(() => {
    const tinhDaChon = tinhs.find((t) => String(t.KhuVucID) === String(selectedProvince));

    if (selectedProvince && tinhDaChon) {
      setTinhFilter(tinhDaChon.TenKhuVuc || '');
      return;
    }

    if (!selectedProvince) {
      setTinhFilter('');
    }
  }, [selectedProvince, tinhs]);

  useEffect(() => {
    const phuongDaChon = phuongs.find((p) => String(p.KhuVucID) === String(selectedCommune));

    if (selectedCommune && phuongDaChon) {
      setPhuongFilter(phuongDaChon.TenKhuVuc || '');
      setSelectedCommuneCode(phuongDaChon.MaKhuVuc || '');
      return;
    }

    if (!selectedCommune) {
      setPhuongFilter('');
      setSelectedCommuneCode('');
    }
  }, [selectedCommune, phuongs]);

  // Update KhuVucID
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      KhuVucID: selectedCommune || ''
    }));
  }, [selectedCommune]);

  // Auto-select phường/xã theo địa chỉ
  useEffect(() => {
    if (!dangPrefillDiaChi || !pendingPhuongName || phuongs.length === 0) {
      return;
    }

    const phuongMatch = timKhuVucTheoTen(phuongs, pendingPhuongName, 'phuong');
    if (phuongMatch) {
      setSelectedCommune(String(phuongMatch.KhuVucID));
    }
    setPendingPhuongName('');
    setDangPrefillDiaChi(false);
  }, [dangPrefillDiaChi, pendingPhuongName, phuongs]);



  const xuLyChonTinh = (value) => {
    setSelectedProvince(value);
    setSelectedCommune('');
    setSelectedCommuneCode('');
    setPhuongs([]);
    // Clear district when province changes
    setSelectedDistrict('');
    setDistricts([]);
    setPhuongFilter('');
    setDistrictFilter('');
    setShowTinhDropdown(false);
    setShowDistrictDropdown(false);
    setShowPhuongDropdown(false);
    if (!dangPrefillDiaChi) setPendingPhuongName('');
    if (!value) {
      setDangPrefillDiaChi(false);
    }
  };

  const xuLyChonPhuong = (value, communeCode = '') => {
    setSelectedCommune(value);
    setSelectedCommuneCode(communeCode);
    if (errors.KhuVucID) {
      setErrors(prev => ({ ...prev, KhuVucID: '' }));
    }
  };

  const setPositionFromMarker = (newPosition) => {
    setMapPosition(newPosition);
    setViDo(String(newPosition.lat));
    setKinhDo(String(newPosition.lng));
  };

  const batChinhSuaDiaChi = () => {
    setChoPhepChinhSuaDiaChi(true);
  };

  const huyChinhSuaDiaChi = () => {
    setChoPhepChinhSuaDiaChi(false);
    if (diaChiGoc) {
      const { chiTiet, phuong, tinh } = tachDiaChiDuAn(diaChiGoc);
      setDiaChi(chiTiet || '');
      setDangPrefillDiaChi(true);
      setPendingPhuongName(phuong || '');

      const tinhMatch = timKhuVucTheoTen(tinhs, tinh, 'tinh');
      if (tinhMatch) {
        setSelectedProvince(String(tinhMatch.KhuVucID));
      }
    }
  };

  const tenTinhDangChon = tinhs.find((t) => String(t.KhuVucID) === String(selectedProvince))?.TenKhuVuc || '';
  const selectedProvinceObj = tinhs.find((t) => String(t.KhuVucID) === String(selectedProvince));
  const selectedDistrictObj = districts.find((d) => String(d.KhuVucID) === String(selectedDistrict));
  const selectedWardObj = phuongs.find((p) => String(p.KhuVucID) === String(selectedCommune));
  const selectedWardName = syncedWardName || (selectedWardObj?.TenKhuVuc || '');
  const selectedDistrictName = syncedDistrictName || (selectedDistrictObj?.TenKhuVuc || '');
  const selectedProvinceName = syncedProvinceName || (selectedProvinceObj?.TenKhuVuc || '');

  useEffect(() => {
    let isMounted = true;
    const wardCode = selectedWardObj?.MaKhuVuc || selectedWardObj?.code || '';
    const fromVersion = 'PRE_2025';

    if (!wardCode) {
      setSuggestedMapping(null);
      return () => { isMounted = false; };
    }

    const loadSuggestedMapping = async () => {
      const result = await fetchSuggestedMapping(wardCode, fromVersion);
      if (isMounted) {
        setSuggestedMapping(result);
      }
    };

    loadSuggestedMapping();
    return () => { isMounted = false; };
  }, [selectedWardObj]);

  const handleAddressSyncConfirm = (payload) => {
    if (!payload) return;

    const nextProvinceId = payload?.currentAddress?.provinceId ?? null;
    const nextWardId = payload?.currentAddress?.wardId ?? null;
    const nextStreetName = payload?.currentAddress?.streetName ?? '';
    const nextDetailAddress = payload?.currentAddress?.detailAddress ?? '';
    const nextLegacyDistrictId = payload?.legacyAddressRef?.legacyDistrictId ?? null;
    const selectedDisplayPreference = payload?.displayPreference || 'current';
    const nextProvinceName = payload?.currentAddress?.provinceName ?? '';
    const nextDistrictName = payload?.currentAddress?.districtName ?? '';
    const nextWardName = payload?.currentAddress?.wardName ?? '';

    if (nextProvinceId !== null && nextProvinceId !== undefined) {
      setSelectedProvince(String(nextProvinceId));
    }

    if (selectedDisplayPreference === 'legacy') {
      if (nextLegacyDistrictId !== null && nextLegacyDistrictId !== undefined) {
        setSelectedDistrict(String(nextLegacyDistrictId));
      }
      setSelectedCommuneCode('');
    } else {
      setSelectedDistrict('');
      setSelectedCommuneCode('');
    }

    if (nextWardId !== null && nextWardId !== undefined) {
      setSelectedCommune(String(nextWardId));
    }

    if (nextStreetName) {
      setDiaChi(nextStreetName);
    }

    if (nextDetailAddress) {
      setDiaChiChiTiet(nextDetailAddress);
    }

    if (nextProvinceName) {
      setSyncedProvinceName(nextProvinceName);
    }

    if (nextDistrictName) {
      setSyncedDistrictName(nextDistrictName);
    }

    if (nextWardName) {
      setSyncedWardName(nextWardName);
    }

    if (selectedDisplayPreference === 'legacy') {
      setDisplayAddressType('old');
    } else {
      setDisplayAddressType('new');
    }
  };

  const geocodeQuery = useMemo(() => {
    if (!selectedWardName || !selectedProvinceName) return '';
    const parts = [];
    if (diaChiChiTiet.trim()) parts.push(diaChiChiTiet.trim());
    if (diaChi.trim()) parts.push(diaChi.trim());
    if (selectedWardName) parts.push(selectedWardName);
    if (selectedDistrictName) parts.push(selectedDistrictName);
    if (selectedProvinceName) parts.push(selectedProvinceName);
    return `${parts.join(', ')}, Vietnam`;
  }, [diaChiChiTiet, diaChi, selectedWardName, selectedDistrictName, selectedProvinceName]);

  useEffect(() => {
    let isActive = true;
    if (!geocodeQuery) {
      setGeocodeResult(null);
      setGeocodeError('');
      return () => { isActive = false; };
    }

    const fetchGeocode = async () => {
      setGeocoding(true);
      setGeocodeError('');

      try {
        // Try backend geocode endpoint first
        let latNum = null;
        let lngNum = null;
        let displayName = '';

        try {
          const response = await axios.post(
            buildApiUrl('/api/geocode'),
            { address: geocodeQuery },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthHeaderValue()
              },
              timeout: 4000
            }
          );
          if (response?.data?.success && response.data.data) {
            latNum = parseFloat(response.data.data.lat);
            lngNum = parseFloat(response.data.data.lng);
            displayName = response.data.data.displayName || '';
          }
        } catch (apiErr) {
          console.warn('[TaoTinDang] Backend geocode endpoint failed, using direct Nominatim API fallback');
        }

        // Direct Esri ArcGIS API fallback if backend geocode failed (Fast, No DNS block in Vietnam)
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
          try {
            const esriRes = await axios.get(
              `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(geocodeQuery)}&maxLocations=1`,
              { timeout: 4000 }
            );
            const candidates = esriRes?.data?.candidates;
            if (Array.isArray(candidates) && candidates.length > 0 && candidates[0].location) {
              latNum = parseFloat(candidates[0].location.y);
              lngNum = parseFloat(candidates[0].location.x);
              displayName = candidates[0].address || geocodeQuery;
            }
          } catch (esriErr) {
            console.warn('[TaoTinDang] Esri geocode failed:', esriErr.message);
          }
        }

        // Direct Nominatim API fallback
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
          try {
            const nomRes = await axios.get(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geocodeQuery)}&limit=1`,
              { headers: { 'Accept-Language': 'vi' }, timeout: 4000 }
            );
            if (Array.isArray(nomRes?.data) && nomRes.data.length > 0) {
              latNum = parseFloat(nomRes.data[0].lat);
              lngNum = parseFloat(nomRes.data[0].lon);
              displayName = nomRes.data[0].display_name;
            }
          } catch (nomErr) {
            console.warn('[TaoTinDang] Nominatim client fallback failed:', nomErr.message);
          }
        }

        if (!isActive) return;

        if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
          if (selectedProject?.ViDo && selectedProject?.KinhDo) {
            const pLat = parseFloat(selectedProject.ViDo);
            const pLng = parseFloat(selectedProject.KinhDo);
            if (!isNaN(pLat) && !isNaN(pLng)) {
              setMapPosition({ lat: pLat, lng: pLng });
              setViDo(String(pLat));
              setKinhDo(String(pLng));
              setGeocodeResult({ lat: pLat, lng: pLng, displayName: selectedProject.TenDuAn });
              setGeocodeError('');
              return;
            }
          }
          const nextPosition = { lat: latNum, lng: lngNum };
          setMapPosition(nextPosition);
          setViDo(String(latNum));
          setKinhDo(String(lngNum));
          setGeocodeResult({ lat: latNum, lng: lngNum, displayName });
          setGeocodeError('');
        }
      } catch (error) {
        if (!isActive) return;
        console.error('[TaoTinDang] Geocode error:', error);
      } finally {
        if (isActive) setGeocoding(false);
      }
    };

    const timer = setTimeout(fetchGeocode, 600);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [geocodeQuery, selectedWardName, selectedDistrictName, selectedProvinceName]);

  useEffect(() => {
    const latNum = parseFloat(viDo);
    const lngNum = parseFloat(kinhDo);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      setMapPosition({ lat: latNum, lng: lngNum });
    }
  }, [viDo, kinhDo]);

  const mappedWardName = suggestedMapping?.new_ward_name || suggestedMapping?.old_ward_name || selectedWardName;
  const mappedDistrictName = suggestedMapping?.new_district_name || suggestedMapping?.old_district_name || selectedDistrictName;

  const fullDetailStreet = [diaChiChiTiet.trim(), diaChi.trim()].filter(Boolean).join(', ');

  const formattedAddressOld = (fullDetailStreet || selectedWardName) && selectedProvinceName
    ? `${fullDetailStreet ? fullDetailStreet + ' ' : ''}${selectedWardName}${selectedDistrictName ? `, ${selectedDistrictName}` : ''}, ${selectedProvinceName}`
    : '';
  const formattedAddressNew = (fullDetailStreet || mappedWardName) && selectedProvinceName
    ? `${fullDetailStreet ? fullDetailStreet + ' ' : ''}${mappedWardName}${mappedDistrictName ? `, ${mappedDistrictName}` : ''}, ${selectedProvinceName}`
    : '';
  const danhSachTinhLoc = locKhuVucTheoTuKhoa(tinhs, tinhFilter);
  const tenPhuongDangChon = selectedWardName;
  const danhSachPhuongLoc = locKhuVucTheoTuKhoa(phuongs, phuongFilter);

  // ===== RENDER =====
  const renderSectionHeader = (title, sectionKey, required = false, subtitle = null) => (
    <div
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        background: sectionsExpanded[sectionKey] ? '#f9fafb' : 'white',
        borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
          {required && <span style={{ color: '#dc2626' }}>*</span>}
        </h3>
        {subtitle && <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      <span style={{ fontSize: '1.25rem', transition: 'transform 0.2s', transform: sectionsExpanded[sectionKey] ? 'rotate(180deg)' : 'rotate(0)' }}>
        ▼
      </span>
    </div>
  );

  return (
    <ChuDuAnLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>
            Tạo tin đăng mới
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Điền thông tin để tạo tin đăng bất động sản
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/chu-du-an/tin-dang')}
          className="cda-btn cda-btn-secondary"
        >
          ← Quay lại
        </button>
      </div>

      {/* Step Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            onClick={() => goToStep(step)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              flex: 1
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: step === currentStep ? '#059669' : step < currentStep ? '#10b981' : '#e5e7eb',
              color: step <= currentStep ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.25rem'
            }}>
              {step < currentStep ? '✓' : step}
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: step === currentStep ? '#059669' : '#6b7280',
              fontWeight: step === currentStep ? 600 : 400
            }}>
              {step === 1 && 'Nhu cầu'}
              {step === 2 && 'Loại BĐS'}
              {step === 3 && 'Vị trí'}
              {step === 4 && 'Thông tin'}
              {step === 5 && 'Tiêu đề'}
              {step === 6 && 'Hình ảnh'}
              {step === 7 && 'Liên hệ'}
              {step === 8 && 'Gói tin'}
              {step === 9 && 'Thanh toán'}
              {step === 10 && 'Hoàn tất'}
            </span>
          </div>
        ))}
      </div>

      {/* Form với Accordion Sections */}
      <form onSubmit={xuLyGuiForm}>


        {/* STEP 1: Nhu cầu (Bán/Cho thuê) */}
        {currentStep === 1 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Bạn muốn đăng tin để <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Option: Bán */}
                <div
                  onClick={() => {
                    xuLyThayDoiInput({ target: { name: 'HinhThuc', value: 'Ban' } });
                    goToNextStep();
                  }}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${formData.HinhThuc === 'Ban' ? '#059669' : '#e5e7eb'}`,
                    backgroundColor: formData.HinhThuc === 'Ban' ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s',
                    boxShadow: formData.HinhThuc === 'Ban' ? '0 4px 6px -1px rgba(5, 150, 105, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    fontSize: '1.75rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    backgroundColor: formData.HinhThuc === 'Ban' ? '#dcfce7' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    🏷️
                  </div>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: formData.HinhThuc === 'Ban' ? '#166534' : '#374151' }}>
                      Bán
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Đăng tin bán nhà, căn hộ, đất nền hoặc shophouse
                    </div>
                  </div>
                </div>

                {/* Option: Cho thuê */}
                <div
                  onClick={() => {
                    xuLyThayDoiInput({ target: { name: 'HinhThuc', value: 'Thue' } });
                    goToNextStep();
                  }}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${formData.HinhThuc === 'Thue' ? '#059669' : '#e5e7eb'}`,
                    backgroundColor: formData.HinhThuc === 'Thue' ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s',
                    boxShadow: formData.HinhThuc === 'Thue' ? '0 4px 6px -1px rgba(5, 150, 105, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    fontSize: '1.75rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    backgroundColor: formData.HinhThuc === 'Thue' ? '#dcfce7' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    🔑
                  </div>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: formData.HinhThuc === 'Thue' ? '#166534' : '#374151' }}>
                      Cho thuê
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Đăng tin cho thuê bất động sản, căn hộ, nhà phố hoặc văn phòng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Loại BĐS */}
        {currentStep === 2 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Chọn loại bất động sản <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div className="cda-form-group">
                <label className="cda-label cda-label-required">Loại BĐS</label>
                <select
                  name="LoaiTaiSan"
                  value={formData.LoaiTaiSan}
                  onChange={xuLyThayDoiInput}
                  className="cda-select"
                  disabled={loading}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">-- Chọn loại BĐS --</option>
                  {LOAI_BDS_GROUPS[formData.HinhThuc]?.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon ? `${option.icon} ${option.label}` : option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {errors.LoaiTaiSan && <p className="cda-error-message" style={{ marginTop: '0.5rem' }}>{errors.LoaiTaiSan}</p>}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={!formData.LoaiTaiSan}
                  style={{ opacity: !formData.LoaiTaiSan ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Vị trí (Tỉnh/Quận/Phường/Đường) */}
        {currentStep === 3 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>

              {/* Header & Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Nhập vị trí bất động sản <span style={{ color: '#dc2626' }}>*</span>
                </h3>
              </div>
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <AddressSyncBlock
                  streetName={diaChi}
                  onStreetChange={(val) => setDiaChi(val)}
                  detailAddress={diaChiChiTiet}
                  onDetailAddressChange={(val) => setDiaChiChiTiet(val)}
                  onConfirm={handleAddressSyncConfirm}
                  onModeSwitch={() => setDiaChiChiTiet('')}
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onProjectChange={handleProjectChange}
                />
              </div>

              {/* Bản đồ vị trí - Chuẩn Batdongsan Image 4 */}
              <div className="cda-form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label className="cda-label" style={{ margin: 0 }}>Chọn vị trí trên bản đồ</label>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Kéo bản đồ để đổi vị trí ghim</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                      <button
                        type="button"
                        onClick={() => setMapTileType('streets')}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: mapTileType === 'streets' ? '#ffffff' : 'transparent',
                          color: mapTileType === 'streets' ? '#2563eb' : '#64748b',
                          boxShadow: mapTileType === 'streets' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        🗺️ Đường phố (Esri)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapTileType('satellite')}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: mapTileType === 'satellite' ? '#ffffff' : 'transparent',
                          color: mapTileType === 'satellite' ? '#2563eb' : '#64748b',
                          boxShadow: mapTileType === 'satellite' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        🛰️ Vệ tinh
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapTileType('osm')}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: mapTileType === 'osm' ? '#ffffff' : 'transparent',
                          color: mapTileType === 'osm' ? '#2563eb' : '#64748b',
                          boxShadow: mapTileType === 'osm' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        🌐 OSM
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapPosition({ lat: 10.8651, lng: 106.6438 })}
                      style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>
                <div style={{
                  height: '19rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '0.75rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f1f5f9'
                }}>
                  <MapContainer
                    center={[mapPosition?.lat || 10.8651, mapPosition?.lng || 106.6438]}
                    zoom={14}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapAutoCenter position={mapPosition || { lat: 10.8651, lng: 106.6438 }} />
                    {mapTileType === 'streets' && (
                      <TileLayer
                        attribution='&copy; <a href="https://www.esri.com">Esri</a> World Street Map'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={19}
                      />
                    )}
                    {mapTileType === 'satellite' && (
                      <TileLayer
                        attribution='&copy; <a href="https://www.esri.com">Esri</a> World Imagery'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={19}
                      />
                    )}
                    {mapTileType === 'osm' && (
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                        subdomains="abc"
                        maxZoom={19}
                      />
                    )}
                    <Marker
                      position={[mapPosition?.lat || 10.8651, mapPosition?.lng || 106.6438]}
                      draggable={true}
                      eventHandlers={{
                        dragend() {
                          const marker = markerRef.current;
                          if (marker != null) {
                            const newPos = marker.getLatLng();
                            setPositionFromMarker({ lat: newPos.lat, lng: newPos.lng });
                          }
                        }
                      }}
                      ref={markerRef}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong>{selectedProject ? selectedProject.TenDuAn : 'Vị trí bất động sản'}</strong><br />
                          {selectedProject && (
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                              🏢 Dự án đã liên kết<br />
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {(mapPosition?.lat || 10.8651).toFixed(6)}, {(mapPosition?.lng || 106.6438).toFixed(6)}
                          </span>
                          <hr style={{ margin: '0.5rem 0' }} />
                          <span style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                            🔄 Kéo thả marker để di chuyển vị trí
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#0284c7', fontWeight: '600' }}>📍 Vị trí ghim trên bản đồ:</span>
                    <strong>{(mapPosition?.lat || 10.8651).toFixed(6)}, {(mapPosition?.lng || 106.6438).toFixed(6)}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Kéo bản đồ để di chuyển vị trí ghim</span>
                </div>
              </div>

              {/* Buttons điều hướng: Căn phải */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '1.5rem'
              }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Thông tin chi tiết */}
        {currentStep === 4 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Thông tin chi tiết bất động sản <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="cda-form-group">
                  <label className="cda-label cda-label-required">Diện tích đất (m²)</label>
                  <input
                    type="number"
                    name="DienTichDat"
                    value={formData.DienTichDat}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 50"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Diện tích sử dụng (m²)</label>
                  <input
                    type="number"
                    name="DienTichSuDung"
                    value={formData.DienTichSuDung}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 45"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label cda-label-required">Giá tiền</label>
                  <input
                    type="text"
                    name="GiaTien"
                    value={formData.GiaTien}
                    onChange={xuLyThayDoiGiaTien('GiaTien')}
                    className="cda-input"
                    placeholder="VD: 2.500.000"
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={xuLyGoiYGiaAI}
                      disabled={dangPredictGia}
                      className="cda-btn-ai-suggest"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 5px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      {dangPredictGia ? 'Đang định giá...' : '🤖 Gợi ý định giá AI'}
                    </button>
                    {goiYGiaAI && (
                      <div
                        style={{
                          marginTop: '10px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#166534'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          AI dự kiến: {goiYGiaAI.predicted_price >= 1000 ? `${(goiYGiaAI.predicted_price / 1000).toFixed(2)} Tỷ VND` : `${goiYGiaAI.predicted_price} Triệu VND`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '8px' }}>
                          Khoảng đề xuất: {goiYGiaAI.price_range_min >= 1000 ? `${(goiYGiaAI.price_range_min / 1000).toFixed(2)} Tỷ` : `${goiYGiaAI.price_range_min} Tr`} - {goiYGiaAI.price_range_max >= 1000 ? `${(goiYGiaAI.price_range_max / 1000).toFixed(2)} Tỷ` : `${goiYGiaAI.price_range_max} Tr`}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const totalVnd = goiYGiaAI.predicted_price * 1000000;
                            let targetValue = "";
                            if (formData.DonViGia === 'tong') {
                              targetValue = formatGiaTien(totalVnd.toString());
                            } else if (formData.DonViGia === 'm2') {
                              const area = parseFloat(formData.DienTichSuDung) || 1;
                              const perM2 = Math.round(totalVnd / area);
                              targetValue = formatGiaTien(perM2.toString());
                            } else {
                              const monthlyRent = Math.round(totalVnd / 120);
                              targetValue = formatGiaTien(monthlyRent.toString());
                            }
                            setFormData(prev => ({
                              ...prev,
                              GiaTien: targetValue
                            }));
                          }}
                          style={{
                            background: '#166534',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          Áp dụng mức giá này
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Đơn vị giá</label>
                  <select
                    name="DonViGia"
                    value={formData.DonViGia}
                    onChange={xuLyThayDoiInput}
                    className="cda-select"
                  >
                    <option value="m2">Triệu/m²</option>
                    <option value="thang">Triệu/tháng</option>
                    <option value="nam">Triệu/năm</option>
                    <option value="tong">Tổng tiền</option>
                  </select>
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Số tầng</label>
                  <input
                    type="number"
                    name="SoTang"
                    value={formData.SoTang}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 3"
                    min="1"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Tầng</label>
                  <input
                    type="number"
                    name="Tang"
                    value={formData.Tang}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 2"
                    min="1"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Phòng ngủ</label>
                  <input
                    type="number"
                    name="SoPhongNgu"
                    value={formData.SoPhongNgu}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 2"
                    min="0"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Phòng tắm</label>
                  <input
                    type="number"
                    name="SoPhongTam"
                    value={formData.SoPhongTam}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 1"
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="cda-form-group">
                  <label className="cda-label">Hướng</label>
                  <select
                    name="Huong"
                    value={formData.Huong}
                    onChange={xuLyThayDoiInput}
                    className="cda-select"
                  >
                    <option value="">-- Chọn hướng --</option>
                    {HUONG_OPTIONS.map(huong => (
                      <option key={huong} value={huong}>{huong}</option>
                    ))}
                  </select>
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Pháp lý</label>
                  <select
                    name="PhapLy"
                    value={formData.PhapLy}
                    onChange={xuLyThayDoiInput}
                    className="cda-select"
                  >
                    <option value="">-- Chọn pháp lý --</option>
                    {PHAP_LY_OPTIONS.map(phapLy => (
                      <option key={phapLy} value={phapLy}>{phapLy}</option>
                    ))}
                  </select>
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Năm xây dựng</label>
                  <input
                    type="number"
                    name="NamXayDung"
                    value={formData.NamXayDung}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="cda-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="cda-label">Nội thất</label>
                <textarea
                  name="NoiThat"
                  value={formData.NoiThat}
                  onChange={xuLyThayDoiInput}
                  className="cda-textarea"
                  placeholder="Mô tả nội thất: Đầy đủ, cơ bản, chưa có nội thất..."
                  rows="3"
                />
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={!formData.DienTichDat}
                  style={{ opacity: !formData.DienTichDat ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Tiêu đề & Mô tả */}
        {currentStep === 5 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Tiêu đề và mô tả tin đăng <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div className="cda-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="cda-label cda-label-required">Tiêu đề tin đăng</label>
                <input
                  type="text"
                  name="TieuDe"
                  value={formData.TieuDe}
                  onChange={xuLyThayDoiInput}
                  className={`cda-input ${errors.TieuDe ? 'cda-input-error' : ''}`}
                  placeholder="VD: Căn hộ 2PN full nội thất, view đẹp, giá tốt"
                  disabled={loading}
                />
                <p className="cda-help-text">
                  Tiêu đề ngắn gọn, hấp dẫn giúp tin đăng của bạn được nhiều người xem hơn
                </p>
                {selectedProject && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const loaiText = formData.LoaiTaiSan ? (LOAI_BDS_GROUPS[formData.LoaiTaiSan] || formData.LoaiTaiSan) : 'BĐS';
                        const streetPart = diaChiChiTiet || diaChi || '';
                        const suggested = `${loaiText} tại ${selectedProject.TenDuAn}${streetPart ? ` - ${streetPart}` : ''}`;
                        setFormData(prev => ({ ...prev, TieuDe: suggested }));
                        if (errors.TieuDe) setErrors(prev => ({ ...prev, TieuDe: '' }));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      ✨ Gợi ý tiêu đề theo dự án: "{selectedProject.TenDuAn}"
                    </button>
                  </div>
                )}
              </div>

              <div className="cda-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="cda-label cda-label-required">Mô tả chi tiết</label>
                <textarea
                  name="MoTa"
                  value={formData.MoTa}
                  onChange={xuLyThayDoiInput}
                  className="cda-textarea"
                  placeholder="Mô tả chi tiết về bất động sản: vị trí, tiện ích xung quanh, tình trạng nội thất, quy định..."
                  rows="6"
                  disabled={loading}
                />
                {errors.MoTa && <p className="cda-error-message">{errors.MoTa}</p>}
                <p className="cda-help-text">
                  Cung cấp thông tin chi tiết giúp khách hàng hiểu rõ hơn về bất động sản
                </p>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={!formData.TieuDe || !formData.MoTa}
                  style={{ opacity: (!formData.TieuDe || !formData.MoTa) ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Hình ảnh */}
        {currentStep === 6 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Hình ảnh bất động sản <span style={{ color: '#dc2626' }}>*</span>
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                Đăng ít nhất 3 hình ảnh để tin đăng hấp dẫn hơn
              </p>

              {/* Upload area */}
              <div style={{
                border: '2px dashed #059669',
                borderRadius: '0.75rem',
                backgroundColor: '#f0fdf4',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                transition: 'all 0.2s'
              }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={xuLyChonAnh}
                  style={{ display: 'none' }}
                />
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem'
                }}>
                  📷
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Kéo thả hình ảnh vào đây hoặc nhấn để chọn
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Hỗ trợ: JPG, PNG, GIF (Tối đa 5MB/file)
                </div>
              </div>

              {errors.URL && <p className="cda-error-message">{errors.URL}</p>}

              {/* Preview grid */}
              {anhPreview.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {anhPreview.map((preview, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      border: index === 0 ? '2px solid #059669' : '1px solid #e2e8f0',
                      aspectRatio: '4/3',
                      backgroundColor: '#f8fafc'
                    }}>
                      <img
                        src={preview.url}
                        alt={preview.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {index === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: '#059669',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}>
                          Ảnh chính
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => xoaAnh(index)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={anhPreview.length < 3}
                  style={{ opacity: anhPreview.length < 3 ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Thông tin liên hệ */}
        {currentStep === 7 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Thông tin liên hệ <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="cda-form-group">
                  <label className="cda-label cda-label-required">Tên liên hệ</label>
                  <input
                    type="text"
                    name="TenLienHe"
                    value={formData.TenLienHe}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label cda-label-required">Số điện thoại</label>
                  <input
                    type="tel"
                    name="SoDienThoai"
                    value={formData.SoDienThoai}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: 0912345678"
                  />
                </div>

                <div className="cda-form-group">
                  <label className="cda-label">Email</label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={xuLyThayDoiInput}
                    className="cda-input"
                    placeholder="VD: email@example.com"
                  />
                </div>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={!formData.TenLienHe || !formData.SoDienThoai}
                  style={{ opacity: (!formData.TenLienHe || !formData.SoDienThoai) ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Gói đăng tin */}
        {currentStep === 8 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Chọn gói đăng tin <span style={{ color: '#dc2626' }}>*</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Package options */}
                {[
                  { id: 'basic', name: 'Gói Cơ Bản', price: 0, features: ['Đăng tin 7 ngày', 'Hiển thị thường'] },
                  { id: 'standard', name: 'Gói Tiêu Chuẩn', price: 50000, features: ['Đăng tin 30 ngày', 'Hiển thị ưu tiên', 'Đẩy tin 3 lần'] },
                  { id: 'premium', name: 'Gói VIP', price: 150000, features: ['Đăng tin 60 ngày', 'Hiển thị trang chủ', 'Đẩy tin 10 lần', 'Badge VIP'] }
                ].map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => xuLyThayDoiInput({ target: { name: 'GoiDangTin', value: pkg.id } })}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: `2px solid ${formData.GoiDangTin === pkg.id ? '#059669' : '#e5e7eb'}`,
                      backgroundColor: formData.GoiDangTin === pkg.id ? '#f0fdf4' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669', marginBottom: '0.75rem' }}>
                      {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString('vi-VN')} ₫`}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
                      {pkg.features.map((feature, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="cda-btn cda-btn-primary"
                  disabled={!formData.GoiDangTin}
                  style={{ opacity: !formData.GoiDangTin ? 0.5 : 1 }}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: Thanh toán */}
        {currentStep === 9 && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                Xác nhận & Thanh toán gói đăng tin
              </h3>

              {/* Tóm tắt gói tin */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Gói đăng tin chọn:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {formData.GoiDangTin === 'basic' && 'Gói Cơ Bản (Hiển thị 7 ngày)'}
                    {formData.GoiDangTin === 'standard' && 'Gói Tiêu Chuẩn (Hiển thị 30 ngày + Đẩy tin)'}
                    {formData.GoiDangTin === 'premium' && 'Gói VIP (Hiển thị 60 ngày + Trang chủ + Badge VIP)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Tổng tiền thanh toán:</span>
                  <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.25rem' }}>
                    {formData.GoiDangTin === 'basic' && '0 ₫ (Miễn phí)'}
                    {formData.GoiDangTin === 'standard' && '50.000 ₫'}
                    {formData.GoiDangTin === 'premium' && '150.000 ₫'}
                  </span>
                </div>
              </div>

              {/* Nếu gói trả phí (Standard / Premium) -> Hiện phương thức thanh toán & Mã QR */}
              {formData.GoiDangTin !== 'basic' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                    1. Chọn phương thức thanh toán
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                      { id: 'VIETQR', title: '📱 Mã QR VietQR', desc: 'Chuyển khoản ngân hàng tự động' },
                      { id: 'MOMO', title: '👛 Ví điện tử MoMo', desc: 'Thanh toán qua app MoMo' },
                      { id: 'ATM', title: '💳 Thẻ ATM / VNPAY', desc: 'Cổng thanh toán VNPAY' }
                    ].map(method => (
                      <div
                        key={method.id}
                        onClick={() => setPhuongThucThanhToan(method.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: `2px solid ${phuongThucThanhToan === method.id ? '#059669' : '#e2e8f0'}`,
                          backgroundColor: phuongThucThanhToan === method.id ? '#f0fdf4' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{method.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{method.desc}</div>
                      </div>
                    ))}
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                    2. Thực hiện thanh toán
                  </h4>

                  {phuongThucThanhToan === 'VIETQR' && (
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      border: '2px dashed #10b981',
                      borderRadius: '0.75rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '1.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={`https://qr.sepay.vn/img?acc=80349195777&bank=TPBank&amount=${formData.GoiDangTin === 'standard' ? 50000 : 150000}&des=TINDANG_${(formData.GoiDangTin || 'STANDARD').toUpperCase()}`}
                          alt="Mã QR Thanh Toán VietQR"
                          style={{ width: '210px', height: '210px', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem' }}>
                          📲 Quét mã bằng App Ngân hàng bất kỳ
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                          <span style={{ color: '#64748b' }}>Ngân hàng: </span>
                          <strong style={{ color: '#0f172a' }}>TPBank (Ngân hàng TMCP Tiên Phong)</strong>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                          <span style={{ color: '#64748b' }}>Số tài khoản: </span>
                          <strong style={{ color: '#059669', fontSize: '1.05rem' }}>80349195777</strong>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                          <span style={{ color: '#64748b' }}>Tên tài khoản: </span>
                          <strong style={{ color: '#0f172a' }}>HOMMY REAL ESTATE</strong>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                          <span style={{ color: '#64748b' }}>Số tiền: </span>
                          <strong style={{ color: '#dc2626', fontSize: '1.05rem' }}>
                            {formData.GoiDangTin === 'standard' ? '50.000 ₫' : '150.000 ₫'}
                          </strong>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem', border: '1px solid #fde68a' }}>
                          <span style={{ color: '#92400e' }}>Nội dung chuyển khoản: </span>
                          <strong style={{ color: '#b45309' }}>
                            TINDANG {(formData.GoiDangTin || 'STANDARD').toUpperCase()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {phuongThucThanhToan === 'MOMO' && (
                    <div style={{ padding: '1.25rem', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#be185d', marginBottom: '0.5rem' }}>👛 Thanh toán qua Ví MoMo</div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#831843' }}>
                        Chuyển tiền MoMo tới số <strong>0901234567</strong> (HOMMY REAL ESTATE) với nội dung: <strong>TINDANG {(formData.GoiDangTin || 'STANDARD').toUpperCase()}</strong>
                      </p>
                    </div>
                  )}

                  {phuongThucThanhToan === 'ATM' && (
                    <div style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '0.5rem' }}>💳 Thanh toán qua Cổng VNPAY</div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
                        Hệ thống sẽ kết nối với Cổng thanh toán VNPAY để xử lý thẻ ATM/VISA/MasterCard của bạn.
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: '#0f172a', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={xacNhanDaChuyenKhoan}
                        onChange={(e) => setXacNhanDaChuyenKhoan(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                      />
                      Tôi xác nhận đã chuyển khoản / hoàn tất thanh toán cho gói tin này
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem', color: '#065f46', marginBottom: '1.5rem' }}>
                  ✨ Bạn đã chọn Gói Cơ Bản (0 ₫). Không cần thực hiện thanh toán, tin đăng của bạn sẽ được gửi cho ban quản trị duyệt ngay lập tức.
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="cda-btn cda-btn-secondary"
                  disabled={loading}
                >
                  ← Quay lại chọn gói
                </button>
                <button
                  type="button"
                  onClick={() => thucHienGuiTinDang('ChoDuyet')}
                  className="cda-btn cda-btn-primary"
                  disabled={loading || (formData.GoiDangTin !== 'basic' && !xacNhanDaChuyenKhoan)}
                  style={{
                    opacity: (loading || (formData.GoiDangTin !== 'basic' && !xacNhanDaChuyenKhoan)) ? 0.6 : 1,
                    cursor: (loading || (formData.GoiDangTin !== 'basic' && !xacNhanDaChuyenKhoan)) ? 'not-allowed' : 'pointer',
                    backgroundColor: '#059669'
                  }}
                >
                  {loading ? '⏳ Đang ghi nhận tin đăng...' : (formData.GoiDangTin === 'basic' ? 'Xác nhận và gửi đăng tin →' : 'Xác nhận đã thanh toán & Đăng tin →')}
                </button>
              </div>

              {/* Error display */}
              {submitError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  color: '#991b1b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                    <strong>Lỗi tạo tin đăng</strong>
                  </div>
                  <p style={{ margin: 0 }}>{submitError}</p>
                  <button
                    type="button"
                    onClick={() => setSubmitError('')}
                    className="cda-btn cda-btn-secondary"
                    style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 10: Hoàn tất */}
        {currentStep === 10 && submitSuccess && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                🎉
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                Đăng tin & Thanh toán thành công!
              </h3>
              <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                Tin đăng của bạn đã được ghi nhận hệ thống thanh toán và đang chờ ban quản trị duyệt
              </p>

              <div style={{
                maxWidth: '450px',
                margin: '0 auto 2rem auto',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Gói tin đăng:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {formData.GoiDangTin === 'basic' ? 'Gói Cơ Bản (0 ₫)' : (formData.GoiDangTin === 'standard' ? 'Gói Tiêu Chuẩn (50.000 ₫)' : 'Gói VIP (150.000 ₫)')}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Kênh thanh toán:</span>
                  <strong style={{ color: '#059669' }}>
                    {formData.GoiDangTin === 'basic' ? 'Miễn phí' : (phuongThucThanhToan === 'VIETQR' ? 'Chuyển khoản VietQR' : (phuongThucThanhToan === 'MOMO' ? 'Ví MoMo' : 'Cổng VNPAY'))}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Trạng thái:</span>
                  <strong style={{ color: '#2563eb' }}>Đã thanh toán - Đang chờ duyệt</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => navigate('/chu-du-an/tin-dang')}
                  className="cda-btn cda-btn-primary"
                >
                  Xem danh sách tin đăng
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/chu-du-an/tao-tin-dang')}
                  className="cda-btn cda-btn-secondary"
                >
                  Đăng tin mới
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hiển thị trạng thái xử lý ở Step 9 khi đang submit */}
        {currentStep === 9 && loading && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="cda-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                ⏳
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                Đang xử lý tin đăng...
              </h3>
              <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
                Vui lòng đợi trong giây lát, hệ thống đang xử lý tin đăng của bạn
              </p>
            </div>
          </div>
        )}
      </form>

      {/* Modal chỉnh sửa tọa độ */}
      {hienModalChinhSuaToaDo && viDo && kinhDo && (
        <ModalChinhSuaToaDo
          isOpen={hienModalChinhSuaToaDo}
          onClose={() => setHienModalChinhSuaToaDo(false)}
          initialPosition={{
            lat: parseFloat(viDo),
            lng: parseFloat(kinhDo)
          }}
          onSave={(newPos) => {
            setViDo(newPos.lat.toString());
            setKinhDo(newPos.lng.toString());
            setHienModalChinhSuaToaDo(false);
          }}
          tieuDe={formData.TieuDe || 'Tin đăng mới'}
        />
      )}
    </ChuDuAnLayout>
  );
}

export default TaoTinDang;
