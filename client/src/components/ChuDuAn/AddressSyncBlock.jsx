import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const makeSuggestionLabel = (suggestion = {}) => {
  const parts = [];
  const label = normalizeText(suggestion.label || '');
  if (label) return label;

  const legacyWardName = normalizeText(suggestion.legacyWardName || suggestion.wardName || suggestion.legacy_ward_name || '');
  const legacyDistrictName = normalizeText(suggestion.legacyDistrictName || suggestion.districtName || suggestion.legacy_district_name || '');
  const provinceName = normalizeText(suggestion.provinceName || suggestion.ProvinceName || suggestion.province_name || '');

  if (legacyWardName) parts.push(legacyWardName);
  if (legacyDistrictName) parts.push(legacyDistrictName);
  if (provinceName) parts.push(provinceName);

  return parts.join(', ');
};

const SuggestionRadioList = ({ suggestions, selectedSuggestionIdx, onSelect }) => {
  const list = Array.isArray(suggestions) ? suggestions : [];

  return (
    <div style={{ display: 'grid', gap: '0.6rem' }}>
      {list.map((suggestion, index) => {
        const suggestionLabel = makeSuggestionLabel(suggestion);
        const isSelected = selectedSuggestionIdx === index;
        return (
          <label
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.75rem 0.8rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              backgroundColor: isSelected ? '#ecfeff' : '#ffffff',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name="address-sync-suggestion"
              checked={isSelected}
              onChange={() => onSelect(index)}
              style={{ marginTop: '0.2rem' }}
            />
            <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
              {suggestionLabel || 'Địa chỉ đề xuất'}
            </span>
          </label>
        );
      })}
    </div>
  );
};

