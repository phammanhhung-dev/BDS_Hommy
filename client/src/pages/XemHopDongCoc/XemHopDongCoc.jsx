/**
 * Trang Public Xem Hợp đồng Cọc
 * Khách quét QR sẽ vào trang này để xem hợp đồng cọc và xác nhận đặt cọc
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineBeaker
} from 'react-icons/hi2';
import { xemHopDongCocQR, phanHoiHopDongCoc } from '../../api/publicGoiYApi';
import './XemHopDongCoc.css';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const XemHopDongCoc = () => {
  const { maQR } = useParams();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [trangThai, setTrangThai] = useState(null);
  const [thoiGianConLai, setThoiGianConLai] = useState(0);
  const [hopDongId, setHopDongId] = useState(null);
  const [ngayChuyenVao, setNgayChuyenVao] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch thông tin QR
  useEffect(() => {
    if (maQR) {
      fetchQRInfo();
    }
  }, [maQR]);

  // Set ngày chuyển vào mặc định là ngày mai
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNgayChuyenVao(tomorrow.toISOString().split('T')[0]);
  }, []);

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

      const response = await xemHopDongCocQR(maQR);

      if (response.success) {
        setSessionData(response.data);
        setTrangThai(response.data.trangThai);
        setThoiGianConLai(response.data.thoiGianConLai || 0);
      } else {
        setError(response.message || 'Không thể tải thông tin');
        setTrangThai(response.trangThai);
      }
    } catch (err) {
      console.error('[XemHopDongCoc] Fetch error:', err);
      setError(err.message || 'Lỗi khi tải thông tin');
      setTrangThai(err.trangThai);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!ngayChuyenVao) {
      alert('Vui lòng chọn ngày muốn chuyển vào');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDeposit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      const response = await phanHoiHopDongCoc(maQR, true, ngayChuyenVao);

      if (response.success) {
        setTrangThai('DONG_Y');
        setHopDongId(response.data?.hopDongId);
      } else {
        setError(response.message || 'Lỗi khi xác nhận đặt cọc');
      }
    } catch (err) {
      console.error('[XemHopDongCoc] Confirm error:', err);
      setError(err.message || 'Lỗi khi xác nhận đặt cọc');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Bạn có chắc muốn từ chối đặt cọc?')) return;

    try {
      setSubmitting(true);

      const response = await phanHoiHopDongCoc(maQR, false, null);

      if (response.success) {
        setTrangThai('TU_CHOI');
      } else {
        setError(response.message || 'Lỗi khi gửi phản hồi');
      }
    } catch (err) {
      console.error('[XemHopDongCoc] Reject error:', err);
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

  // Render loading
  if (loading) {
    return (
      <div className="hop-dong-coc-page hop-dong-coc-page--loading">
        <div className="hop-dong-coc-page__loader">
          <div className="hop-dong-coc-page__spinner" />
          <p>Đang tải hợp đồng cọc...</p>
        </div>
      </div>
    );
  }

  // Render error states
  if (error || trangThai === 'HET_HAN' || trangThai === 'KHONG_TON_TAI') {
    return (
      <div className="hop-dong-coc-page hop-dong-coc-page--error">
        <div className="hop-dong-coc-page__error-content">
          {trangThai === 'HET_HAN' ? (
            <>
              <HiOutlineClock size={64} />
              <h2>Mã QR đã hết hạn</h2>
              <p>Mã QR này đã hết hạn sau 30 phút. Vui lòng liên hệ nhân viên bán hàng để tạo mã mới.</p>
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

  // Render đã từ chối
  if (trangThai === 'TU_CHOI') {
    return (
      <div className="hop-dong-coc-page hop-dong-coc-page--rejected">
        <div className="hop-dong-coc-page__status-content">
          <HiOutlineXCircle size={64} />
          <h2>Đã ghi nhận phản hồi</h2>
          <p>Cảm ơn bạn đã phản hồi. Nếu bạn đổi ý, hãy liên hệ nhân viên bán hàng.</p>
        </div>
      </div>
    );
  }

  // Render đã đồng ý
  if (trangThai === 'DONG_Y') {
    return (
      <div className="hop-dong-coc-page hop-dong-coc-page--success">
        <div className="hop-dong-coc-page__success-content">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <HiOutlineCheckCircle size={80} className="hop-dong-coc-page__success-icon" />
          </motion.div>
          
          <h2>Đặt cọc thành công!</h2>
          <p>Tiền cọc đã được trừ từ ví của bạn.</p>

          {hopDongId && (
            <div className="hop-dong-coc-page__contract-info">
              <HiOutlineDocumentText size={24} />
              <span>Mã hợp đồng: #{hopDongId}</span>
            </div>
          )}

          <div className="hop-dong-coc-page__success-note">
            <HiOutlineShieldCheck size={20} />
            <p>Phòng đã được giữ cho bạn. Nhân viên bán hàng sẽ liên hệ để hướng dẫn các bước tiếp theo.</p>
          </div>

          {sessionData?.thongTinNhanVien && (
            <div className="hop-dong-coc-page__contact-card">
              <h3>Liên hệ hỗ trợ</h3>
              <div className="hop-dong-coc-page__contact-row">
                <HiOutlineUser size={20} />
                <span>{sessionData.thongTinNhanVien.TenDayDu}</span>
              </div>
              <a 
                href={`tel:${sessionData.thongTinNhanVien.SoDienThoai}`}
                className="hop-dong-coc-page__contact-phone"
              >
                <HiOutlinePhone size={24} />
                <span>{sessionData.thongTinNhanVien.SoDienThoai}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render form xác nhận (CHO_PHAN_HOI)
  const { thongTinPhong, thongTinTinDang, thongTinDatCoc } = sessionData || {};

  return (
    <div className="hop-dong-coc-page">
      {/* Header */}
      <div className="hop-dong-coc-page__header">
        <HiOutlineDocumentText size={28} />
        <h1>Hợp đồng đặt cọc</h1>
        {thoiGianConLai > 0 && (
          <div className="hop-dong-coc-page__timer">
            <HiOutlineClock size={18} />
            <span>Còn {formatTime(thoiGianConLai)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="hop-dong-coc-page__content">
        {/* Room Info Card */}
        <div className="hop-dong-coc-page__card">
          <div className="hop-dong-coc-page__card-header">
            <HiOutlineHome size={20} />
            <h2>Thông tin phòng</h2>
          </div>
          <div className="hop-dong-coc-page__card-body">
            <div className="hop-dong-coc-page__info-row hop-dong-coc-page__info-row--highlight">
              <span className="hop-dong-coc-page__label">Tên phòng:</span>
              <span className="hop-dong-coc-page__value">{thongTinPhong?.TenPhong || 'N/A'}</span>
            </div>

            <div className="hop-dong-coc-page__info-row">
              <span className="hop-dong-coc-page__label">
                <HiOutlineCurrencyDollar size={16} />
                Giá thuê:
              </span>
              <span className="hop-dong-coc-page__value hop-dong-coc-page__value--price">
                {formatCurrency(thongTinPhong?.GiaChuan || thongTinPhong?.Gia)}/tháng
              </span>
            </div>

            <div className="hop-dong-coc-page__info-row">
              <span className="hop-dong-coc-page__label">
                <HiOutlineSquare3Stack3D size={16} />
                Diện tích:
              </span>
              <span className="hop-dong-coc-page__value">
                {thongTinPhong?.DienTichChuan || thongTinPhong?.DienTich || 'N/A'} m²
              </span>
            </div>

            <div className="hop-dong-coc-page__info-row">
              <span className="hop-dong-coc-page__label">
                <HiOutlineMapPin size={16} />
                Địa chỉ:
              </span>
              <span className="hop-dong-coc-page__value">
                {thongTinTinDang?.DiaChi || thongTinPhong?.DiaChi || 'N/A'}
              </span>
            </div>

            {thongTinTinDang?.TenDuAn && (
              <div className="hop-dong-coc-page__info-row">
                <span className="hop-dong-coc-page__label">Dự án:</span>
                <span className="hop-dong-coc-page__value">{thongTinTinDang.TenDuAn}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chi phí khác */}
        {(thongTinTinDang?.GiaDien || thongTinTinDang?.GiaNuoc || thongTinTinDang?.GiaDichVu) && (
          <div className="hop-dong-coc-page__card">
            <div className="hop-dong-coc-page__card-header">
              <h2>Chi phí khác</h2>
            </div>
            <div className="hop-dong-coc-page__card-body">
              {thongTinTinDang?.GiaDien && (
                <div className="hop-dong-coc-page__info-row">
                  <span className="hop-dong-coc-page__label">
                    <HiOutlineBolt size={16} />
                    Tiền điện:
                  </span>
                  <span className="hop-dong-coc-page__value">
                    {formatCurrency(thongTinTinDang.GiaDien)}/kWh
                  </span>
                </div>
              )}
              {thongTinTinDang?.GiaNuoc && (
                <div className="hop-dong-coc-page__info-row">
                  <span className="hop-dong-coc-page__label">
                    <HiOutlineBeaker size={16} />
                    Tiền nước:
                  </span>
                  <span className="hop-dong-coc-page__value">
                    {formatCurrency(thongTinTinDang.GiaNuoc)}/m³
                  </span>
                </div>
              )}
              {thongTinTinDang?.GiaDichVu && (
                <div className="hop-dong-coc-page__info-row">
                  <span className="hop-dong-coc-page__label">Phí dịch vụ:</span>
                  <span className="hop-dong-coc-page__value">
                    {formatCurrency(thongTinTinDang.GiaDichVu)}/tháng
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposit Info Card */}
        <div className="hop-dong-coc-page__card hop-dong-coc-page__card--deposit">
          <div className="hop-dong-coc-page__card-header">
            <HiOutlineCurrencyDollar size={20} />
            <h2>Thông tin đặt cọc</h2>
          </div>
          <div className="hop-dong-coc-page__card-body">
            <div className="hop-dong-coc-page__info-row">
              <span className="hop-dong-coc-page__label">Số tháng ký hợp đồng:</span>
              <span className="hop-dong-coc-page__value">{thongTinDatCoc?.soThangKy || 'N/A'} tháng</span>
            </div>

            <div className="hop-dong-coc-page__deposit-total">
              <span>Số tiền cọc cần thanh toán:</span>
              <strong>{formatCurrency(thongTinDatCoc?.soTienCoc)}</strong>
            </div>

            <div className="hop-dong-coc-page__note">
              <HiOutlineShieldCheck size={18} />
              <span>Tiền cọc sẽ được trừ từ ví của bạn khi xác nhận.</span>
            </div>
          </div>
        </div>

        {/* Ngày chuyển vào */}
        <div className="hop-dong-coc-page__card">
          <div className="hop-dong-coc-page__card-header">
            <HiOutlineCalendarDays size={20} />
            <h2>Ngày muốn chuyển vào</h2>
          </div>
          <div className="hop-dong-coc-page__card-body">
            <input
              type="date"
              value={ngayChuyenVao}
              onChange={(e) => setNgayChuyenVao(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="hop-dong-coc-page__date-input"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hop-dong-coc-page__actions">
          <p className="hop-dong-coc-page__question">
            Bạn có đồng ý với các điều khoản và muốn đặt cọc bất động sản này không?
          </p>
          
          <div className="hop-dong-coc-page__buttons">
            <button
              type="button"
              className="hop-dong-coc-page__btn hop-dong-coc-page__btn--reject"
              onClick={handleReject}
              disabled={submitting}
            >
              <HiOutlineXCircle size={22} />
              Từ chối
            </button>

            <button
              type="button"
              className="hop-dong-coc-page__btn hop-dong-coc-page__btn--accept"
              onClick={handleAccept}
              disabled={submitting}
            >
              {submitting ? (
                <div className="hop-dong-coc-page__btn-spinner" />
              ) : (
                <>
                  <HiOutlineCheckCircle size={22} />
                  Đồng ý đặt cọc
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="hop-dong-coc-page__modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="hop-dong-coc-page__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận đặt cọc</h3>
            <p>
              Bạn sẽ đặt cọc <strong>{formatCurrency(thongTinDatCoc?.soTienCoc)}</strong> cho bất động sản <strong>{thongTinPhong?.TenPhong}</strong>.
            </p>
            <p className="hop-dong-coc-page__modal-note">
              Số tiền này sẽ được trừ từ ví của bạn ngay lập tức.
            </p>
            <div className="hop-dong-coc-page__modal-actions">
              <button
                type="button"
                className="hop-dong-coc-page__modal-btn hop-dong-coc-page__modal-btn--cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="hop-dong-coc-page__modal-btn hop-dong-coc-page__modal-btn--confirm"
                onClick={handleConfirmDeposit}
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XemHopDongCoc;

