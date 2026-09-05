/**
 * Step 3: Hiển thị kết quả tìm kiếm
 * Component trong wizard Gợi ý Phòng Khác
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlineHome,
  HiOutlineEye,
  HiOutlineQrCode,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { SpinningLoader } from '../AnimatedIcons';
import { getStaticUrl } from '../../../config/api';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const StepKetQua = ({ 
  results = [], 
  loading, 
  error,
  selectedTinDang,
  onSelectTinDang,
  onViewDetail,
  onCreateQR
}) => {
  if (loading) {
    return (
      <div className="step-ketqua step-ketqua--loading">
        <SpinningLoader size={48} />
        <p className="step-ketqua__loading-text">Đang tìm kiếm phòng phù hợp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="step-ketqua step-ketqua--error">
        <HiOutlineExclamationTriangle size={48} />
        <p className="step-ketqua__error-text">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="step-ketqua step-ketqua--empty">
        <HiOutlineHome size={64} />
        <h3 className="step-ketqua__empty-title">Không tìm thấy phòng phù hợp</h3>
        <p className="step-ketqua__empty-text">
          Thử điều chỉnh bộ lọc để có thêm kết quả
        </p>
      </div>
    );
  }

  return (
    <div className="step-ketqua">
      <div className="step-ketqua__header">
        <h3 className="step-ketqua__title">
          Tìm thấy {results.length} tin đăng phù hợp
        </h3>
        <p className="step-ketqua__subtitle">
          Chọn một tin đăng để xem chi tiết hoặc tạo QR
        </p>
      </div>

      <div className="step-ketqua__list">
        <AnimatePresence>
          {results.map((tinDang, index) => {
            const isSelected = selectedTinDang?.TinDangID === tinDang.TinDangID;
            const hinhAnh = tinDang.HinhAnh?.split(',')[0];

            return (
              <motion.div
                key={tinDang.TinDangID}
                className={`step-ketqua__item ${isSelected ? 'step-ketqua__item--selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectTinDang(tinDang)}
              >
                {/* Thumbnail */}
                <div className="step-ketqua__thumbnail">
                  {hinhAnh ? (
                    <img 
                      src={getStaticUrl(hinhAnh)} 
                      alt={tinDang.TieuDe}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="step-ketqua__thumbnail-placeholder" style={{ display: hinhAnh ? 'none' : 'flex' }}>
                    <HiOutlineHome size={32} />
                  </div>
                  {/* Badge số phòng trống */}
                  <div className="step-ketqua__badge">
                    {tinDang.SoPhongTrong} phòng trống
                  </div>
                </div>

                {/* Info */}
                <div className="step-ketqua__info">
                  <h4 className="step-ketqua__item-title">{tinDang.TieuDe}</h4>
                  
                  <div className="step-ketqua__item-meta">
                    <span className="step-ketqua__meta-item">
                      <HiOutlineMapPin size={14} />
                      {tinDang.TenKhuVuc || 'Chưa xác định'}
                    </span>
                    <span className="step-ketqua__meta-item">
                      <HiOutlineCurrencyDollar size={14} />
                      {tinDang.GiaThapNhat === tinDang.GiaCaoNhat 
                        ? formatCurrency(tinDang.GiaThapNhat)
                        : `${formatCurrency(tinDang.GiaThapNhat)} - ${formatCurrency(tinDang.GiaCaoNhat)}`
                      }
                    </span>
                    <span className="step-ketqua__meta-item">
                      <HiOutlineSquare3Stack3D size={14} />
                      {tinDang.DienTichMin === tinDang.DienTichMax
                        ? `${tinDang.DienTichMin}m²`
                        : `${tinDang.DienTichMin} - ${tinDang.DienTichMax}m²`
                      }
                    </span>
                  </div>

                  <p className="step-ketqua__item-address">
                    {tinDang.DiaChi}
                  </p>
                </div>

                {/* Actions */}
                {isSelected && (
                  <motion.div 
                    className="step-ketqua__actions"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <button
                      type="button"
                      className="step-ketqua__action-btn step-ketqua__action-btn--secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(tinDang);
                      }}
                    >
                      <HiOutlineEye size={18} />
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      className="step-ketqua__action-btn step-ketqua__action-btn--primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateQR(tinDang);
                      }}
                    >
                      <HiOutlineQrCode size={18} />
                      Tạo QR
                    </button>
                  </motion.div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    className="step-ketqua__selected-indicator"
                    layoutId="selectedIndicator"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StepKetQua;

