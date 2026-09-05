/**
 * Step 2: Điều chỉnh bộ lọc tìm kiếm
 * Component trong wizard Gợi ý Phòng Khác
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineAdjustmentsHorizontal
} from 'react-icons/hi2';

// Danh sách tiện ích phổ biến
const TIEN_ICH_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'dieu_hoa', label: 'Điều hòa' },
  { id: 'nong_lanh', label: 'Nóng lạnh' },
  { id: 'tu_lanh', label: 'Tủ lạnh' },
  { id: 'may_giat', label: 'Máy giặt' },
  { id: 'ban_cong', label: 'Ban công' },
  { id: 'bep', label: 'Bếp' },
  { id: 'giu_xe', label: 'Giữ xe' }
];

const formatCurrency = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
};

const parseCurrency = (value) => {
  if (!value) return '';
  return value.replace(/[^\d]/g, '');
};

const StepBoLoc = ({ filters, onChange, khuVucList = [], lyDo }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const handleCurrencyChange = (field, value) => {
    const numericValue = parseCurrency(value);
    handleChange(field, numericValue ? parseInt(numericValue) : null);
  };

  const handleTienIchToggle = (tienIch) => {
    const currentList = filters.tienIch ? filters.tienIch.split(',') : [];
    const index = currentList.indexOf(tienIch);
    
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(tienIch);
    }
    
    handleChange('tienIch', currentList.filter(Boolean).join(','));
  };

  const isTienIchSelected = (tienIch) => {
    if (!filters.tienIch) return false;
    return filters.tienIch.split(',').includes(tienIch);
  };

  // Highlight filter dựa trên lý do
  const getHighlightClass = (field) => {
    const highlightMap = {
      gia_cao: ['giaMin', 'giaMax'],
      dien_tich_nho: ['dienTichMin', 'dienTichMax'],
      vi_tri: ['khuVucId'],
      tien_ich: ['tienIch']
    };
    
    const fieldsToHighlight = highlightMap[lyDo] || [];
    return fieldsToHighlight.includes(field) ? 'step-boloc__field--highlight' : '';
  };

  return (
    <div className="step-boloc">
      <div className="step-boloc__header">
        <h3 className="step-boloc__title">
          <HiOutlineAdjustmentsHorizontal size={24} />
          Điều chỉnh bộ lọc
        </h3>
        <p className="step-boloc__subtitle">
          Tinh chỉnh tiêu chí để tìm phòng phù hợp hơn
        </p>
      </div>

      <div className="step-boloc__fields">
        {/* Khu vực */}
        <motion.div 
          className={`step-boloc__field ${getHighlightClass('khuVucId')}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="step-boloc__label">
            <HiOutlineMapPin size={18} />
            Khu vực
          </label>
          <select
            className="step-boloc__select"
            value={filters.khuVucId || ''}
            onChange={(e) => handleChange('khuVucId', e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Tất cả khu vực</option>
            {khuVucList.map((kv) => (
              <option key={kv.KhuVucID} value={kv.KhuVucID}>
                {kv.TenKhuVuc}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Khoảng giá */}
        <motion.div 
          className={`step-boloc__field step-boloc__field--range ${getHighlightClass('giaMin')}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="step-boloc__label">
            <HiOutlineCurrencyDollar size={18} />
            Khoảng giá (VNĐ/tháng)
          </label>
          <div className="step-boloc__range-inputs">
            <input
              type="text"
              className="step-boloc__input"
              placeholder="Từ"
              value={filters.giaMin ? formatCurrency(filters.giaMin) : ''}
              onChange={(e) => handleCurrencyChange('giaMin', e.target.value)}
            />
            <span className="step-boloc__range-separator">—</span>
            <input
              type="text"
              className="step-boloc__input"
              placeholder="Đến"
              value={filters.giaMax ? formatCurrency(filters.giaMax) : ''}
              onChange={(e) => handleCurrencyChange('giaMax', e.target.value)}
            />
          </div>
          {/* Quick price buttons */}
          <div className="step-boloc__quick-options">
            {[
              { label: '< 3tr', min: null, max: 3000000 },
              { label: '3-5tr', min: 3000000, max: 5000000 },
              { label: '5-7tr', min: 5000000, max: 7000000 },
              { label: '> 7tr', min: 7000000, max: null }
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                className="step-boloc__quick-btn"
                onClick={() => {
                  handleChange('giaMin', opt.min);
                  handleChange('giaMax', opt.max);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Diện tích */}
        <motion.div 
          className={`step-boloc__field step-boloc__field--range ${getHighlightClass('dienTichMin')}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="step-boloc__label">
            <HiOutlineSquare3Stack3D size={18} />
            Diện tích (m²)
          </label>
          <div className="step-boloc__range-inputs">
            <input
              type="number"
              className="step-boloc__input"
              placeholder="Từ"
              value={filters.dienTichMin || ''}
              onChange={(e) => handleChange('dienTichMin', e.target.value ? parseInt(e.target.value) : null)}
              min={0}
            />
            <span className="step-boloc__range-separator">—</span>
            <input
              type="number"
              className="step-boloc__input"
              placeholder="Đến"
              value={filters.dienTichMax || ''}
              onChange={(e) => handleChange('dienTichMax', e.target.value ? parseInt(e.target.value) : null)}
              min={0}
            />
          </div>
          {/* Quick area buttons */}
          <div className="step-boloc__quick-options">
            {[
              { label: '< 20m²', min: null, max: 20 },
              { label: '20-30m²', min: 20, max: 30 },
              { label: '30-40m²', min: 30, max: 40 },
              { label: '> 40m²', min: 40, max: null }
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                className="step-boloc__quick-btn"
                onClick={() => {
                  handleChange('dienTichMin', opt.min);
                  handleChange('dienTichMax', opt.max);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tiện ích */}
        <motion.div 
          className={`step-boloc__field ${getHighlightClass('tienIch')}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="step-boloc__label">
            <HiOutlineSparkles size={18} />
            Tiện ích
          </label>
          <div className="step-boloc__chips">
            {TIEN_ICH_OPTIONS.map((ti) => (
              <button
                key={ti.id}
                type="button"
                className={`step-boloc__chip ${isTienIchSelected(ti.id) ? 'step-boloc__chip--selected' : ''}`}
                onClick={() => handleTienIchToggle(ti.id)}
              >
                {ti.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepBoLoc;
export { TIEN_ICH_OPTIONS };

