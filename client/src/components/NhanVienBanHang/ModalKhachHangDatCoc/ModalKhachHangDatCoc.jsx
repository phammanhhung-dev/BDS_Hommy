/**
 * Modal Khách hàng Đặt cọc
 * Cho phép NVBH tạo QR để khách hàng quét và đặt cọc
 * 
 * Flow:
 * 1. Chọn số tháng hợp đồng (từ BangHoaHong)
 * 2. Hiển thị tiền cọc ước tính
 * 3. Tạo QR code
 * 4. Khách quét → xem hợp đồng → đồng ý
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineArrowLeft
} from 'react-icons/hi2';
import { taoQRDatCoc } from '../../../api/nhanVienBanHangApi';
import { useGoiYSocket, QR_STATUS } from '../../../hooks/useGoiYSocket';
import {
  SpinningLoader,
  WaitingDots,
  SuccessConfetti,
  CountdownCircle
} from '../AnimatedIcons';
import './ModalKhachHangDatCoc.css';

const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

// Parse bảng hoa hồng từ JSON
const parseBangHoaHong = (bangHoaHongRaw) => {
  try {
    if (!bangHoaHongRaw) return [];
    const parsed = typeof bangHoaHongRaw === 'string'
      ? JSON.parse(bangHoaHongRaw)
      : bangHoaHongRaw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.soThang)
      .map((item) => ({
        soThang: Number(item.soThang),
        tyLe: item.tyLe ?? null
      }))
      .filter((item) => !Number.isNaN(item.soThang) && item.soThang > 0)
      .sort((a, b) => a.soThang - b.soThang);
  } catch (error) {
    console.warn('[ModalKhachHangDatCoc] Không parse được BangHoaHong', error);
    return [];
  }
};

const STEPS = {
  CHON_THANG: 'CHON_THANG',
  QR_CODE: 'QR_CODE',
  THANH_CONG: 'THANH_CONG'
};

const ModalKhachHangDatCoc = ({
  isOpen,
  onClose,
  cuocHenId,
  appointment, // Thông tin cuộc hẹn với BangHoaHong, GiaPhong, PhongID, etc.
  onSuccess
}) => {
  // State cho steps
  const [currentStep, setCurrentStep] = useState(STEPS.CHON_THANG);
  
  // State cho step 1: Chọn tháng
  const [soThangKy, setSoThangKy] = useState(null);
  const [bangHoaHongOptions, setBangHoaHongOptions] = useState([]);
  
  // State cho step 2: QR Code
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const autoCloseTimeoutRef = useRef(null);
  
  // State cho step 3: Thành công
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(5);

  // Socket hook để theo dõi trạng thái
  const {
    trangThai,
    thoiGianConLai,
    phanHoi,
    isWaiting,
    subscribe,
    unsubscribe
  } = useGoiYSocket();

  // Parse bảng hoa hồng khi mở modal
  useEffect(() => {
    if (isOpen && appointment?.BangHoaHong) {
      const options = parseBangHoaHong(appointment.BangHoaHong);
      setBangHoaHongOptions(options);
      
      // Mặc định chọn số tháng tối thiểu hoặc giá trị đầu tiên
      const soThangToiThieu = appointment.SoThangCocToiThieu || (options[0]?.soThang) || 1;
      setSoThangKy(soThangToiThieu);
    }
  }, [isOpen, appointment]);

  // Reset khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(STEPS.CHON_THANG);
      setQrData(null);
      setError(null);
      setSoThangKy(null);
      setCopied(false);
      if (qrData?.maQR) {
        unsubscribe();
      }
    }
  }, [isOpen]);

  // Subscribe socket khi có QR
  useEffect(() => {
    if (qrData?.maQR) {
      subscribe(qrData.maQR);
    }
  }, [qrData?.maQR, subscribe]);

  // Chuyển sang step THANH_CONG khi khách đồng ý
  useEffect(() => {
    if (trangThai === QR_STATUS.DONG_Y && currentStep === STEPS.QR_CODE) {
      setCurrentStep(STEPS.THANH_CONG);
      setAutoCloseCountdown(5);
    }
  }, [trangThai, currentStep]);

  // Countdown và tự động đóng sau 5s khi ở step THANH_CONG
  useEffect(() => {
    if (currentStep === STEPS.THANH_CONG && autoCloseCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoCloseCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Khi countdown về 0, gọi onSuccess
    if (currentStep === STEPS.THANH_CONG && autoCloseCountdown === 0 && onSuccess) {
      onSuccess({
        maQR: qrData?.maQR,
        cuocHenId,
        phongId: appointment?.PhongID,
        soThangKy,
        phanHoiLuc: phanHoi?.phanHoiLuc
      });
    }
  }, [currentStep, autoCloseCountdown, onSuccess, qrData, cuocHenId, appointment, soThangKy, phanHoi]);

  const handleClose = () => {
    // Nếu đang ở step thành công, gọi onSuccess ngay thay vì chờ countdown
    if (currentStep === STEPS.THANH_CONG && onSuccess) {
      onSuccess({
        maQR: qrData?.maQR,
        cuocHenId,
        phongId: appointment?.PhongID,
        soThangKy,
        phanHoiLuc: phanHoi?.phanHoiLuc
      });
      return;
    }

    onClose();
  };

  // Tính tiền cọc ước tính (dựa trên số tháng cọc tối thiểu của dự án)
  const tinhTienCocUocTinh = () => {
    const giaPhong = Number(appointment?.GiaPhong) || Number(appointment?.GiaChuanPhong) || 0;
    const soThangCocToiThieu = Number(appointment?.SoThangCocToiThieu) || 1;
    return giaPhong * soThangCocToiThieu;
  };

  // Tìm tỷ lệ hoa hồng theo số tháng đã chọn
  const getTyLeHoaHong = () => {
    if (!soThangKy || bangHoaHongOptions.length === 0) return null;
    
    // Tìm mức hoa hồng phù hợp (soThangKy >= soThang trong bảng)
    const sortedBang = [...bangHoaHongOptions].sort((a, b) => b.soThang - a.soThang);
    for (const muc of sortedBang) {
      if (soThangKy >= muc.soThang) {
        return muc.tyLe;
      }
    }
    return null;
  };

  // Tạo QR đặt cọc
  const createQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        cuocHenId,
        tinDangId: appointment?.TinDangID,
        phongId: appointment?.PhongID,
        soThangKy,
        soTienCoc: tinhTienCocUocTinh()
      };

      console.log('[ModalKhachHangDatCoc] Creating QR with payload:', payload);

      const response = await taoQRDatCoc(payload);

      if (response.success) {
        setQrData(response.data);
        setCurrentStep(STEPS.QR_CODE);
      } else {
        setError(response.message || 'Không thể tạo QR');
      }
    } catch (err) {
      console.error('[ModalKhachHangDatCoc] Create QR error:', err);
      setError(err.message || 'Lỗi khi tạo QR đặt cọc');
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

  const handleBack = () => {
    if (currentStep === STEPS.QR_CODE) {
      setCurrentStep(STEPS.CHON_THANG);
      setQrData(null);
      setError(null);
      if (qrData?.maQR) {
        unsubscribe();
      }
    }
  };

  const handleNext = () => {
    if (currentStep === STEPS.CHON_THANG) {
      createQR();
    }
  };

  // Tính thời gian tổng (30 phút = 1800 giây)
  const totalSeconds = 30 * 60;

  // Render trạng thái QR
  const renderQRStatus = () => {
    switch (trangThai) {
      case QR_STATUS.CHO_PHAN_HOI:
        return (
          <div className="modal-dat-coc__status modal-dat-coc__status--waiting">
            <WaitingDots size={10} />
            <span>Đang chờ khách hàng quét mã và đồng ý...</span>
          </div>
        );

      case QR_STATUS.DONG_Y:
        return (
          <div className="modal-dat-coc__status modal-dat-coc__status--success">
            <SuccessConfetti />
            <HiOutlineCheckCircle size={24} />
            <div className="modal-dat-coc__status-text">
              <span>Khách hàng đã đồng ý đặt cọc thành công.</span>
              <span className="modal-dat-coc__status-subtext">
                Cửa sổ sẽ tự đóng sau 5 giây hoặc bạn có thể đóng ngay.
              </span>
            </div>
          </div>
        );

      case QR_STATUS.TU_CHOI:
        return (
          <div className="modal-dat-coc__status modal-dat-coc__status--rejected">
            <HiOutlineXCircle size={24} />
            <span>Khách hàng đã từ chối</span>
          </div>
        );

      case QR_STATUS.HET_HAN:
        return (
          <div className="modal-dat-coc__status modal-dat-coc__status--expired">
            <HiOutlineClock size={24} />
            <span>Mã QR đã hết hạn</span>
            <button
              type="button"
              className="modal-dat-coc__retry-btn"
              onClick={handleRetry}
            >
              <HiOutlineArrowPath size={18} />
              Tạo mã mới
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-dat-coc__overlay" onClick={onClose}>
      <div 
        className="modal-dat-coc__container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-dat-coc__header">
          <h2>
            <HiOutlineCurrencyDollar />
            Khách hàng Đặt cọc
          </h2>
          <button
            type="button"
            className="modal-dat-coc__close-btn"
            onClick={handleClose}
            aria-label="Đóng"
          >
            <HiOutlineXMark size={24} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="modal-dat-coc__steps">
          <div className={`modal-dat-coc__step ${currentStep === STEPS.CHON_THANG ? 'modal-dat-coc__step--active' : ''} ${[STEPS.QR_CODE, STEPS.THANH_CONG].includes(currentStep) ? 'modal-dat-coc__step--completed' : ''}`}>
            <span className="modal-dat-coc__step-number">1</span>
            <span className="modal-dat-coc__step-label">Chọn số tháng</span>
          </div>
          <div className="modal-dat-coc__step-connector" />
          <div className={`modal-dat-coc__step ${currentStep === STEPS.QR_CODE ? 'modal-dat-coc__step--active' : ''} ${currentStep === STEPS.THANH_CONG ? 'modal-dat-coc__step--completed' : ''}`}>
            <span className="modal-dat-coc__step-number">2</span>
            <span className="modal-dat-coc__step-label">Quét QR đặt cọc</span>
          </div>
          <div className="modal-dat-coc__step-connector" />
          <div className={`modal-dat-coc__step ${currentStep === STEPS.THANH_CONG ? 'modal-dat-coc__step--active' : ''}`}>
            <span className="modal-dat-coc__step-number">
              <HiOutlineCheckCircle size={18} />
            </span>
            <span className="modal-dat-coc__step-label">Hoàn tất</span>
          </div>
        </div>

        {/* Content */}
        <div className="modal-dat-coc__content">
          {currentStep === STEPS.CHON_THANG && (
            <div className="modal-dat-coc__step-content">
              {/* Thông tin phòng */}
              <div className="modal-dat-coc__room-info">
                <h3>Thông tin phòng</h3>
                <div className="modal-dat-coc__room-details">
                  <div className="modal-dat-coc__room-row">
                    <span>Phòng:</span>
                    <strong>{appointment?.TieuDePhong || appointment?.TenPhong || 'N/A'}</strong>
                  </div>
                  <div className="modal-dat-coc__room-row">
                    <span>Giá thuê:</span>
                    <strong className="modal-dat-coc__price">{formatCurrency(appointment?.GiaPhong)}/tháng</strong>
                  </div>
                  <div className="modal-dat-coc__room-row">
                    <span>Số tháng cọc tối thiểu:</span>
                    <strong>{appointment?.SoThangCocToiThieu || 1} tháng</strong>
                  </div>
                </div>
              </div>

              {/* Chọn số tháng hợp đồng */}
              <div className="modal-dat-coc__month-select">
                <h3>Chọn số tháng ký hợp đồng</h3>
                {bangHoaHongOptions.length > 0 ? (
                  <div className="modal-dat-coc__month-options">
                    {bangHoaHongOptions.map((option) => (
                      <button
                        key={option.soThang}
                        type="button"
                        className={`modal-dat-coc__month-option ${soThangKy === option.soThang ? 'modal-dat-coc__month-option--selected' : ''}`}
                        onClick={() => setSoThangKy(option.soThang)}
                      >
                        <span className="modal-dat-coc__month-value">{option.soThang}</span>
                        <span className="modal-dat-coc__month-label">tháng</span>
                        {option.tyLe && (
                          <span className="modal-dat-coc__month-commission">
                            Hoa hồng: {option.tyLe}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="modal-dat-coc__month-input">
                    <label>Số tháng hợp đồng:</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={soThangKy || 1}
                      onChange={(e) => setSoThangKy(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Tiền cọc ước tính */}
              <div className="modal-dat-coc__estimate">
                <h3>Tiền cọc ước tính</h3>
                <div className="modal-dat-coc__estimate-details">
                  <div className="modal-dat-coc__estimate-row">
                    <span>Giá phòng × Số tháng cọc tối thiểu:</span>
                    <span>
                      {formatCurrency(appointment?.GiaPhong || appointment?.GiaChuanPhong)} × {appointment?.SoThangCocToiThieu || 1}
                    </span>
                  </div>
                  <div className="modal-dat-coc__estimate-total">
                    <span>Tổng tiền cọc:</span>
                    <strong>{formatCurrency(tinhTienCocUocTinh())}</strong>
                  </div>
                  {getTyLeHoaHong() && (
                    <div className="modal-dat-coc__estimate-commission">
                      <span>Tỷ lệ hoa hồng (ký {soThangKy} tháng):</span>
                      <span className="modal-dat-coc__commission-badge">{getTyLeHoaHong()}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.QR_CODE && (
            <div className="modal-dat-coc__step-content">
              {loading ? (
                <div className="modal-dat-coc__loading">
                  <SpinningLoader size={48} />
                  <p>Đang tạo mã QR đặt cọc...</p>
                </div>
              ) : error ? (
                <div className="modal-dat-coc__error">
                  <HiOutlineXCircle size={48} />
                  <p>{error}</p>
                  <button
                    type="button"
                    className="modal-dat-coc__retry-btn"
                    onClick={handleRetry}
                  >
                    <HiOutlineArrowPath size={18} />
                    Thử lại
                  </button>
                </div>
              ) : qrData ? (
                <>
                  {/* Thông tin tóm tắt */}
                  <div className="modal-dat-coc__summary">
                    <div className="modal-dat-coc__summary-item">
                      <span>Phòng:</span>
                      <strong>{appointment?.TieuDePhong || 'N/A'}</strong>
                    </div>
                    <div className="modal-dat-coc__summary-item">
                      <span>Số tháng ký:</span>
                      <strong>{soThangKy} tháng</strong>
                    </div>
                    <div className="modal-dat-coc__summary-item">
                      <span>Tiền cọc:</span>
                      <strong className="modal-dat-coc__price">{formatCurrency(tinhTienCocUocTinh())}</strong>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="modal-dat-coc__qr-wrapper">
                    <div className={`modal-dat-coc__qr-container ${trangThai !== QR_STATUS.CHO_PHAN_HOI ? 'modal-dat-coc__qr-container--disabled' : ''}`}>
                      <QRCodeSVG
                        value={`${window.location.origin}${qrData.qrUrl}`}
                        size={220}
                        level="H"
                        includeMargin={true}
                        bgColor="white"
                        fgColor="#1f2937"
                      />
                      
                      {/* Overlay khi không còn chờ */}
                      {trangThai !== QR_STATUS.CHO_PHAN_HOI && (
                        <div className="modal-dat-coc__qr-overlay">
                          {trangThai === QR_STATUS.DONG_Y && <HiOutlineCheckCircle size={64} />}
                          {trangThai === QR_STATUS.TU_CHOI && <HiOutlineXCircle size={64} />}
                          {trangThai === QR_STATUS.HET_HAN && <HiOutlineClock size={64} />}
                        </div>
                      )}
                    </div>

                    {/* Countdown */}
                    {trangThai === QR_STATUS.CHO_PHAN_HOI && (
                      <div className="modal-dat-coc__countdown">
                        <CountdownCircle 
                          remaining={thoiGianConLai} 
                          total={totalSeconds}
                          size={60}
                        />
                        <span className="modal-dat-coc__countdown-text">
                          Còn lại: {Math.floor(thoiGianConLai / 60)}:{String(thoiGianConLai % 60).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Copy link */}
                  <div className="modal-dat-coc__actions-copy">
                    <button
                      type="button"
                      className="modal-dat-coc__copy-btn"
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
                  </div>

                  {/* Status */}
                  {renderQRStatus()}

                  {/* Hướng dẫn */}
                  <div className="modal-dat-coc__instructions">
                    <HiOutlineDocumentText size={20} />
                    <p>
                      Khách hàng quét mã QR sẽ được xem hợp đồng cọc đã điền đầy đủ thông tin.
                      Sau khi đồng ý, tiền cọc sẽ được trừ từ ví của khách hàng.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {currentStep === STEPS.THANH_CONG && (
            <div className="modal-dat-coc__step-content modal-dat-coc__success-step">
              <div className="modal-dat-coc__success-icon">
                <SuccessConfetti />
                <HiOutlineCheckCircle size={80} />
              </div>
              
              <h3 className="modal-dat-coc__success-title">Đặt cọc thành công!</h3>
              
              <p className="modal-dat-coc__success-message">
                Khách hàng đã đồng ý và hoàn tất đặt cọc cho phòng này.
              </p>
              
              <div className="modal-dat-coc__success-details">
                <div className="modal-dat-coc__success-row">
                  <span>Phòng:</span>
                  <strong>{appointment?.TieuDePhong || appointment?.TenPhong || 'N/A'}</strong>
                </div>
                <div className="modal-dat-coc__success-row">
                  <span>Số tháng ký hợp đồng:</span>
                  <strong>{soThangKy} tháng</strong>
                </div>
                <div className="modal-dat-coc__success-row">
                  <span>Tiền cọc:</span>
                  <strong className="modal-dat-coc__price">{formatCurrency(tinhTienCocUocTinh())}</strong>
                </div>
              </div>
              
              <div className="modal-dat-coc__auto-close-notice">
                <HiOutlineClock size={18} />
                <span>Cửa sổ sẽ tự đóng sau <strong>{autoCloseCountdown}</strong> giây...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-dat-coc__footer">
          {currentStep === STEPS.CHON_THANG && (
            <>
              <button
                type="button"
                className="modal-dat-coc__btn modal-dat-coc__btn--secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="modal-dat-coc__btn modal-dat-coc__btn--primary"
                onClick={handleNext}
                disabled={!soThangKy || loading}
              >
                {loading ? (
                  <>
                    <SpinningLoader size={18} />
                    Đang tạo QR...
                  </>
                ) : (
                  <>
                    Tiếp theo
                    <HiOutlineArrowRight size={18} />
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === STEPS.QR_CODE && (
            <>
              <button
                type="button"
                className="modal-dat-coc__btn modal-dat-coc__btn--secondary"
                onClick={handleBack}
                disabled={loading}
              >
                <HiOutlineArrowLeft size={18} />
                Quay lại
              </button>
              <button
                type="button"
                className="modal-dat-coc__btn modal-dat-coc__btn--primary"
                onClick={onClose}
              >
                Đóng
              </button>
            </>
          )}

          {currentStep === STEPS.THANH_CONG && (
            <button
              type="button"
              className="modal-dat-coc__btn modal-dat-coc__btn--success modal-dat-coc__btn--full"
              onClick={handleClose}
            >
              <HiOutlineCheckCircle size={18} />
              Đóng ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalKhachHangDatCoc;

