import React, { useMemo, useState, useEffect } from 'react';
import OCRServiceV2 from '../../services/OCRServiceV2';
import QRCodeService from '../../services/QRCodeService';
import DebugImageProcessingService from '../../services/DebugImageProcessingService';
import ImageProcessingService from '../../services/ImageProcessingService';

// Default QR regions - đồng bộ với XacThucKYC.jsx
const DEFAULT_QR_REGIONS = {
  full: { x: 0, y: 0, width: 1, height: 1 },
  trl: { x: 0.6943596950212068, y: 0, width: 0.28, height: 0.38 },
  trm: { x: 0.7239388609855822, y: 0.0003052771011813199, width: 0.24, height: 0.33 },
  trs: { x: 0.7688202812287943, y: 0.046528110505082154, width: 0.15, height: 0.23 },
  tc: { x: 0.7450600625148778, y: 0, width: 0.2, height: 0.3 }
};

// Lấy trực tiếp từ OCRServiceV2.CCCD_ROI để luôn đồng bộ
const getDefaultPayload = () => ({
  ocr: { ...OCRServiceV2.CCCD_ROI },
  qrRegions: DEFAULT_QR_REGIONS
});

const styles = {
  page: { padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' },
  card: { background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  label: { display: 'block', fontWeight: 600, marginBottom: 6 },
  textarea: { width: '100%', minHeight: '260px', fontFamily: 'Consolas, monospace', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db', padding: 10 },
  btn: { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  btnGhost: { padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' },
  status: { background: '#0f172a', color: '#e2e8f0', padding: '10px 12px', borderRadius: 8, fontFamily: 'Consolas, monospace', fontSize: 12 }
};

const VisionOverlay = ({ image, ocr, qr }) => {
  const boxes = [
    { key: 'soCCCD', label: '1. OCR: Số', roi: ocr?.soCCCD, type: 'ocr' },
    { key: 'tenDayDu', label: '2. OCR: Họ tên', roi: ocr?.tenDayDu, type: 'ocr' },
    { key: 'ngaySinh', label: '3. OCR: Ngày sinh', roi: ocr?.ngaySinh, type: 'ocr' },
    { key: 'gioiTinh', label: '4. OCR: Giới tính', roi: ocr?.gioiTinh, type: 'ocr' },
    { key: 'diaChi', label: '5. OCR: Địa chỉ', roi: ocr?.diaChi, type: 'ocr' },
    { key: 'faceImage', label: '6. OCR: Face ROI', roi: ocr?.faceImage, type: 'ocr' },
    { key: 'qrCode', label: '7. OCR: QR slot', roi: ocr?.qrCode, type: 'ocr' },
    { key: 'qr-full', label: 'A. QR full', roi: qr?.full, type: 'qr' },
    { key: 'qr-trl', label: 'B. QR top-right large', roi: qr?.trl, type: 'qr' },
    { key: 'qr-trm', label: 'C. QR top-right medium', roi: qr?.trm, type: 'qr' },
    { key: 'qr-trs', label: 'D. QR top-right small', roi: qr?.trs, type: 'qr' },
    { key: 'qr-tc', label: 'E. QR top-center', roi: qr?.tc, type: 'qr' }
  ].filter(b => b.roi);

  const boxStyle = (roi, type) => ({
    position: 'absolute',
    left: `${roi.x * 100}%`,
    top: `${roi.y * 100}%`,
    width: `${roi.width * 100}%`,
    height: `${roi.height * 100}%`,
    border: `2px dashed ${type === 'ocr' ? '#0ea5e9' : '#f97316'}`,
    borderRadius: '8px',
    boxSizing: 'border-box'
  });

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '63%', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundImage: `url(${image})`, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {boxes.map((b, idx) => (
        <div key={b.key} style={{ ...boxStyle(b.roi, b.type), pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute',
            top: -10,
            left: -10,
            background: b.type === 'ocr' ? '#0ea5e9' : '#f97316',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700
          }}>
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const KycDebugPlayground = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [qrOnlySrc, setQrOnlySrc] = useState(null);
  const [roiText, setRoiText] = useState(JSON.stringify(getDefaultPayload(), null, 2));
  const [status, setStatus] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [qrOnlyResult, setQrOnlyResult] = useState(null);
  const [merged, setMerged] = useState(null);
  const [error, setError] = useState(null);
  const [qrOnlyStatus, setQrOnlyStatus] = useState('');
  const [qrOnlyError, setQrOnlyError] = useState(null);
  
  // Advanced Image Processing states
  const [useEnhancedProcessing, setUseEnhancedProcessing] = useState(true);
  const [xiaomiStyleOnly, setXiaomiStyleOnly] = useState(false); // Chỉ dùng B/C, không binarize
  const [xiaomiPlusPureBlack, setXiaomiPlusPureBlack] = useState(true); // Xiaomi B/C + Pure Black filter
  const [processedPreviews, setProcessedPreviews] = useState(null);
  const [processingParams, setProcessingParams] = useState({
    // Xiaomi HyperOS 3.0 style (giá trị tối ưu từ test thực tế)
    exposure: 100,         // Exposure: -100 to 100 (Xiaomi: 100)
    brightness: 60,        // Brightness: -100 to 100 (Xiaomi: 60)
    contrast: 50,          // Contrast: -100 to 100 (Xiaomi: 50)
    // Pure Black filter (max <= 30 && delta <= 8)
    maxThreshold: 30,      // max(R,G,B) <= này
    deltaThreshold: 8,     // (max - min) <= này
    applyBrightnessFirst: true, // Áp dụng B/C trước khi extract màu
    // Black text extraction
    blackThreshold: 120,   // V < này = pixel đen
    saturationThreshold: 100, // S < này = pixel xám/đen
    blurSize: 3,
    morphKernel: 2,
    useOtsu: true
  });
  const [opencvLoaded, setOpencvLoaded] = useState(false);

  // Load OpenCV on mount
  useEffect(() => {
    ImageProcessingService.loadOpenCV().then(loaded => {
      setOpencvLoaded(loaded);
      console.log('🔧 OpenCV loaded:', loaded);
    });
  }, []);

  const parsedRoi = useMemo(() => {
    try {
      return JSON.parse(roiText);
    } catch (e) {
      return null;
    }
  }, [roiText]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
      setProcessedPreviews(null); // Reset previews khi upload ảnh mới
    };
    reader.readAsDataURL(file);
  };

  // Test tất cả presets và hiển thị preview
  const testPreprocessing = async () => {
    if (!imageSrc) {
      setError('Chưa có ảnh');
      return;
    }
    setStatus('Đang test preprocessing...');
    try {
      const results = await DebugImageProcessingService.testAllPresets(imageSrc);
      setProcessedPreviews(results);
      setStatus('Hoàn tất test preprocessing');
    } catch (e) {
      setError(e.message);
      setStatus('');
    }
  };

  // Test với custom params từ sliders
  const testCustomParams = async () => {
    if (!imageSrc) {
      setError('Chưa có ảnh');
      return;
    }
    setStatus('Đang test với custom params...');
    console.log('🔧 [Debug] Custom params:', processingParams);
    try {
      const processedOCR = await DebugImageProcessingService.processForOCR(imageSrc, {
        ...processingParams,
        debug: true
      });
      const processedQR = await DebugImageProcessingService.processForQR(imageSrc, {
        blackThreshold: processingParams.blackThreshold + 20,
        saturationThreshold: processingParams.saturationThreshold + 30,
        blurSize: 1,
        sharpen: true,
        debug: true
      });
      
      // Thêm preview chỉ với Brightness/Contrast (không binarize) để xem ảnh màu đã adjust
      const brightnessOnly = await DebugImageProcessingService.adjustBrightnessContrast(imageSrc, {
        exposure: processingParams.exposure,
        brightness: processingParams.brightness,
        contrast: processingParams.contrast,
        debug: true
      });
      
      setProcessedPreviews({
        raw: imageSrc,
        brightnessOnly: brightnessOnly, // Ảnh màu đã adjust B/C - dùng cho face
        customOCR: processedOCR,        // Ảnh binary cho OCR
        customQR: processedQR           // Ảnh binary cho QR
      });
      setStatus('Hoàn tất test custom params');
    } catch (e) {
      console.error('Test custom params error:', e);
      setError(e.message);
      setStatus('');
    }
  };

  const handleQrOnlyFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setQrOnlySrc(reader.result);
    reader.readAsDataURL(file);
    setQrOnlyResult(null);
    setQrOnlyError(null);
    setQrOnlyStatus('');
  };

  const runAll = async () => {
    if (!imageSrc) {
      setError('Chưa có ảnh CCCD mặt trước');
      return;
    }
    if (!parsedRoi) {
      setError('ROI JSON không hợp lệ');
      return;
    }
    setError(null);
    setStatus('Warping + OCR...');
    try {
      // QUAN TRỌNG: Truyền parsedRoi.ocr làm roiOverrides (giống XacThucKYC.jsx)
      // recognizeAll sẽ merge: { ...OCRServiceV2.CCCD_ROI, ...roiOverrides }
      // Nhưng vì parsedRoi.ocr đã là bản copy đầy đủ nên nó sẽ thay thế hoàn toàn
      const ocrRoiConfig = parsedRoi.ocr || {};
      console.log('🔧 [Debug] OCR ROI config:', ocrRoiConfig);
      console.log('🔧 [Debug] Enhanced processing:', useEnhancedProcessing);
      console.log('🔧 [Debug] Xiaomi style only:', xiaomiStyleOnly);
      console.log('🔧 [Debug] Xiaomi + Pure Black:', xiaomiPlusPureBlack);
      
      // Nếu bật enhanced processing, áp dụng xử lý ảnh
      let processedImage = imageSrc;
      if (useEnhancedProcessing) {
        if (xiaomiPlusPureBlack) {
          // Xiaomi B/C + Pure Black filter (max<=30 && delta<=8)
          setStatus('Đang tối ưu ảnh (Xiaomi + Pure Black Filter)...');
          processedImage = await DebugImageProcessingService.xiaomiPlusPureBlack(imageSrc, {
            exposure: processingParams.exposure,
            brightness: processingParams.brightness,
            contrast: processingParams.contrast,
            maxThreshold: processingParams.maxThreshold,
            deltaThreshold: processingParams.deltaThreshold,
            debug: true
          });
          console.log('🔧 [Debug] Image enhanced with Xiaomi + Pure Black');
        } else if (xiaomiStyleOnly) {
          // CHỈ tăng Brightness/Contrast (giữ nguyên màu, không binarize)
          setStatus('Đang tối ưu ảnh (Xiaomi Style: Exposure/Brightness/Contrast)...');
          processedImage = await DebugImageProcessingService.adjustBrightnessContrast(imageSrc, {
            exposure: processingParams.exposure,
            brightness: processingParams.brightness,
            contrast: processingParams.contrast,
            debug: true
          });
          console.log('🔧 [Debug] Image enhanced with Xiaomi style only (no binarize)');
        } else if (opencvLoaded) {
          // Full pipeline: B/C + Black text extraction + Binarize
          setStatus('Đang tối ưu ảnh (Full Pipeline: B/C + Binarize)...');
          processedImage = await DebugImageProcessingService.processForOCR(imageSrc, {
            ...processingParams,
            debug: true
          });
          console.log('🔧 [Debug] Image enhanced with full pipeline');
        }
      }
      
      setStatus('Warping + OCR...');
      const ocr = await OCRServiceV2.recognizeAll(processedImage, ocrRoiConfig);
      setOcrResult(ocr);
      const warped = ocr.warpedImage || imageSrc;
      console.log('🔧 [Debug] Warp success:', !!ocr.warpedImage);
      setStatus('Scanning QR...');

      // Xử lý QR
      let qrImage = warped;
      if (useEnhancedProcessing) {
        if (xiaomiStyleOnly) {
          // CHỈ tăng B/C cho QR
          qrImage = await DebugImageProcessingService.adjustBrightnessContrast(warped, {
            exposure: processingParams.exposure,
            brightness: processingParams.brightness,
            contrast: processingParams.contrast,
            debug: true
          });
        } else if (opencvLoaded) {
          // Full pipeline cho QR
          setStatus('Đang tối ưu ảnh cho QR...');
          qrImage = await DebugImageProcessingService.processForQR(warped, {
            ...DebugImageProcessingService.presets.qrCode,
            debug: true
          });
        }
      }

      const baseQrRegions = parsedRoi.qrRegions
        ? Object.entries(parsedRoi.qrRegions).map(([name, roi]) => ({ name, ...roi }))
        : [];
      const qrSlot = ocrRoiConfig.qrCode;
      const qrRegions = qrSlot
        ? [{ name: 'slot', ...qrSlot }, ...baseQrRegions]
        : baseQrRegions;
      console.log('🔧 [Debug] QR regions:', qrRegions.map(r => r.name));
      
      // Thử cả 2: ảnh gốc và ảnh đã xử lý
      let qr = await QRCodeService.scanFromImage(warped, qrRegions);
      if (!qr.success && useEnhancedProcessing) {
        console.log('🔧 [Debug] QR failed on original, trying enhanced...');
        qr = await QRCodeService.scanFromImage(qrImage, qrRegions);
      }
      setQrResult(qr);

      setStatus('Merging...');
      const mergedRes = QRCodeService.mergeAndValidate(qr.success ? qr.data : null, ocr, 0.5);
      setMerged(mergedRes);
      setStatus('Hoàn tất.');
    } catch (e) {
      console.error('🔧 [Debug] Error:', e);
      setError(e.message || 'Lỗi xử lý');
      setStatus('');
    }
  };

  const copyPayload = () => {
    if (!merged?.finalData) return;
    const payload = {
      ...merged.finalData,
      sources: merged.sources,
      confidence: merged.confidence,
      qrSuccess: qrResult?.success,
      qrAttempts: qrResult?.attempts
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setStatus('Đã copy payload trích xuất.');
  };

  const decodeQrOnly = async () => {
    if (!qrOnlySrc) {
      setQrOnlyError('Chưa có ảnh QR');
      return;
    }
    setQrOnlyError(null);
    setQrOnlyStatus('Đang quét QR riêng (jsQR full-image)...');
    try {
      const qr = await QRCodeService.scanRawFromImage(qrOnlySrc);
      setQrOnlyResult(qr);
      setQrOnlyStatus(qr.success ? '✅ Đã quét QR riêng' : '❌ Không tìm thấy QR (raw)');
    } catch (e) {
      setQrOnlyError(e.message || 'Lỗi quét QR');
      setQrOnlyStatus('');
    }
  };

  return (
    <div style={styles.page}>
      <h2>🔬 ROI / QR Debug Playground</h2>
      <p>Upload mặt trước CCCD, dán ROI JSON (từ nút Copy ROI JSON), chạy OCR + QR để xem ngay giá trị và payload gửi đi.</p>
      
      {/* OpenCV Status */}
      <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: opencvLoaded ? '#dcfce7' : '#fef3c7', color: opencvLoaded ? '#166534' : '#92400e' }}>
        {opencvLoaded ? '✅ OpenCV.js loaded - Enhanced processing available' : '⏳ Loading OpenCV.js...'}
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <label style={styles.label}>1) Ảnh CCCD</label>
          <input type="file" accept="image/*" onChange={handleFile} />
          {imageSrc && <img src={imageSrc} alt="preview" style={{ width: '100%', marginTop: 12, borderRadius: 10 }} />}
        </div>

        <div style={styles.card}>
          <label style={styles.label}>2) ROI JSON (OCR + qrRegions)</label>
          <textarea
            style={styles.textarea}
            value={roiText}
            onChange={(e) => setRoiText(e.target.value)}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={styles.btn} onClick={runAll}>Chạy OCR + QR</button>
            <button style={styles.btnGhost} onClick={() => setRoiText(JSON.stringify(getDefaultPayload(), null, 2))}>Reset ROI mặc định</button>
            <button style={{ ...styles.btnGhost, background: '#fef3c7' }} onClick={testPreprocessing}>Test Preprocessing</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={styles.status}>
              {status || 'Nhấn "Chạy" để bắt đầu.'}
              {error && ` | Lỗi: ${error}`}
            </div>
            {!parsedRoi && <div style={{ color: '#b91c1c', marginTop: 6 }}>JSON không hợp lệ.</div>}
          </div>
        </div>
      </div>

      {/* Enhanced Processing Controls */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3>🎨 Black Text Extraction (Tối ưu cho CCCD)</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          Tận dụng đặc điểm: Text và QR trên CCCD luôn là MÀU ĐEN, nền có màu sắc.
          Thuật toán sẽ trích xuất pixel đen và loại bỏ watermark/nền màu.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useEnhancedProcessing}
              onChange={(e) => setUseEnhancedProcessing(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Bật Enhanced Processing</span>
          </label>
          
          {useEnhancedProcessing && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: xiaomiPlusPureBlack ? '#dbeafe' : '#f3f4f6', padding: '4px 12px', borderRadius: 6, border: xiaomiPlusPureBlack ? '2px solid #2563eb' : 'none' }}>
                <input
                  type="checkbox"
                  checked={xiaomiPlusPureBlack}
                  onChange={(e) => {
                    setXiaomiPlusPureBlack(e.target.checked);
                    if (e.target.checked) setXiaomiStyleOnly(false);
                  }}
                />
                <span style={{ fontWeight: 600, color: xiaomiPlusPureBlack ? '#1d4ed8' : '#374151' }}>📱⬛ Xiaomi + Pure Black</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: xiaomiStyleOnly ? '#dcfce7' : '#f3f4f6', padding: '4px 12px', borderRadius: 6, border: xiaomiStyleOnly ? '2px solid #16a34a' : 'none' }}>
                <input
                  type="checkbox"
                  checked={xiaomiStyleOnly}
                  onChange={(e) => {
                    setXiaomiStyleOnly(e.target.checked);
                    if (e.target.checked) setXiaomiPlusPureBlack(false);
                  }}
                />
                <span style={{ fontWeight: 600, color: xiaomiStyleOnly ? '#166534' : '#374151' }}>📱 Xiaomi Only (giữ màu)</span>
              </label>
            </>
          )}
          
          <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>
            OpenCV: {opencvLoaded ? '✅ Ready' : '⏳ Loading...'}
          </span>
        </div>

        {useEnhancedProcessing && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {/* === XIAOMI STYLE: Exposure/Brightness/Contrast === */}
            <div style={{ gridColumn: '1 / -1', background: xiaomiStyleOnly ? '#dcfce7' : '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 8, border: xiaomiStyleOnly ? '2px solid #16a34a' : 'none' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: xiaomiStyleOnly ? '#166534' : '#92400e' }}>
                📱 Xiaomi HyperOS Style (Exposure/Brightness/Contrast)
                {xiaomiStyleOnly && <span style={{ marginLeft: 8, fontSize: 12, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>ACTIVE</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Exposure</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={processingParams.exposure}
                    onChange={(e) => setProcessingParams(p => ({ ...p, exposure: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>{processingParams.exposure}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Brightness</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={processingParams.brightness}
                    onChange={(e) => setProcessingParams(p => ({ ...p, brightness: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>{processingParams.brightness}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Contrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={processingParams.contrast}
                    onChange={(e) => setProcessingParams(p => ({ ...p, contrast: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>{processingParams.contrast}</span>
                </div>
              </div>
              
              {/* Pure Black Filter params (chỉ hiển thị khi chọn Xiaomi + Pure Black) */}
              {xiaomiPlusPureBlack && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #93c5fd' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#1d4ed8', fontSize: 13 }}>
                    ⬛ Pure Black Filter: max ≤ {processingParams.maxThreshold} && delta ≤ {processingParams.deltaThreshold}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Max Threshold (max RGB ≤ này)</label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={processingParams.maxThreshold}
                        onChange={(e) => setProcessingParams(p => ({ ...p, maxThreshold: parseInt(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{processingParams.maxThreshold}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Delta Threshold (max-min ≤ này)</label>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={processingParams.deltaThreshold}
                        onChange={(e) => setProcessingParams(p => ({ ...p, deltaThreshold: parseInt(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{processingParams.deltaThreshold}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!xiaomiStyleOnly && !xiaomiPlusPureBlack && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={processingParams.applyBrightnessFirst}
                    onChange={(e) => setProcessingParams(p => ({ ...p, applyBrightnessFirst: e.target.checked }))}
                  />
                  <span style={{ fontSize: 12 }}>Áp dụng B/C trước khi extract màu đen</span>
                </label>
              )}
            </div>

            {/* === BLACK TEXT EXTRACTION (chỉ hiển thị khi không dùng Xiaomi modes) === */}
            {!xiaomiStyleOnly && !xiaomiPlusPureBlack && (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 12, borderTop: '1px dashed #d1d5db' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#4b5563' }}>🔲 Black Text Extraction (Binarize)</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Black Threshold (V &lt; này = đen)</label>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={processingParams.blackThreshold}
                    onChange={(e) => setProcessingParams(p => ({ ...p, blackThreshold: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{processingParams.blackThreshold}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Saturation Threshold (S &lt; này = xám)</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={processingParams.saturationThreshold}
                    onChange={(e) => setProcessingParams(p => ({ ...p, saturationThreshold: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{processingParams.saturationThreshold}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Blur Size</label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="2"
                    value={processingParams.blurSize}
                    onChange={(e) => setProcessingParams(p => ({ ...p, blurSize: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 11 }}>{processingParams.blurSize}</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Morph Kernel</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={processingParams.morphKernel}
                    onChange={(e) => setProcessingParams(p => ({ ...p, morphKernel: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 11 }}>{processingParams.morphKernel}</span>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={processingParams.useOtsu}
                      onChange={(e) => setProcessingParams(p => ({ ...p, useOtsu: e.target.checked }))}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Use Otsu (vs Adaptive)</span>
                  </label>
                </div>
              </>
            )}
            
            <div style={{ gridColumn: '1 / -1', marginTop: 8, display: 'flex', gap: 8 }}>
              <button 
                style={{ ...styles.btn, background: '#059669' }} 
                onClick={testCustomParams}
              >
                🔬 Test Custom Params
              </button>
              {!xiaomiStyleOnly && !xiaomiPlusPureBlack && (
                <button 
                  style={{ ...styles.btn, background: '#7c3aed' }} 
                  onClick={testPreprocessing}
                  disabled={!opencvLoaded}
                >
                  📊 Test All Presets
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preprocessing Previews */}
      {processedPreviews && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3>📸 Preprocessing Previews</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {Object.entries(processedPreviews).map(([name, src]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{name}</div>
                <img src={src} alt={name} style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3>🧪 Quét QR riêng (ảnh crop QR hoặc ảnh QR thuần)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
          <div>
            <label style={styles.label}>Upload ảnh QR</label>
            <input type="file" accept="image/*" onChange={handleQrOnlyFile} />
            {qrOnlySrc && <img src={qrOnlySrc} alt="qr-preview" style={{ width: '100%', marginTop: 10, borderRadius: 8 }} />}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button style={styles.btn} onClick={decodeQrOnly}>Quét QR riêng</button>
              <div style={styles.status}>{qrOnlyStatus || 'Chưa chạy'}</div>
            </div>
            {qrOnlyError && <div style={{ color: '#b91c1c', marginBottom: 6 }}>{qrOnlyError}</div>}
            {qrOnlyResult && (
              <pre style={{ ...styles.status, background: '#f8fafc', color: '#0f172a' }}>{JSON.stringify(qrOnlyResult, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>

      {ocrResult && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3>🛰️ Vision overlay (warp nếu có)</h3>
          <VisionOverlay image={ocrResult.warpedImage || imageSrc} ocr={parsedRoi?.ocr} qr={parsedRoi?.qrRegions} />
        </div>
      )}

      {(ocrResult || qrResult) && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3>📋 Kết quả thô</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={styles.label}>OCR fields</div>
              <pre style={{ ...styles.status, background: '#f8fafc', color: '#0f172a' }}>{JSON.stringify(ocrResult, null, 2)}</pre>
            </div>
            <div>
              <div style={styles.label}>QR result</div>
              <pre style={{ ...styles.status, background: '#f8fafc', color: '#0f172a' }}>{JSON.stringify(qrResult, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {merged && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3>✅ Payload gửi đi</h3>
          <pre style={{ ...styles.status, background: '#f8fafc', color: '#0f172a' }}>
{JSON.stringify(merged.finalData, null, 2)}
          </pre>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button style={styles.btn} onClick={copyPayload}>Copy payload</button>
            <div>Risk: {merged.riskLevel} | Score: {merged.riskScore.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycDebugPlayground;
