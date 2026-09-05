/**
 * Trang Public Xem Ngay
 * Khách quét QR sẽ vào trang này để xem thông tin phòng và xác nhận
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineSquare3Stack3D,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineBeaker
} from 'react-icons/hi2';
import { xemThongTinQR, phanHoiQR } from '../../api/publicGoiYApi';
import './XemNgayConfirm.css';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const XemNgayConfirm = () => {
  const { maQR } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const [thongTinLienHe, setThongTinLienHe] = useState(null);
  const [thoiGianConLai, setThoiGianConLai] = useState(0);

  // Fetch thông tin QR
  useEffect(() => {
    if (maQR) {
      fetchQRInfo();
    }
  }, [maQR]);

  // Countdown timer
  useEffect(() => {
    if (thoiGianConLai > 0 && trangThai === 'CHO_PHAN_HOI') {
      const timer = setInterval(() => {
        setThoiGianConLai(prev => {
          if (prev <= 1) {
            setTrangThai('HET_HAN');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [thoiGianConLai, trangThai]);

  const fetchQRInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await xemThongTinQR(maQR);

      if (response.success) {
        setSessionData(response.data);
        setTrangThai(response.data.trangThai);
        setThoiGianConLai(response.data.thoiGianConLai || 0);
      } else {
        setError(response.message || 'Không thể tải thông tin');
        setTrangThai(response.trangThai);
      }
    } catch (err) {
      console.error('[XemNgayConfirm] Fetch error:', err);
      setError(err.message || 'Lỗi khi tải thông tin');
      setTrangThai(err.trangThai);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (dongY) => {
    try {
      setSubmitting(true);

      // Lấy thời gian hiện tại từ thiết bị khách hàng (múi giờ Việt Nam)
      let thoiGianHen = null;
      if (dongY) {
        // Tạo Date object từ thời gian hiện tại của client
        const now = new Date();
        // Format theo MySQL datetime: YYYY-MM-DD HH:MM:SS
        // JavaScript Date tự động sử dụng timezone của thiết bị
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        thoiGianHen = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        console.log('[XemNgayConfirm] Thời gian từ thiết bị khách hàng:', thoiGianHen, 'Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      }

      const response = await phanHoiQR(maQR, dongY, thoiGianHen);

      if (response.success) {
        setTrangThai(response.data.trangThai);
        
        if (dongY && response.data.thongTinLienHe) {
          setThongTinLienHe(response.data.thongTinLienHe);
        }
      } else {
        setError(response.message || 'Lỗi khi gửi phản hồi');
      }
    } catch (err) {
      console.error('[XemNgayConfirm] Response error:', err);
      setError(err.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openGoogleMaps = () => {
    if (thongTinLienHe?.viDo && thongTinLienHe?.kinhDo) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${thongTinLienHe.viDo},${thongTinLienHe.kinhDo}`;
      window.open(url, '_blank');
    } else if (thongTinLienHe?.diaChi) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(thongTinLienHe.diaChi)}`;
      window.open(url, '_blank');
    }
  };

  // Render loading
  if (loading) {
    return (
      <div className="xem-ngay-page xem-ngay-page--loading">
        <div className="xem-ngay-page__loader">
          <div className="xem-ngay-page__spinner" />
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // Render error states
  if (error || trangThai === 'HET_HAN' || trangThai === 'KHONG_TON_TAI') {
    return (
      <div className="xem-ngay-page xem-ngay-page--error">
        <div className="xem-ngay-page__error-content">
          {trangThai === 'HET_HAN' ? (
            <>
              <HiOutlineClock size={64} />
              <h2>Mã QR đã hết hạn</h2>
              <p>Mã QR này đã hết hạn sau 30 phút. Vui lòng liên hệ nhân viên bán hàng để được hỗ trợ.</p>
            </>
          ) : (
            <>
              <HiOutlineExclamationTriangle size={64} />
              <h2>Không tìm thấy thông tin</h2>
              <p>{error || 'Mã QR không hợp lệ hoặc đã hết hạn.'}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render đã phản hồi (từ chối)
  if (trangThai === 'TU_CHOI') {
    return (
      <div className="xem-ngay-page xem-ngay-page--rejected">
        <div className="xem-ngay-page__status-content">
          <HiOutlineXCircle size={64} />
          <h2>Đã ghi nhận phản hồi</h2>
          <p>Cảm ơn bạn đã phản hồi. Nếu bạn đổi ý, hãy liên hệ nhân viên bán hàng.</p>
        </div>
      </div>
    );
  }

  // Render đã đồng ý (hiển thị thông tin liên hệ)
  if (trangThai === 'DONG_Y' && thongTinLienHe) {
    return (
      <div className="xem-ngay-page xem-ngay-page--success">
        <div className="xem-ngay-page__success-content">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <HiOutlineCheckCircle size={80} className="xem-ngay-page__success-icon" />
          </motion.div>
          
          <h2>Cảm ơn bạn đã xác nhận!</h2>
          <p>Dưới đây là thông tin liên hệ để bạn đến xem bất động sản</p>

          <div className="xem-ngay-page__contact-card">
            <div className="xem-ngay-page__contact-row">
              <HiOutlineHome size={20} />
              <div>
                <span className="xem-ngay-page__contact-label">Dự án</span>
                <span className="xem-ngay-page__contact-value">{thongTinLienHe.tenDuAn}</span>
              </div>
            </div>

            <div className="xem-ngay-page__contact-row">
              <HiOutlineMapPin size={20} />
              <div>
                <span className="xem-ngay-page__contact-label">Địa chỉ</span>
                <span className="xem-ngay-page__contact-value">{thongTinLienHe.diaChi}</span>
              </div>
            </div>

            <div className="xem-ngay-page__contact-row">
              <HiOutlineUser size={20} />
              <div>
                <span className="xem-ngay-page__contact-label">Nhân viên hỗ trợ</span>
                <span className="xem-ngay-page__contact-value">{thongTinLienHe.tenNhanVien}</span>
              </div>
            </div>

            <a 
              href={`tel:${thongTinLienHe.soDienThoai}`}
              className="xem-ngay-page__contact-phone"
            >
              <HiOutlinePhone size={24} />
              <span>{thongTinLienHe.soDienThoai}</span>
            </a>

            <button
              type="button"
              className="xem-ngay-page__map-btn"
              onClick={openGoogleMaps}
            >
              <HiOutlineArrowTopRightOnSquare size={20} />
              Mở Google Maps
            </button>
          </div>

          <p className="xem-ngay-page__note">
            Hãy gọi điện cho nhân viên trước khi đến để được hướng dẫn cụ thể
          </p>
        </div>
      </div>
    );
  }

  // Render form xác nhận (CHO_PHAN_HOI)
  const { thongTinPhong, thongTinTinDang } = sessionData || {};

  return (
    <div className="xem-ngay-page">
      {/* Header */}
      <div className="xem-ngay-page__header">
        <h1>Xem BĐS ngay</h1>
        {thoiGianConLai > 0 && (
          <div className="xem-ngay-page__timer">
            <HiOutlineClock size={18} />
            <span>Còn {formatTime(thoiGianConLai)}</span>
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="xem-ngay-page__content">
        <div className="xem-ngay-page__room-card">
          <div className="xem-ngay-page__room-header">
            <HiOutlineHome size={24} />
            <h2>{thongTinPhong?.TenPhong || 'Phòng'}</h2>
          </div>

          <div className="xem-ngay-page__room-info">
            <div className="xem-ngay-page__info-row xem-ngay-page__info-row--highlight">
              <HiOutlineCurrencyDollar size={20} />
              <span className="xem-ngay-page__price">
                {formatCurrency(thongTinPhong?.GiaChuan || thongTinPhong?.Gia)}/tháng
              </span>
            </div>

            <div className="xem-ngay-page__info-row">
              <HiOutlineSquare3Stack3D size={20} />
              <span>{thongTinPhong?.DienTichChuan || thongTinPhong?.DienTich || 'N/A'} m²</span>
            </div>

            <div className="xem-ngay-page__info-row">
              <HiOutlineMapPin size={20} />
              <span>{thongTinTinDang?.DiaChi || thongTinPhong?.DiaChi}</span>
            </div>

            {thongTinTinDang?.TenDuAn && (
              <div className="xem-ngay-page__info-row">
                <HiOutlineHome size={20} />
                <span>{thongTinTinDang.TenDuAn}</span>
              </div>
            )}
          </div>

          {/* Chi phí */}
          <div className="xem-ngay-page__costs">
            <h3>Chi phí khác</h3>
            <div className="xem-ngay-page__cost-list">
              {thongTinTinDang?.GiaDien && (
                <div className="xem-ngay-page__cost-item">
                  <HiOutlineBolt size={16} />
                  <span>Điện: {formatCurrency(thongTinTinDang.GiaDien)}/kWh</span>
                </div>
              )}
              {thongTinTinDang?.GiaNuoc && (
                <div className="xem-ngay-page__cost-item">
                  <HiOutlineBeaker size={16} />
                  <span>Nước: {formatCurrency(thongTinTinDang.GiaNuoc)}/m³</span>
                </div>
              )}
            </div>
          </div>

          {/* Tiện ích */}
          {thongTinTinDang?.TienIch && (
            <div className="xem-ngay-page__amenities">
              <h3>
                <HiOutlineSparkles size={18} />
                Tiện ích
              </h3>
              <div className="xem-ngay-page__amenity-list">
                {thongTinTinDang.TienIch.split(',').map((ti, index) => (
                  <span key={index} className="xem-ngay-page__amenity-tag">
                    {ti.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="xem-ngay-page__actions">
          <p className="xem-ngay-page__question">Bạn có muốn xem bất động sản này không?</p>
          
          <div className="xem-ngay-page__buttons">
            <button
              type="button"
              className="xem-ngay-page__btn xem-ngay-page__btn--reject"
              onClick={() => handleResponse(false)}
              disabled={submitting}
            >
              <HiOutlineXCircle size={22} />
              Không, cảm ơn
            </button>

            <button
              type="button"
              className="xem-ngay-page__btn xem-ngay-page__btn--accept"
              onClick={() => handleResponse(true)}
              disabled={submitting}
            >
              {submitting ? (
                <div className="xem-ngay-page__btn-spinner" />
              ) : (
                <>
                  <HiOutlineCheckCircle size={22} />
                  Tôi muốn xem
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XemNgayConfirm;