const AddressSyncBlock = ({
  onConfirm,
  onModeSwitch,
  streetName: propStreetName = '',
  onStreetChange,
  detailAddress = '',
  onDetailAddressChange,
  projects = [],
  selectedProjectId = '',
  onProjectChange
}) => {
  const [addressMode, setAddressMode] = useState('old');
  const [pendingModeSwitch, setPendingModeSwitch] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(null);
  const [needManualInput, setNeedManualInput] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [showManualReportInput, setShowManualReportInput] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [displayPreference, setDisplayPreference] = useState('current');
  const [provincesLegacy, setProvincesLegacy] = useState([]);
  const [provincesCurrent, setProvincesCurrent] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wardsLegacy, setWardsLegacy] = useState([]);
  const [wardsCurrent, setWardsCurrent] = useState([]);
  const [provinceId, setProvinceId] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [legacyDistrictId, setLegacyDistrictId] = useState('');
  const [legacyDistrictName, setLegacyDistrictName] = useState('');
  const [legacyWardId, setLegacyWardId] = useState('');
  const [legacyWardName, setLegacyWardName] = useState('');
  const [newWardId, setNewWardId] = useState('');
  const [newWardName, setNewWardName] = useState('');
  const streetName = propStreetName || '';
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const provinces = addressMode === 'old' ? provincesLegacy : provincesCurrent;
  const wards = addressMode === 'old' ? wardsLegacy : wardsCurrent;

  const currentAddress = useMemo(() => ({
    provinceId: provinceId ? Number(provinceId) : null,
    wardId: addressMode === 'new'
      ? (newWardId ? Number(newWardId) : null)
      : (legacyWardId ? Number(legacyWardId) : null),
    streetName: normalizeText(streetName),
    detailAddress: ''
  }), [addressMode, provinceId, legacyWardId, newWardId, streetName]);

  const legacyAddressRef = useMemo(() => ({
    legacyProvinceId: addressMode === 'old' && provinceId ? Number(provinceId) : null,
    legacyDistrictId: addressMode === 'old' && legacyDistrictId ? Number(legacyDistrictId) : null,
    legacyWardId: addressMode === 'old' && legacyWardId ? Number(legacyWardId) : null
  }), [addressMode, provinceId, legacyDistrictId, legacyWardId]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const [legacyRes, currentRes] = await Promise.all([
          axios.get(buildApiUrl('/api/address/provinces/legacy')),
          axios.get(buildApiUrl('/api/address/provinces/current'))
        ]);
        const legacyRows = Array.isArray(legacyRes?.data?.data) ? legacyRes.data.data : [];
        const currentRows = Array.isArray(currentRes?.data?.data) ? currentRes.data.data : [];
        setProvincesLegacy(legacyRows);
        setProvincesCurrent(currentRows);
      } catch (error) {
        console.error('Lỗi load provinces for AddressSyncBlock:', error);
        setProvincesLegacy([]);
        setProvincesCurrent([]);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setLegacyDistrictId('');
      setLegacyDistrictName('');
      setWardsLegacy([]);
      setWardsCurrent([]);
      setLegacyWardId('');
      setLegacyWardName('');
      return;
    }

    const loadDistricts = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/address/districts/${encodeURIComponent(provinceId)}`));
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setDistricts(rows);
      } catch (error) {
        console.error('Lỗi load districts for AddressSyncBlock:', error);
        setDistricts([]);
      }
    };

    loadDistricts();
  }, [provinceId]);

  useEffect(() => {
    if (!legacyDistrictId) {
      setWardsLegacy([]);
      setLegacyWardId('');
      setLegacyWardName('');
      return;
    }

    const loadWards = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/address/wards/${encodeURIComponent(legacyDistrictId)}`));
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setWardsLegacy(rows);
      } catch (error) {
        console.error('Lỗi load wards for AddressSyncBlock:', error);
        setWardsLegacy([]);
      }
    };

    loadWards();
  }, [legacyDistrictId]);

  useEffect(() => {
    if (!provinceId) {
      setWardsCurrent([]);
      return;
    }

    const loadCurrentWards = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/address/wards/current/${encodeURIComponent(provinceId)}`));
        const normalized = response?.data?.data || [];
        setWardsCurrent(Array.isArray(normalized) ? normalized : []);
      } catch (err) {
        console.error('Lỗi load phường/xã:', err);
        setWardsCurrent([]);
      }
    };

    loadCurrentWards();
  }, [provinceId]);

  const legacyAddressDisclaimer =
    'Địa chỉ cũ chỉ mang tính tham chiếu, giúp người mua dễ tìm kiếm theo tên gọi quen thuộc. ' +
    'Địa chỉ mới là đơn vị hành chính hiện hành, được dùng cho các thủ tục pháp lý.';

  const submitManualReport = async () => {
    const note = normalizeText(manualAddressInput);
    if (!note) return;

    try {
      const payload = {
        currentAddress: {
          provinceId: currentAddress.provinceId,
          wardId: currentAddress.wardId,
          streetName: currentAddress.streetName,
          detailAddress: currentAddress.detailAddress
        },
        legacyAddressRef: {
          legacyProvinceId: legacyAddressRef.legacyProvinceId,
          legacyDistrictId: legacyAddressRef.legacyDistrictId,
          legacyWardId: legacyAddressRef.legacyWardId
        },
        displayPreference,
        reporterNote: note
      };

      await axios.post(buildApiUrl('/api/address/manual-report'), payload);
      setManualAddressInput('');
      setShowManualReportInput(false);
      setNeedManualInput(false);
    } catch (error) {
      console.error('Lỗi gửi báo cáo địa chỉ thủ công:', error);
    }
  };

  useEffect(() => {
    const buildPayload = () => {
      let selectedSuggestion = null;
      if (selectedSuggestionIdx !== null && suggestions[selectedSuggestionIdx]) {
        selectedSuggestion = suggestions[selectedSuggestionIdx];
      }

      const nextPayload = {
        currentAddress: {
          provinceId: selectedSuggestion?.provinceId ?? currentAddress.provinceId,
          wardId: selectedSuggestion?.wardId ?? currentAddress.wardId,
          streetName: currentAddress.streetName,
          detailAddress: currentAddress.detailAddress,
          provinceName: provinceName,
          districtName: addressMode === 'old' ? legacyDistrictName : '',
          wardName: addressMode === 'new' ? newWardName : legacyWardName
        },
        legacyAddressRef: {
          legacyProvinceId: addressMode === 'new'
            ? null
            : (selectedSuggestion?.legacyProvinceId ?? legacyAddressRef.legacyProvinceId),
          legacyDistrictId: addressMode === 'new'
            ? null
            : (selectedSuggestion?.legacyDistrictId ?? legacyAddressRef.legacyDistrictId),
          legacyWardId: addressMode === 'new'
            ? null
            : (selectedSuggestion?.legacyWardId ?? legacyAddressRef.legacyWardId)
        },
        displayPreference
      };

      if (typeof onConfirm === 'function') {
        onConfirm(nextPayload);
      }
    };

    buildPayload();
  }, [selectedSuggestionIdx, suggestions, currentAddress, legacyAddressRef, displayPreference, onConfirm, provinceName, legacyDistrictName, legacyWardName, newWardName, addressMode]);

  useEffect(() => {
    const activeMode = addressMode === 'old' ? 'old-to-new' : 'new-to-old';
    const hasEnoughInput = Boolean(
      addressMode === 'old'
        ? (provinceId || legacyDistrictId || legacyWardId)
        : (provinceId || newWardId)
    );

    if (!hasEnoughInput) {
      setSuggestions([]);
      setSelectedSuggestionIdx(null);
      setNeedManualInput(false);
      return undefined;
    }

    const requestBody = {
      mode: activeMode,
      provinceId: provinceId ? Number(provinceId) : null,
      legacyDistrictId: addressMode === 'old' && legacyDistrictId ? Number(legacyDistrictId) : null,
      legacyWardId: addressMode === 'old' && legacyWardId ? Number(legacyWardId) : null,
      wardId: addressMode === 'new' && newWardId ? Number(newWardId) : null,
      streetName
    };

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setSuggestions([]);
    setSelectedSuggestionIdx(null);
    setNeedManualInput(false);

    const timer = setTimeout(async () => {
      try {
        const response = await axios.post(buildApiUrl('/api/address/suggest-mapping'), requestBody, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('[AddressSyncBlock] suggestMapping response', response?.data);

        if (response?.data?.success) {
          const payload = response.data;
          const nextSuggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
          setSuggestions(nextSuggestions);
          setNeedManualInput(Boolean(payload.needManualInput));
          setSelectedSuggestionIdx(nextSuggestions.length > 0 ? 0 : null);
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error('Lỗi khi tải gợi ý địa chỉ:', error);
        setSuggestions([]);
        setNeedManualInput(true);
      }
    }, 300);

    debounceRef.current = timer;

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressMode, provinceId, legacyDistrictId, legacyWardId, newWardId, streetName]);

  const handleModeToggle = () => {
    setPendingModeSwitch(true);
    setShowConfirmModal(true);
  };

  const confirmModeSwitch = () => {
    setAddressMode((prev) => (prev === 'old' ? 'new' : 'old'));
    setProvinceId('');
    setLegacyDistrictId('');
    setLegacyWardId('');
    setNewWardId('');
    setProvinceName('');
    setLegacyDistrictName('');
    setLegacyWardName('');
    setNewWardName('');
    setProvinceFilter('');
    setDistrictFilter('');
    setWardFilter('');
    setSuggestions([]);
    setSelectedSuggestionIdx(null);
    setNeedManualInput(false);
    setManualAddressInput('');
    setShowManualReportInput(false);
    setShowConfirmModal(false);
    setPendingModeSwitch(false);
    if (typeof onModeSwitch === 'function') {
      onModeSwitch();
    }
  };

  const cancelModeSwitch = () => {
    setPendingModeSwitch(false);
    setShowConfirmModal(false);
  };

  const renderManualReport = () => {
    if (!(needManualInput || showManualReportInput)) return null;

    return (
      <div style={{ marginTop: '0.9rem', padding: '0.85rem', border: '1px dashed #cbd5e1', borderRadius: '0.75rem', backgroundColor: '#f8fafc' }}>
        <button
          type="button"
          onClick={() => setShowManualReportInput((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: '#2563eb',
            fontSize: '0.875rem',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Không tìm thấy địa chỉ phù hợp? Cho chúng tôi biết địa chỉ của bạn
        </button>
        {showManualReportInput && (
          <div style={{ marginTop: '0.75rem' }}>
            <textarea
              value={manualAddressInput}
              onChange={(event) => setManualAddressInput(event.target.value)}
              rows={3}
              placeholder="Nhập địa chỉ bạn muốn báo cáo..."
              style={{ width: '100%', resize: 'vertical', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={submitManualReport}
                style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.55rem 0.9rem', cursor: 'pointer' }}
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredProvinces = provinces.filter((item) => {
    const text = (item.TenKhuVuc || item.name || '').toLowerCase();
    return !provinceFilter || text.includes(provinceFilter.toLowerCase());
  });

  const filteredDistricts = districts.filter((item) => {
    const text = (item.TenKhuVuc || item.name || '').toLowerCase();
    return !districtFilter || text.includes(districtFilter.toLowerCase());
  });

  const filteredWards = wards.filter((item) => {
    const text = (item.TenKhuVuc || item.name || '').toLowerCase();
    return !wardFilter || text.includes(wardFilter.toLowerCase());
  });

  const selectProvince = (nextProvince) => {
    setProvinceId(String(nextProvince.KhuVucID ?? nextProvince.ProvinceID ?? nextProvince.id ?? ''));
    setProvinceName(nextProvince.TenKhuVuc || nextProvince.ProvinceName || nextProvince.name || '');
    setProvinceFilter(nextProvince.TenKhuVuc || nextProvince.ProvinceName || nextProvince.name || '');
    setShowProvinceDropdown(false);
    setDistricts([]);
    setLegacyDistrictId('');
    setLegacyDistrictName('');
    setWardsLegacy([]);
    setWardsCurrent([]);
    setLegacyWardId('');
    setLegacyWardName('');
  };

  const selectDistrict = (nextDistrict) => {
    setLegacyDistrictId(String(nextDistrict.KhuVucID ?? nextDistrict.DistrictID ?? nextDistrict.id ?? ''));
    setLegacyDistrictName(nextDistrict.TenKhuVuc || nextDistrict.DistrictName || nextDistrict.name || '');
    setDistrictFilter(nextDistrict.TenKhuVuc || nextDistrict.DistrictName || nextDistrict.name || '');
    setShowDistrictDropdown(false);
    setWardsLegacy([]);
    setLegacyWardId('');
    setLegacyWardName('');
  };

  const selectWard = (nextWard) => {
    const wardId = String(nextWard.KhuVucID ?? nextWard.WardID ?? nextWard.CommuneID ?? nextWard.id ?? '');
    const wardName = nextWard.TenKhuVuc || nextWard.WardName || nextWard.CommuneName || nextWard.name || '';

    if (addressMode === 'new') {
      setNewWardId(wardId);
      setNewWardName(wardName);
    } else {
      setLegacyWardId(wardId);
      setLegacyWardName(wardName);
    }

    setWardFilter(wardName);
    setShowWardDropdown(false);
  };

  // Chuẩn hóa chuỗi địa chỉ để so khớp
  const removeDiacritics = (s) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Chuỗi mô tả khu vực đã chọn để hiển thị trong UI
  const selectedAreaDesc = useMemo(() => {
    const prov = provinceName || provinceFilter || '';
    const dist = addressMode === 'old' ? (legacyDistrictName || districtFilter || '') : '';
    const ward = addressMode === 'old' ? (legacyWardName || wardFilter || '') : (newWardName || wardFilter || '');
    return [ward, dist, prov].filter(Boolean).join(', ');
  }, [provinceName, provinceFilter, legacyDistrictName, districtFilter, legacyWardName, newWardName, wardFilter, addressMode]);

  // Lọc tất cả các dự án thuộc khu vực đã chọn (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã)
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) return [];

    const prov = provinceName || provinceFilter || '';
    const dist = addressMode === 'old' ? (legacyDistrictName || districtFilter || '') : '';
    const ward = addressMode === 'old' ? (legacyWardName || wardFilter || '') : (newWardName || wardFilter || '');

    // Nếu chưa chọn Tỉnh/Thành: chưa hiển thị dự án
    if (!prov) return [];

    const normProv = removeDiacritics(prov).replace(/^(tp\.?|thanh pho|tinh)\s+/i, '').trim();
    const distStr = removeDiacritics(dist);
    const wardStr = removeDiacritics(ward);

    return projects.filter((p) => {
      const normAddr = removeDiacritics(p.DiaChi || p.address || '');

      // 1. Lọc theo Tỉnh/Thành
      if (normProv) {
        const isHcm = normProv.includes('ho chi minh') || normProv === 'hcm';
        const matchProv = isHcm
          ? (normAddr.includes('ho chi minh') || normAddr.includes('tp.hcm') || normAddr.includes('hcm') || normAddr.includes('sai gon'))
          : (normAddr.includes(normProv) || normProv.includes(normAddr));
        if (!matchProv) return false;
      }

      // 2. Lọc theo Quận/Huyện (nếu có chọn)
      if (distStr) {
        const distNumMatch = distStr.match(/^(?:quan|q\.?|huyen)?\s*(\d+)$/i);
        let matchesDist = false;

        if (distNumMatch) {
          const distNum = distNumMatch[1];
          const regexDistNum = new RegExp('(?:quan|q\\.?|huyen)\\s*' + distNum + '(?:[^0-9]|$)', 'i');
          matchesDist = regexDistNum.test(normAddr);

          // Nếu địa chỉ không ghi trực tiếp số quận, kiểm tra xem có thuộc phường nào của quận này không
          if (!matchesDist && !/(?:quan|q\.?|huyen)\s+[a-z0-9]/i.test(normAddr)) {
            matchesDist = Array.isArray(wardsLegacy) && wardsLegacy.some((w) => {
              const rawW = removeDiacritics(w.TenKhuVuc || w.name || '');
              const wNum = rawW.match(/^(?:phuong|p\.?|xa|thi tran)?\s*(\d+[a-z]?)$/i);
              if (wNum) {
                return new RegExp('(?:phuong|p\\.?|xa)\\s*' + wNum[1] + '(?:[^0-9a-z]|$)', 'i').test(normAddr);
              }
              const cleanW = rawW.replace(/^(phuong|xa|thi tran|p\\.?)\s+/i, '').trim();
              return cleanW.length >= 3 && !/^\d+$/.test(cleanW) && normAddr.includes(cleanW);
            });
          }
        } else {
          const cleanNamedDist = distStr.replace(/^(quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
          matchesDist = cleanNamedDist ? normAddr.includes(cleanNamedDist) : false;

          // Nếu địa chỉ không ghi trực tiếp tên quận/huyện, kiểm tra phường (chỉ khi địa chỉ chưa có quận khác)
          if (!matchesDist && !/(?:quan|q\.?|huyen|thi xa)\s+[a-z0-9]/i.test(normAddr)) {
            matchesDist = Array.isArray(wardsLegacy) && wardsLegacy.some((w) => {
              const rawW = removeDiacritics(w.TenKhuVuc || w.name || '');
              const cleanW = rawW.replace(/^(phuong|xa|thi tran|p\\.?)\s+/i, '').trim();
              return cleanW.length >= 3 && !/^\d+$/.test(cleanW) && normAddr.includes(cleanW);
            });
          }
        }

        if (!matchesDist) return false;
      }

      // 3. Lọc theo Phường/Xã (nếu có chọn)
      if (wardStr) {
        const wardNumMatch = wardStr.match(/^(?:phuong|p\.?|xa|thi tran)?\s*(\d+[a-z]?)$/i);
        if (wardNumMatch) {
          const wardNum = wardNumMatch[1];
          const regexWardNum = new RegExp('(?:phuong|p\\.?|xa)\\s*' + wardNum + '(?:[^0-9a-z]|$)', 'i');
          if (!regexWardNum.test(normAddr)) return false;
        } else {
          const cleanNamedWard = wardStr.replace(/^(phuong|xa|thi tran|p\.?)\s+/i, '').trim();
          if (cleanNamedWard && !normAddr.includes(cleanNamedWard)) return false;
        }
      }

      return true;
    });
  }, [projects, provinceName, provinceFilter, legacyDistrictName, districtFilter, legacyWardName, newWardName, wardFilter, addressMode, wardsLegacy]);

  // Nếu người dùng đã chọn dự án nhưng sau đó đổi khu vực khác (không chứa dự án đó nữa)
  useEffect(() => {
    if (!selectedProjectId) return;
    const hasSelectedLocation = Boolean(provinceName || provinceFilter);
    if (!hasSelectedLocation) return;

    const isStillValid = filteredProjects.some(
      (p) => String(p.DuAnID || p.id) === String(selectedProjectId)
    );

    if (!isStillValid && filteredProjects.length > 0) {
      if (onProjectChange) onProjectChange(null);
    }
  }, [filteredProjects, selectedProjectId, provinceName, provinceFilter, onProjectChange]);

  const handleProjectSelect = async (projectId) => {
    if (!projectId) {
      if (onProjectChange) onProjectChange(null);
      return;
    }

    const project = Array.isArray(projects)
      ? projects.find((p) => String(p.DuAnID || p.id) === String(projectId))
      : null;

    if (!project) {
      if (onProjectChange) onProjectChange(null);
      return;
    }

    // Gửi project object lên component cha
    if (onProjectChange) onProjectChange(project);

    const diaChi = project.DiaChi || '';
    if (!diaChi) return;

    // Chuyển sang chế độ địa chỉ chuẩn (Tỉnh -> Huyện -> Xã)
    if (addressMode !== 'old') {
      setAddressMode('old');
    }

    const parts = diaChi.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;

    const rawProvince = parts[parts.length - 1] || '';
    const rawDistrict = parts.length >= 2 ? parts[parts.length - 2] : '';
    const rawWard = parts.length >= 3 ? parts[parts.length - 3] : '';
    const rawStreet = parts.slice(0, Math.max(1, parts.length - 3)).join(', ') || parts[0] || '';

    const normalizeStr = (s) =>
      s
        ? s
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/^(tp\.?|thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, '')
            .trim()
        : '';

    // 1. Khớp Tỉnh/Thành
    const provList = provincesLegacy.length > 0 ? provincesLegacy : provinces;
    let matchedProv = provList.find((p) => normalizeStr(p.TenKhuVuc) === normalizeStr(rawProvince));
    if (!matchedProv) {
      matchedProv = provList.find(
        (p) =>
          normalizeStr(rawProvince).includes(normalizeStr(p.TenKhuVuc)) ||
          normalizeStr(p.TenKhuVuc).includes(normalizeStr(rawProvince))
      );
    }

    if (matchedProv) {
      const provIdStr = String(matchedProv.KhuVucID ?? matchedProv.ProvinceID ?? matchedProv.id);
      setProvinceId(provIdStr);
      setProvinceName(matchedProv.TenKhuVuc || matchedProv.ProvinceName || '');
      setProvinceFilter(matchedProv.TenKhuVuc || matchedProv.ProvinceName || '');

      // 2. Tải và khớp Quận/Huyện
      try {
        const dRes = await axios.get(buildApiUrl(`/api/address/districts/${encodeURIComponent(provIdStr)}`));
        const distList = Array.isArray(dRes?.data?.data) ? dRes.data.data : [];
        setDistricts(distList);

        let matchedDist = distList.find((d) => normalizeStr(d.TenKhuVuc) === normalizeStr(rawDistrict));
        if (!matchedDist) {
          matchedDist = distList.find(
            (d) =>
              normalizeStr(rawDistrict).includes(normalizeStr(d.TenKhuVuc)) ||
              normalizeStr(d.TenKhuVuc).includes(normalizeStr(rawDistrict))
          );
        }

        if (matchedDist) {
          const distIdStr = String(matchedDist.KhuVucID ?? matchedDist.DistrictID ?? matchedDist.id);
          setLegacyDistrictId(distIdStr);
          setLegacyDistrictName(matchedDist.TenKhuVuc || matchedDist.DistrictName || '');
          setDistrictFilter(matchedDist.TenKhuVuc || matchedDist.DistrictName || '');

          // 3. Tải và khớp Phường/Xã
          try {
            const wRes = await axios.get(buildApiUrl(`/api/address/wards/${encodeURIComponent(distIdStr)}`));
            const wardList = Array.isArray(wRes?.data?.data) ? wRes.data.data : [];
            setWardsLegacy(wardList);

            let matchedWard = wardList.find((w) => normalizeStr(w.TenKhuVuc) === normalizeStr(rawWard));
            if (!matchedWard) {
              matchedWard = wardList.find(
                (w) =>
                  normalizeStr(rawWard).includes(normalizeStr(w.TenKhuVuc)) ||
                  normalizeStr(w.TenKhuVuc).includes(normalizeStr(rawWard))
              );
            }

            if (matchedWard) {
              const wardIdStr = String(matchedWard.KhuVucID ?? matchedWard.WardID ?? matchedWard.id);
              setLegacyWardId(wardIdStr);
              setLegacyWardName(matchedWard.TenKhuVuc || matchedWard.WardName || '');
              setWardFilter(matchedWard.TenKhuVuc || matchedWard.WardName || '');
            }
          } catch (wErr) {
            console.error('Lỗi load wards cho dự án:', wErr);
          }
        }
      } catch (dErr) {
        console.error('Lỗi load districts cho dự án:', dErr);
      }
    }

    // 4. Đồng bộ Địa chỉ chi tiết / Tên đường
    if (rawStreet) {
      if (onDetailAddressChange) onDetailAddressChange(rawStreet);
      if (onStreetChange) onStreetChange(rawStreet);
    }
  };

  return (
    <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '0.875rem', backgroundColor: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Tìm theo địa chỉ mới</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleModeToggle}
            style={{
              width: '3rem',
              height: '1.65rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: addressMode === 'old' ? '#cbd5e1' : '#2563eb',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            aria-label="toggle address mode"
          >
            <span
              style={{
                position: 'absolute',
                top: '0.15rem',
                left: addressMode === 'old' ? '0.15rem' : '1.5rem',
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)',
                transition: 'left 0.2s'
              }}
            />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          alignItems: 'start'
        }}
      >
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
            Tỉnh/Thành <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={provinceFilter || provinceName}
              onChange={(event) => {
                const next = event.target.value;
                setProvinceFilter(next);
                setProvinceName(next);
                if (!next) {
                  setProvinceId('');
                  setDistricts([]);
                } else {
                  const match = provinces.find(p => (p.TenKhuVuc || p.name)?.toLowerCase() === next.toLowerCase().trim());
                  if (match) {
                    const idStr = String(match.KhuVucID ?? match.ProvinceID ?? match.id ?? '');
                    setProvinceId(idStr);
                  }
                }
                setShowProvinceDropdown(true);
              }}
              onFocus={() => setShowProvinceDropdown(true)}
              onClick={() => setShowProvinceDropdown(true)}
              onBlur={() => setTimeout(() => setShowProvinceDropdown(false), 160)}
              placeholder="Chọn Tỉnh/Thành"
              style={{
                width: '100%',
                height: '2.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                fontSize: '0.9rem',
                color: '#0f172a',
                background: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.75rem' }}>
              ▼
            </span>
          </div>
          {showProvinceDropdown && filteredProvinces.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(15,23,42,0.12)', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredProvinces.map((item) => (
                <button key={item.KhuVucID || item.ProvinceID || item.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectProvince(item)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                  {item.TenKhuVuc || item.ProvinceName || item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {addressMode === 'old' && (
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
              Quận/Huyện <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={districtFilter || legacyDistrictName}
                onChange={(event) => {
                  const next = event.target.value;
                  setDistrictFilter(next);
                  setLegacyDistrictName(next);
                  if (!next) {
                    setLegacyDistrictId('');
                  } else {
                    const match = districts.find(d => (d.TenKhuVuc || d.name)?.toLowerCase() === next.toLowerCase().trim());
                    if (match) {
                      const idStr = String(match.KhuVucID ?? match.DistrictID ?? match.id ?? '');
                      setLegacyDistrictId(idStr);
                    }
                  }
                  setShowDistrictDropdown(true);
                }}
                onFocus={() => setShowDistrictDropdown(true)}
                onClick={() => setShowDistrictDropdown(true)}
                onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 160)}
                placeholder="Chọn Quận/Huyện"
                style={{
                  width: '100%',
                  height: '2.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.75rem' }}>
                ▼
              </span>
            </div>
            {showDistrictDropdown && filteredDistricts.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(15,23,42,0.12)', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                {filteredDistricts.map((item) => (
                  <button key={item.KhuVucID || item.DistrictID || item.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectDistrict(item)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                    {item.TenKhuVuc || item.DistrictName || item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
            Phường/Xã <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={wardFilter || (addressMode === 'old' ? legacyWardName : newWardName)}
              onChange={(event) => {
                const next = event.target.value;
                setWardFilter(next);
                if (addressMode === 'old') {
                  setLegacyWardName(next);
                  const match = wards.find(w => (w.TenKhuVuc || w.name)?.toLowerCase() === next.toLowerCase().trim());
                  if (match) setLegacyWardId(String(match.KhuVucID ?? match.WardID ?? match.id ?? ''));
                } else {
                  setNewWardName(next);
                  const match = wards.find(w => (w.TenKhuVuc || w.name)?.toLowerCase() === next.toLowerCase().trim());
                  if (match) setNewWardId(String(match.KhuVucID ?? match.WardID ?? match.id ?? ''));
                }
                if (!next) {
                  if (addressMode === 'old') setLegacyWardId('');
                  else setNewWardId('');
                }
                setShowWardDropdown(true);
              }}
              onFocus={() => setShowWardDropdown(true)}
              onClick={() => setShowWardDropdown(true)}
              onBlur={() => setTimeout(() => setShowWardDropdown(false), 160)}
              placeholder="Chọn Phường/Xã"
              style={{
                width: '100%',
                height: '2.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                fontSize: '0.9rem',
                color: '#0f172a',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.75rem' }}>
              ▼
            </span>
          </div>
          {showWardDropdown && filteredWards.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(15,23,42,0.12)', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredWards.map((item) => (
                <button key={item.KhuVucID || item.WardID || item.CommuneID || item.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectWard(item)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                  {item.TenKhuVuc || item.WardName || item.CommuneName || item.name}
                </button>
              ))}
            </div>
          )}
        </div>


        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
            Địa chỉ chi tiết
          </label>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => onDetailAddressChange && onDetailAddressChange(e.target.value)}
            placeholder="Nhập số nhà, khu phố, ngõ hẻm..."
            style={{
              width: '100%',
              height: '2.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.85rem',
              fontSize: '0.9rem',
              color: '#0f172a',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Hàng chọn Dự án - Theo đúng thiết kế giao diện */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '380px' }}>
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
            Dự án{' '}
            {selectedProjectId ? (
              <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}>
                (Đã liên kết)
              </span>
            ) : !provinceName && !provinceFilter ? (
              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 400 }}>
                (Chọn địa điểm để xem dự án)
              </span>
            ) : filteredProjects.length > 0 ? (
              <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}>
                ({filteredProjects.length} dự án tại {selectedAreaDesc})
              </span>
            ) : (
              <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 500 }}>
                (Chưa có dự án tại {selectedAreaDesc})
              </span>
            )}
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectSelect(e.target.value)}
              disabled={!provinceName && !provinceFilter}
              style={{
                width: '100%',
                height: '2.75rem',
                border: selectedProjectId ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                fontSize: '0.9rem',
                color: selectedProjectId ? '#065f46' : filteredProjects.length === 0 ? '#94a3b8' : '#0f172a',
                fontWeight: selectedProjectId ? 600 : 400,
                background: selectedProjectId ? '#f0fdf4' : (!provinceName && !provinceFilter) ? '#f8fafc' : '#ffffff',
                appearance: 'none',
                outline: 'none',
                cursor: (!provinceName && !provinceFilter) ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
            >
              {!provinceName && !provinceFilter ? (
                <option value="">-- Vui lòng chọn địa điểm (Tỉnh/Thành) trước --</option>
              ) : filteredProjects.length === 0 ? (
                <option value="">-- Không có dự án nào tại {selectedAreaDesc} --</option>
              ) : (
                <>
                  <option value="">-- Không thuộc dự án nào --</option>
                  {filteredProjects.map((p) => (
                    <option key={p.DuAnID || p.id} value={p.DuAnID || p.id}>
                      🏢 {p.TenDuAn || p.name} {p.DiaChi ? `(${p.DiaChi})` : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: selectedProjectId ? '#059669' : '#64748b', fontSize: '0.75rem' }}>
              ▼
            </span>
          </div>
          {!provinceName && !provinceFilter && (
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', marginBottom: 0 }}>
              💡 Chọn Tỉnh/Thành phố ở trên để hiển thị danh sách tất cả các dự án tại khu vực đó.
            </p>
          )}
        </div>
      </div>

      {/* Banner xác nhận liên kết dự án */}
      {selectedProjectId && (() => {
        const linkedProject = Array.isArray(projects)
          ? projects.find((p) => String(p.DuAnID || p.id) === String(selectedProjectId))
          : null;
        if (!linkedProject) return null;
        return (
          <div
            data-testid="linked-project-banner"
            style={{
              marginTop: '0.85rem',
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.35rem' }}>🏢</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065f46' }}>
                  Đã liên kết với dự án: {linkedProject.TenDuAn}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                  📍 {linkedProject.DiaChi}
                  {linkedProject.ViDo && linkedProject.KinhDo && ` • Tọa độ ghim bản đồ: ${linkedProject.ViDo}, ${linkedProject.KinhDo}`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleProjectSelect('')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#b91c1c',
                backgroundColor: '#ffffff',
                border: '1px solid #fca5a5',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              ✕ Hủy liên kết dự án
            </button>
          </div>
        );
      })()}

      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>
          Địa chỉ hiển thị trên tin đăng <span style={{ color: '#dc2626' }}>*</span>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderRadius: '0.625rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: '#047857', marginBottom: '0.2rem' }}>
            <span>✔</span> Thêm hiển thị cho địa chỉ mới
          </div>
          <div style={{ fontSize: '0.8rem', color: '#065f46', lineHeight: 1.45 }}>
            Tin hiển thị ở 2 trang kết quả tìm kiếm (địa chỉ mới và cũ), giúp tiếp cận nhiều người tìm nhà hơn
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap' }}>📍 Địa chỉ cũ:</span>
            <span style={{ color: '#334155', fontWeight: 500 }}>
              {(() => {
                const dt = detailAddress ? detailAddress.trim() : '';
                const st = streetName ? streetName.trim() : '';
                let streetPart = dt;
                if (st && (!dt || !dt.toLowerCase().includes(st.toLowerCase()))) {
                  streetPart = dt ? `${dt}, ${st}` : st;
                }
                return [streetPart, legacyWardName, legacyDistrictName, provinceName].filter(Boolean).join(', ') || 'Chưa nhập đủ thông tin địa chỉ cũ';
              })()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>📍 Địa chỉ mới:</span>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '0.625rem',
                border: `1px solid ${displayPreference === 'current' ? '#10b981' : '#cbd5e1'}`,
                backgroundColor: displayPreference === 'current' ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}>
                <input
                  type="radio"
                  name="displayPreference"
                  value="current"
                  checked={displayPreference === 'current'}
                  onChange={() => setDisplayPreference('current')}
                  style={{ marginTop: '0.2rem', accentColor: '#059669' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Địa chỉ do hệ thống gợi ý</div>
                  <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.15rem' }}>
                    {suggestions.length > 0
                      ? makeSuggestionLabel(suggestions[selectedSuggestionIdx || 0])
                      : (() => {
                          const dt = detailAddress ? detailAddress.trim() : '';
                          const st = streetName ? streetName.trim() : '';
                          let streetPart = dt;
                          if (st && (!dt || !dt.toLowerCase().includes(st.toLowerCase()))) {
                            streetPart = dt ? `${dt}, ${st}` : st;
                          }
                          return [streetPart, newWardName || legacyWardName, provinceName].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ gợi ý...';
                        })()}
                  </div>
                </div>
              </label>

              <div style={{ marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowManualReportInput((prev) => !prev)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: '#64748b',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>🔲</span>
                  <span style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    Không tìm thấy địa chỉ phù hợp? Cho chúng tôi biết địa chỉ của bạn
                  </span>
                </button>

                {showManualReportInput && (
                  <div style={{ marginTop: '0.625rem', padding: '0.85rem', border: '1px dashed #cbd5e1', borderRadius: '0.625rem', backgroundColor: '#f8fafc' }}>
                    <textarea
                      value={manualAddressInput}
                      onChange={(event) => setManualAddressInput(event.target.value)}
                      rows={3}
                      placeholder="Nhập chi tiết địa chỉ của bạn để chúng tôi cập nhật..."
                      style={{ width: '100%', resize: 'vertical', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
                    />
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={submitManualReport}
                        style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Gửi báo cáo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '0.625rem',
                border: `1px solid ${displayPreference === 'legacy' ? '#10b981' : '#cbd5e1'}`,
                backgroundColor: displayPreference === 'legacy' ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="displayPreference"
                  value="legacy"
                  checked={displayPreference === 'legacy'}
                  onChange={() => setDisplayPreference('legacy')}
                  style={{ marginTop: '0.2rem', accentColor: '#059669' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Địa chỉ cũ (Không tìm thấy địa chỉ phù hợp?)</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Bấm vào đây nếu bạn muốn sử dụng tên địa giới hành chính trước khi sáp nhập
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 'min(28rem, calc(100vw - 2rem))', backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 30px 60px rgba(15, 23, 42, 0.2)', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#111827' }}>Đổi cách nhập địa chỉ</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>Thông tin địa chỉ hiện tại sẽ bị xóa</p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={cancelModeSwitch} style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.9rem', borderRadius: '0.5rem', backgroundColor: '#fff', cursor: 'pointer' }}>
                Hủy
              </button>
              <button type="button" onClick={confirmModeSwitch} style={{ border: 'none', padding: '0.6rem 0.9rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}>
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSyncBlock;
