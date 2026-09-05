/**
 * Preview Tin Đăng Sheet
 * Bottom sheet hiển thị chi tiết tin đăng và chọn phòng
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineWrenchScrewdriver,
  HiOutlineQrCode,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineChevronDown
} from 'react-icons/hi2';
import { layChiTietTinDangGoiY } from '../../api/nhanVienBanHangApi';
import { SpinningLoader } from './AnimatedIcons';
import { getStaticUrl } from '../../config/api';
import './PreviewTinDangSheet.css';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const PreviewTinDangSheet = ({
  isOpen,
  onClose,
  tinDangId,
  onCreateQR
}) => {
  const [tinDang, setTinDang] = useState(null);
  const [selectedPhong, setSelectedPhong] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tin đăng detail
  useEffect(() => {
    if (isOpen && tinDangId) {
      fetchTinDang();
    }
  }, [isOpen, tinDangId]);

  const fetchTinDang = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedPhong(null);

      const response = await layChiTietTinDangGoiY(tinDangId);

      if (response.success) {
        setTinDang(response.data);
        // Auto-select phòng đầu tiên nếu chỉ có 1
        if (response.data.DanhSachPhongTrong?.length === 1) {
          setSelectedPhong(response.data.DanhSachPhongTrong[0]);
        }
      } else {
        setError(response.message || 'Không thể tải thông tin tin đăng');
      }
    } catch (err) {
      console.error('[PreviewTinDangSheet] Fetch error:', err);
      setError(err.message || 'Lỗi khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = () => {
    if (!selectedPhong) {
      alert('Vui lòng chọn một phòng');
      return;
    }

    onCreateQR({
      tinDangId: tinDang.TinDangID,
      phongId: selectedPhong.PhongID,
      tinDang,
      phong: selectedPhong
    });
  };

  // Parse tiện ích
  const parseTienIch = (tienIchStr) => {
    if (!tienIchStr) return [];
    return tienIchStr.split(',').map(t => t.trim()).filter(Boolean);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="preview-sheet__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="preview-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="preview-sheet__handle">
            <div className="preview-sheet__handle-bar" />
          </div>

          {/* Header */}
          <div className="preview-sheet__header">
            <h3 className="preview-sheet__title">Chi tiết tin đăng</h3>
            <button
              type="button"
              className="preview-sheet__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <HiOutlineXMark size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="preview-sheet__content">
            {loading ? (
              <div className="preview-sheet__loading">
                <SpinningLoader size={40} />
                <p>Đang tải thông tin...</p>
              </div>
            ) : error ? (
              <div className="preview-sheet__error">
                <p>{error}</p>
                <button onClick={fetchTinDang}>Thử lại</button>
              </div>
            ) : tinDang ? (
              <>
                {/* Hình ảnh */}
                <div className="preview-sheet__images">
                  {tinDang.HinhAnh?.length > 0 ? (
                    <div className="preview-sheet__image-slider">
                      {tinDang.HinhAnh.slice(0, 3).map((anh, index) => (
                        <div key={index} className="preview-sheet__image-item">
                          <img
                            src={getStaticUrl(anh.DuongDan)}
                            alt={`Ảnh ${index + 1}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="preview-sheet__image-placeholder">
                      <HiOutlineHome size={48} />
                      <span>Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                {/* Thông tin chính */}
                <div className="preview-sheet__info">
                  <h4 className="preview-sheet__info-title">{tinDang.TieuDe}</h4>
                  
                  <div className="preview-sheet__info-row">
                    <HiOutlineMapPin size={18} />
                    <span>{tinDang.DiaChi}</span>
                  </div>

                  <div className="preview-sheet__info-row">
                    <HiOutlineHome size={18} />
                    <span>{tinDang.TenDuAn}</span>
                  </div>

                  {/* Chi phí */}
                  <div className="preview-sheet__costs">
                    <div className="preview-sheet__cost-item">
                      <HiOutlineBolt size={16} />
                      <span>Điện: {formatCurrency(tinDang.GiaDien)}/kWh</span>
                    </div>
                    <div className="preview-sheet__cost-item">
                      <HiOutlineBeaker size={16} />
                      <span>Nước: {formatCurrency(tinDang.GiaNuoc)}/m³</span>
                    </div>
                    {tinDang.GiaDichVu > 0 && (
                      <div className="preview-sheet__cost-item">
                        <HiOutlineWrenchScrewdriver size={16} />
                        <span>Dịch vụ: {formatCurrency(tinDang.GiaDichVu)}/tháng</span>
                      </div>
                    )}
                  </div>

                  {/* Tiện ích */}
                  {tinDang.TienIch && (
                    <div className="preview-sheet__amenities">
                      <h5 className="preview-sheet__amenities-title">
                        <HiOutlineSparkles size={16} />
                        Tiện ích
                      </h5>
                      <div className="preview-sheet__amenities-list">
                        {parseTienIch(tinDang.TienIch).map((ti, index) => (
                          <span key={index} className="preview-sheet__amenity-tag">
                            {ti}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danh sách phòng trống */}
                <div className="preview-sheet__rooms">
                  <h5 className="preview-sheet__rooms-title">
                    Chọn phòng ({tinDang.DanhSachPhongTrong?.length || 0} phòng trống)
                    <HiOutlineChevronDown size={16} />
                  </h5>

                  <div className="preview-sheet__rooms-list">
                    {tinDang.DanhSachPhongTrong?.map((phong) => {
                      const isSelected = selectedPhong?.PhongID === phong.PhongID;

                      return (
                        <motion.button
                          key={phong.PhongID}
                          type="button"
                          className={`preview-sheet__room ${isSelected ? 'preview-sheet__room--selected' : ''}`}
                          onClick={() => setSelectedPhong(phong)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="preview-sheet__room-info">
                            <span className="preview-sheet__room-name">{phong.TenPhong}</span>
                            <div className="preview-sheet__room-meta">
                              <span>
                                <HiOutlineCurrencyDollar size={14} />
                                {formatCurrency(phong.Gia)}
                              </span>
                              <span>
                                <HiOutlineSquare3Stack3D size={14} />
                                {phong.DienTich}m²
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <HiOutlineCheckCircle size={24} className="preview-sheet__room-check" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          {tinDang && (
            <div className="preview-sheet__footer">
              <button
                type="button"
                className="preview-sheet__btn preview-sheet__btn--secondary"
                onClick={onClose}
              >
                Đóng
              </button>
              <button
                type="button"
                className="preview-sheet__btn preview-sheet__btn--primary"
                onClick={handleCreateQR}
                disabled={!selectedPhong}
              >
                <HiOutlineQrCode size={20} />
                Tạo QR Xem Ngay
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewTinDangSheet;

