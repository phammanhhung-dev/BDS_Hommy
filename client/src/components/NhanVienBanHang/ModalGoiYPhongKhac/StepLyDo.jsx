/**
 * Step 1: Chọn lý do khách không ưng ý
 * Component trong wizard Gợi ý Phòng Khác
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineExclamationCircle,
  HiOutlineQuestionMarkCircle
} from 'react-icons/hi2';

const LY_DO_OPTIONS = [
  {
    id: 'gia_cao',
    label: 'Giá cao quá',
    icon: HiOutlineCurrencyDollar,
    description: 'Khách muốn tìm phòng rẻ hơn'
  },
  {
    id: 'dien_tich_nho',
    label: 'Diện tích nhỏ',
    icon: HiOutlineSquare3Stack3D,
    description: 'Khách cần phòng rộng hơn'
  },
  {
    id: 'vi_tri',
    label: 'Vị trí không phù hợp',
    icon: HiOutlineMapPin,
    description: 'Khách muốn khu vực khác'
  },
  {
    id: 'tien_ich',
    label: 'Thiếu tiện ích',
    icon: HiOutlineSparkles,
    description: 'Khách cần thêm tiện ích'
  },
  {
    id: 'tinh_trang_phong',
    label: 'Tình trạng phòng',
    icon: HiOutlineExclamationCircle,
    description: 'Phòng cũ/hư hỏng'
  },
  {
    id: 'khac',
    label: 'Lý do khác',
    icon: HiOutlineQuestionMarkCircle,
    description: 'Lý do khác không liệt kê'
  }
];

const StepLyDo = ({ selectedLyDo, onSelect, ghiChu, onGhiChuChange }) => {
  return (
    <div className="step-lydo">
      <div className="step-lydo__header">
        <h3 className="step-lydo__title">Khách không ưng ý vì lý do gì?</h3>
        <p className="step-lydo__subtitle">
          Chọn lý do để hệ thống gợi ý phòng phù hợp hơn
        </p>
      </div>

      <div className="step-lydo__options">
        {LY_DO_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedLyDo === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              className={`step-lydo__option ${isSelected ? 'step-lydo__option--selected' : ''}`}
              onClick={() => onSelect(option.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="step-lydo__option-icon">
                <Icon size={24} />
              </div>
              <div className="step-lydo__option-content">
                <span className="step-lydo__option-label">{option.label}</span>
                <span className="step-lydo__option-desc">{option.description}</span>
              </div>
              {isSelected && (
                <motion.div
                  className="step-lydo__option-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedLyDo === 'khac' && (
        <motion.div
          className="step-lydo__note"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="step-lydo__note-label">Ghi chú thêm:</label>
          <textarea
            className="step-lydo__note-input"
            value={ghiChu}
            onChange={(e) => onGhiChuChange(e.target.value)}
            placeholder="Nhập lý do cụ thể..."
            rows={3}
          />
        </motion.div>
      )}
    </div>
  );
};

export default StepLyDo;
export { LY_DO_OPTIONS };

