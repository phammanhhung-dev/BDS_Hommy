import React from 'react';
import './ModalPreviewPhong.css';
import {
  HiOutlineXMark,
  HiOutlineHome,
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock
} from 'react-icons/hi2';
import { getStaticUrl } from '../../config/api';

/**
 * Modal preview danh sách phòng
 * Hiển thị chi tiết các phòng theo trạng thái (Còn trống / Đã thuê)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái mở/đóng modal
 * @param {Function} props.onClose - Callback khi đóng modal
 * @param {Array} props.danhSachPhong - Danh sách phòng cần hiển thị
 * @param {string} props.loaiHienThi - 'conTrong' | 'daThue' | 'tatCa'
 * @param {Object} props.tinDang - Thông tin tin đăng
 */
const ModalPreviewPhong = ({ 
  isOpen, 
  onClose, 
  danhSachPhong = [], 
  loaiHienThi = 'tatCa',
  tinDang = {}
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value) => {
    return parseInt(value || 0).toLocaleString('vi-VN') + ' ₫';
  };

  // Lọc phòng theo loại hiển thị
  const phongHienThi = danhSachPhong.filter(phong => {
    if (loaiHienThi === 'conTrong') return phong.TrangThai === 'Trong';
    if (loaiHienThi === 'daThue') return phong.TrangThai === 'DaThue';
    return true;
  });

  const getTieuDeModal = () => {
    if (loaiHienThi === 'conTrong') return `Phòng còn trống (${phongHienThi.length})`;
    if (loaiHienThi === 'daThue') return `Phòng đã thuê (${phongHienThi.length})`;
    return `Tất cả phòng (${phongHienThi.length})`;
  };

  const getTrangThaiInfo = (trangThai) => {
    const map = {
      'Trong': { 
        label: 'Còn trống', 
        icon: <HiOutlineCheckCircle />, 
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)'
      },
      'DaThue': { 
        label: 'Đã thuê', 
        icon: <HiOutlineXCircle />, 
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)'
      },
      'GiuCho': { 
        label: 'Đang giữ chỗ', 
        icon: <HiOutlineClock />, 
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)'
      },
      'DonDep': { 
        label: 'Đang dọn dẹp', 
        icon: <HiOutlineClock />, 
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)'
      }
    };
    return map[trangThai] || { 
      label: trangThai, 
      icon: <HiOutlineHome />, 
      color: '#9ca3af',
      bgColor: 'rgba(156, 163, 175, 0.1)'
    };
  };

  const getHinhAnh = (urlJson) => {
    try {
      if (!urlJson) return null;

      const withCacheBuster = (url) => {
        if (!url) return null;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${Date.now()}`;
      };

      // Nếu urlJson là string nhưng không phải JSON array
      if (typeof urlJson === 'string' && !urlJson.trim().startsWith('[')) {
        return withCacheBuster(getStaticUrl(urlJson));
      }

      const parsed = typeof urlJson === 'string' ? JSON.parse(urlJson) : urlJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return withCacheBuster(getStaticUrl(parsed[0]));
      }

      return null;
    } catch (error) {
      console.error('❌ Error parsing image URL:', error, urlJson);
      return null;
    }
  };

  return (
    <div className="modal-preview-phong__overlay" onClick={onClose}>
      <div className="modal-preview-phong" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-preview-phong__header">
          <div className="modal-preview-phong__header-content">
            <h2 className="modal-preview-phong__title">{getTieuDeModal()}</h2>
            <p className="modal-preview-phong__subtitle">{tinDang.TieuDe}</p>
          </div>
          <button className="modal-preview-phong__close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-preview-phong__body">
          {phongHienThi.length > 0 ? (
            <div className="phong-grid">
              {phongHienThi.map((phong) => {
                const statusInfo = getTrangThaiInfo(phong.TrangThai);
                const hinhAnh = getHinhAnh(phong.URL || phong.HinhAnhHienThi);
                const gia = phong.Gia ?? phong.GiaHienThi;
                const dienTich = phong.DienTich ?? phong.DienTichHienThi;
                const moTa = phong.MoTa ?? phong.MoTaHienThi;

                return (
                  <div key={phong.PhongID} className="phong-card">
                    {/* Image */}
                    <div className="phong-image">
                      {hinhAnh ? (
                        <img src={hinhAnh} alt={phong.TenPhong} />
                      ) : (
                        <div className="phong-image-placeholder">
                          <HiOutlineHome />
                        </div>
                      )}
                      <div 
                        className="phong-status-badge" 
                        style={{ 
                          background: statusInfo.bgColor,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.color}`
                        }}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="phong-content">
                      <h3 className="phong-name">{phong.TenPhong}</h3>
                      
                      <div className="phong-info">
                        {gia && (
                          <div className="phong-info-item">
                            <HiOutlineCurrencyDollar className="phong-info-icon" />
                            <span className="phong-info-label">Giá thuê:</span>
                            <span className="phong-info-value">{formatCurrency(gia)}/tháng</span>
                          </div>
                        )}
                        {dienTich && (
                          <div className="phong-info-item">
                            <HiOutlineSquare3Stack3D className="phong-info-icon" />
                            <span className="phong-info-label">Diện tích:</span>
                            <span className="phong-info-value">{dienTich} m²</span>
                          </div>
                        )}
                      </div>

                      {moTa && (
                        <p className="phong-desc">{moTa}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="modal-empty">
              <div className="modal-empty-icon">
                <HiOutlineHome />
              </div>
              <p className="modal-empty-text">
                {loaiHienThi === 'conTrong' 
                  ? 'Không có phòng trống' 
                  : loaiHienThi === 'daThue'
                  ? 'Không có phòng đã thuê'
                  : 'Không có phòng nào'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-preview-phong__footer">
          <button className="modal-preview-phong__btn modal-preview-phong__btn--secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPreviewPhong;
