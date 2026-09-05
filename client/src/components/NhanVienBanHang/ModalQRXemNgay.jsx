/**
 * Modal QR Xem Ngay
 * Hiển thị QR code, countdown timer, và real-time status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineHome,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar
} from 'react-icons/hi2';
import { taoQRXemNgay } from '../../api/nhanVienBanHangApi';
import { useGoiYSocket, QR_STATUS } from '../../hooks/useGoiYSocket';
import { 
  CountdownCircle, 
  SpinningLoader, 
  BouncingCheck, 
  ShakingX,
  WaitingDots,
  SuccessConfetti
} from './AnimatedIcons';
import './ModalQRXemNgay.css';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const ModalQRXemNgay = ({
  isOpen,
  onClose,
  cuocHenId,
  tinDangId,
  phongId,
  tinDangInfo,
  phongInfo,
  onSuccess
}) => {
  // State
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Socket hook
  const {
    trangThai,
    thoiGianConLai,
    phanHoi,
    isWaiting,
    subscribe,
    unsubscribe
  } = useGoiYSocket();

  // Tạo QR khi mở modal
  useEffect(() => {
    if (isOpen && tinDangId && phongId) {
      createQR();
    }

    return () => {
      if (qrData?.maQR) {
        unsubscribe();
      }
    };
  }, [isOpen, tinDangId, phongId]);

  // Subscribe socket khi có QR
  useEffect(() => {
    if (qrData?.maQR) {
      subscribe(qrData.maQR);
    }
  }, [qrData?.maQR, subscribe]);

  // Callback khi khách đồng ý
  useEffect(() => {
    if (trangThai === QR_STATUS.DONG_Y && onSuccess) {
      onSuccess({
        maQR: qrData?.maQR,
        tinDangId,
        phongId,
        phanHoiLuc: phanHoi?.phanHoiLuc
      });
    }
  }, [trangThai, onSuccess, qrData, tinDangId, phongId, phanHoi]);

  const createQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await taoQRXemNgay({
        cuocHenId,
        tinDangId,
        phongId
      });

      if (response.success) {
        setQrData(response.data);
      } else {
        setError(response.message || 'Không thể tạo QR');
      }
    } catch (err) {
      console.error('[ModalQRXemNgay] Create QR error:', err);
      setError(err.message || 'Lỗi khi tạo QR');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = useCallback(() => {
    if (!qrData?.qrUrl) return;

    const fullUrl = `${window.location.origin}${qrData.qrUrl}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [qrData]);

  const handleRetry = () => {
    createQR();
  };

  // Tính thời gian tổng (30 phút = 1800 giây)
  const totalSeconds = 30 * 60;

  // Render trạng thái
  const renderStatus = () => {
    switch (trangThai) {
      case QR_STATUS.CHO_PHAN_HOI:
        return (
          <div className="qr-modal__status qr-modal__status--waiting">
            <WaitingDots size={10} />
            <span>Đang chờ khách phản hồi...</span>
          </div>
        );

      case QR_STATUS.DONG_Y:
        return (
          <motion.div 
            className="qr-modal__status qr-modal__status--success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <BouncingCheck size={48} />
            <h4>Khách đã đồng ý!</h4>
            <p>Khách hàng đã xác nhận muốn xem bất động sản này</p>
            <SuccessConfetti show={true} />
          </motion.div>
        );

      case QR_STATUS.TU_CHOI:
        return (
          <motion.div 
            className="qr-modal__status qr-modal__status--rejected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <ShakingX size={48} />
            <h4>Khách đã từ chối</h4>
            <p>Khách hàng không muốn xem bất động sản này</p>
          </motion.div>
        );

      case QR_STATUS.HET_HAN:
        return (
          <motion.div 
            className="qr-modal__status qr-modal__status--expired"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <HiOutlineClock size={48} />
            <h4>QR đã hết hạn</h4>
            <p>Mã QR đã hết hạn sau 30 phút</p>
            <button
              type="button"
              className="qr-modal__retry-btn"
              onClick={handleRetry}
            >
              <HiOutlineArrowPath size={18} />
              Tạo QR mới
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="qr-modal__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="qr-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="qr-modal__header">
            <h2 className="qr-modal__title">QR Xem Ngay</h2>
            <button
              type="button"
              className="qr-modal__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <HiOutlineXMark size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="qr-modal__content">
            {loading ? (
              <div className="qr-modal__loading">
                <SpinningLoader size={48} />
                <p>Đang tạo mã QR...</p>
              </div>
            ) : error ? (
              <div className="qr-modal__error">
                <HiOutlineXCircle size={48} />
                <p>{error}</p>
                <button
                  type="button"
                  className="qr-modal__retry-btn"
                  onClick={handleRetry}
                >
                  <HiOutlineArrowPath size={18} />
                  Thử lại
                </button>
              </div>
            ) : qrData ? (
              <>
                {/* QR Code */}
                <div className="qr-modal__qr-wrapper">
                  <div className={`qr-modal__qr-container ${trangThai !== QR_STATUS.CHO_PHAN_HOI ? 'qr-modal__qr-container--disabled' : ''}`}>
                    <QRCodeSVG
                      value={`${window.location.origin}${qrData.qrUrl}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="white"
                      fgColor="#1f2937"
                    />
                    
                    {/* Overlay khi không còn chờ */}
                    {trangThai !== QR_STATUS.CHO_PHAN_HOI && (
                      <div className="qr-modal__qr-overlay">
                        {trangThai === QR_STATUS.DONG_Y && <HiOutlineCheckCircle size={64} />}
                        {trangThai === QR_STATUS.TU_CHOI && <HiOutlineXCircle size={64} />}
                        {trangThai === QR_STATUS.HET_HAN && <HiOutlineClock size={64} />}
                      </div>
                    )}
                  </div>

                  {/* Countdown */}
                  {trangThai === QR_STATUS.CHO_PHAN_HOI && (
                    <div className="qr-modal__countdown">
                      <CountdownCircle
                        seconds={thoiGianConLai}
                        totalSeconds={totalSeconds}
                        size={70}
                        strokeWidth={5}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                {renderStatus()}

                {/* Room Info */}
                <div className="qr-modal__room-info">
                  <div className="qr-modal__room-header">
                    <HiOutlineHome size={20} />
                    <span>Thông tin phòng</span>
                  </div>
                  <div className="qr-modal__room-details">
                    <p className="qr-modal__room-name">
                      {phongInfo?.TenPhong || qrData?.thongTinPhong?.TenPhong}
                    </p>
                    <p className="qr-modal__room-meta">
                      <span>
                        <HiOutlineCurrencyDollar size={14} />
                        {formatCurrency(phongInfo?.Gia || qrData?.thongTinPhong?.Gia)}
                      </span>
                    </p>
                    <p className="qr-modal__room-address">
                      <HiOutlineMapPin size={14} />
                      {tinDangInfo?.DiaChi || qrData?.thongTinPhong?.DiaChi}
                    </p>
                  </div>
                </div>

                {/* Copy Link */}
                {trangThai === QR_STATUS.CHO_PHAN_HOI && (
                  <button
                    type="button"
                    className={`qr-modal__copy-btn ${copied ? 'qr-modal__copy-btn--copied' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <HiOutlineCheckCircle size={18} />
                        Đã sao chép!
                      </>
                    ) : (
                      <>
                        <HiOutlineClipboardDocument size={18} />
                        Sao chép link
                      </>
                    )}
                  </button>
                )}

                {/* Instructions */}
                {trangThai === QR_STATUS.CHO_PHAN_HOI && (
                  <div className="qr-modal__instructions">
                    <p>Cho khách quét mã QR này để xem thông tin phòng</p>
                    <p>Bạn sẽ nhận thông báo khi khách phản hồi</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="qr-modal__footer">
            <button
              type="button"
              className="qr-modal__btn qr-modal__btn--secondary"
              onClick={onClose}
            >
              {trangThai === QR_STATUS.DONG_Y ? 'Đóng' : 'Hủy'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModalQRXemNgay;

