/**
 * Modal Gợi ý Phòng Khác
 * Wizard 3 bước: Lý do → Bộ lọc → Kết quả
 * Glassmorphism UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import { timKiemGoiY, layDanhSachKhuVuc } from '../../../api/nhanVienBanHangApi';
import StepLyDo from './StepLyDo';
import StepBoLoc from './StepBoLoc';
import StepKetQua from './StepKetQua';
import './ModalGoiYPhongKhac.css';

const STEPS = [
  { id: 1, title: 'Lý do', description: 'Chọn lý do khách không ưng ý' },
  { id: 2, title: 'Bộ lọc', description: 'Điều chỉnh tiêu chí tìm kiếm' },
  { id: 3, title: 'Kết quả', description: 'Chọn phòng để gợi ý' }
];

const ModalGoiYPhongKhac = ({
  isOpen,
  onClose,
  cuocHenId,
  tinDangHienTai,
  onViewDetail,
  onCreateQR
}) => {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [lyDo, setLyDo] = useState(null);
  const [ghiChu, setGhiChu] = useState('');
  const [filters, setFilters] = useState({
    khuVucId: null,
    giaMin: null,
    giaMax: null,
    dienTichMin: null,
    dienTichMax: null,
    tienIch: ''
  });
  const [khuVucList, setKhuVucList] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTinDang, setSelectedTinDang] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setLyDo(null);
      setGhiChu('');
      setFilters({
        khuVucId: tinDangHienTai?.KhuVucID || null,
        giaMin: null,
        giaMax: null,
        dienTichMin: null,
        dienTichMax: null,
        tienIch: ''
      });
      setResults([]);
      setSelectedTinDang(null);
      setError(null);
    }
  }, [isOpen, tinDangHienTai]);

  // Tự động set filters dựa trên lý do khi chọn lý do
  useEffect(() => {
    if (!lyDo || !tinDangHienTai || currentStep !== 1) return;

    const giaPhongHienTai = Number(tinDangHienTai.GiaPhong) || Number(tinDangHienTai.GiaChuanPhong) || 0;
    const dienTichHienTai = Number(tinDangHienTai.DienTich) || Number(tinDangHienTai.DienTichChuanPhong) || 0;

    setFilters(prevFilters => {
      let newFilters = { ...prevFilters };

      switch (lyDo) {
        case 'gia_cao':
          // Lý do "Giá cao quá" → lọc phòng RẺ HƠN
          // Set giaMax = giá hiện tại * 0.95 (giảm 5%) để có buffer hợp lý
          if (giaPhongHienTai > 0) {
            newFilters.giaMax = Math.floor(giaPhongHienTai * 0.95);
            newFilters.giaMin = null; // Không giới hạn giá tối thiểu
          }
          break;

        case 'dien_tich_nho':
          // Lý do "Diện tích nhỏ" → lọc phòng RỘNG HƠN
          // Set dienTichMin = diện tích hiện tại + 2m² để có buffer hợp lý
          if (dienTichHienTai > 0) {
            newFilters.dienTichMin = Math.ceil(dienTichHienTai + 2);
            newFilters.dienTichMax = null; // Không giới hạn diện tích tối đa
          }
          break;

        case 'vi_tri':
          // Lý do "Vị trí không phù hợp" → giữ nguyên khuVucId (người dùng tự chọn)
          // Không tự động set, để người dùng chọn khu vực khác
          break;

        case 'tien_ich':
          // Lý do "Thiếu tiện ích" → giữ nguyên tienIch (người dùng tự chọn)
          // Không tự động set, để người dùng chọn tiện ích
          break;

        case 'tinh_trang_phong':
        case 'khac':
          // Lý do "Tình trạng phòng" hoặc "Khác" → không có filter cụ thể
          // Chỉ dựa vào ghi chú
          break;

        default:
          break;
      }

      return newFilters;
    });
  }, [lyDo, tinDangHienTai, currentStep]); // Chỉ chạy khi lyDo, tinDangHienTai hoặc currentStep thay đổi

  // Tìm kiếm khi vào step 3
  const doSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await timKiemGoiY({
        cuocHenId,
        ...filters,
        limit: 20
      });

      if (response.success) {
        setResults(response.data.tinDangList || []);
        setKhuVucList(response.data.khuVucList || []);
      } else {
        setError(response.message || 'Lỗi khi tìm kiếm');
      }
    } catch (err) {
      console.error('[ModalGoiYPhongKhac] Search error:', err);
      setError(err.message || 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  }, [cuocHenId, filters]);

  // Fetch khu vực list khi mở modal hoặc vào step 2
  useEffect(() => {
    if (isOpen && currentStep >= 2) {
      const fetchKhuVuc = async () => {
        try {
          const response = await layDanhSachKhuVuc();
          if (response.success) {
            setKhuVucList(response.data || []);
            console.log('[ModalGoiYPhongKhac] Loaded khu vuc list:', response.data);
          }
        } catch (err) {
          console.error('[ModalGoiYPhongKhac] Error loading khu vuc:', err);
          // Không set error, chỉ log
        }
      };
      fetchKhuVuc();
    }
  }, [isOpen, currentStep]);

  // Fetch khu vực list khi vào step 2 (fallback nếu chưa load được)
  useEffect(() => {
    if (currentStep === 2 && khuVucList.length === 0) {
      // Fetch khu vực từ API chuyên dụng
      layDanhSachKhuVuc()
        .then((res) => {
          if (res.success && res.data) {
            setKhuVucList(res.data);
            console.log('[ModalGoiYPhongKhac] Loaded khu vuc list from API:', res.data);
          }
        })
        .catch((err) => {
          console.error('[ModalGoiYPhongKhac] Error loading khu vuc:', err);
        });
    }
  }, [currentStep, khuVucList.length]);

  // Auto search khi vào step 3
  useEffect(() => {
    if (currentStep === 3) {
      doSearch();
    }
  }, [currentStep, doSearch]);

  // Handlers
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSearch = () => {
    doSearch();
  };

  const canGoNext = () => {
    if (currentStep === 1) return !!lyDo;
    if (currentStep === 2) return true;
    return false;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepLyDo
            selectedLyDo={lyDo}
            onSelect={setLyDo}
            ghiChu={ghiChu}
            onGhiChuChange={setGhiChu}
          />
        );
      case 2:
        return (
          <StepBoLoc
            filters={filters}
            onChange={setFilters}
            khuVucList={khuVucList}
            lyDo={lyDo}
          />
        );
      case 3:
        return (
          <StepKetQua
            results={results}
            loading={loading}
            error={error}
            selectedTinDang={selectedTinDang}
            onSelectTinDang={setSelectedTinDang}
            onViewDetail={onViewDetail}
            onCreateQR={onCreateQR}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-goiy-phong-khac__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-goiy-phong-khac"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-goiy-phong-khac__header">
            <div className="modal-goiy-phong-khac__header-content">
              <h2 className="modal-goiy-phong-khac__title">Gợi ý phòng khác</h2>
              <p className="modal-goiy-phong-khac__subtitle">
                {STEPS[currentStep - 1].description}
              </p>
            </div>
            <button
              type="button"
              className="modal-goiy-phong-khac__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <HiOutlineXMark size={24} />
            </button>
          </div>

          {/* Progress */}
          <div className="modal-goiy-phong-khac__progress">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`modal-goiy-phong-khac__step ${
                  currentStep === step.id ? 'modal-goiy-phong-khac__step--active' : ''
                } ${currentStep > step.id ? 'modal-goiy-phong-khac__step--completed' : ''}`}
              >
                <div className="modal-goiy-phong-khac__step-number">
                  {currentStep > step.id ? (
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span className="modal-goiy-phong-khac__step-title">{step.title}</span>
                {index < STEPS.length - 1 && (
                  <div className="modal-goiy-phong-khac__step-connector" />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="modal-goiy-phong-khac__content">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="modal-goiy-phong-khac__footer">
            {currentStep > 1 && (
              <button
                type="button"
                className="modal-goiy-phong-khac__btn modal-goiy-phong-khac__btn--secondary"
                onClick={handleBack}
              >
                <HiOutlineArrowLeft size={18} />
                Quay lại
              </button>
            )}

            <div className="modal-goiy-phong-khac__footer-spacer" />

            {currentStep === 3 && (
              <button
                type="button"
                className="modal-goiy-phong-khac__btn modal-goiy-phong-khac__btn--secondary"
                onClick={handleSearch}
                disabled={loading}
              >
                <HiOutlineMagnifyingGlass size={18} />
                Tìm lại
              </button>
            )}

            {currentStep < 3 && (
              <button
                type="button"
                className="modal-goiy-phong-khac__btn modal-goiy-phong-khac__btn--primary"
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                Tiếp theo
                <HiOutlineArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModalGoiYPhongKhac;

