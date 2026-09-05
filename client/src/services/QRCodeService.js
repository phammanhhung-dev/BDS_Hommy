/**
 * QRCodeService - Xử lý QR Code trên CCCD Việt Nam
 * Format QR: "soCCCD|maQR|hoTen|ngaySinh|gioiTinh|diaChi|ngayCap"
 */

import ImageProcessingService from './ImageProcessingService';
import jsQR from 'jsqr';

const ENABLE_QR_DEBUG_VISION = true; // Bật để xem hình vùng đang scan (base64) trong console/attempts

/**
 * QR Regions - Cập nhật từ KYC Debug calibration [2024-12-10]
 * Sắp xếp theo độ ưu tiên: trs (nhỏ nhất, chính xác nhất) → trl (rộng nhất)
 */
const DEFAULT_QR_REGIONS = [
  { name: 'full', x: 0, y: 0, width: 1, height: 1 },
  { name: 'trs', x: 0.7488202812287943, y: 0.066528110505082154, width: 0.17, height: 0.25 },
  { name: 'tc', x: 0.7350600625148778, y: 0.035, width: 0.2, height: 0.3 },
  { name: 'trm', x: 0.7139388609855822, y: 0.0303052771011813199, width: 0.24, height: 0.33 },
  { name: 'trl', x: 0.6843596950212068, y: 0.02, width: 0.28, height: 0.38 }
];

const ensureHiddenQrContainer = () => {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('qr-reader-hidden');
  if (!el) {
    el = document.createElement('div');
    el.id = 'qr-reader-hidden';
    el.style.display = 'none';
    document.body.appendChild(el);
  }
};

// Helper: decode QR với jsQR, kèm upscale + multi-threshold + invert fallback
const decodeWithJsqrEnhanced = async (imageDataUrl, label = 'full-image') => {
  try {
    const img = new Image();
    img.src = imageDataUrl;
    await img.decode();

    // FIX 1: Upscale ảnh nhỏ (min 400px) thay vì scale down
    const minSide = Math.min(img.width, img.height);
    const targetMin = 400;
    const scale = minSide < targetMin ? targetMin / minSide : 1;
    const maxScale = 3; // Không scale quá 3x để tránh blur
    const finalScale = Math.min(scale, maxScale);
    
    const width = Math.max(1, Math.round(img.width * finalScale));
    const height = Math.max(1, Math.round(img.height * finalScale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Lấy imageData gốc để tính avg
    const originalImageData = ctx.getImageData(0, 0, width, height);
    const originalData = originalImageData.data;
    let sum = 0;
    for (let i = 0; i < originalData.length; i += 4) {
      const gray = 0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];
      sum += gray;
    }
    const avg = sum / (originalData.length / 4 || 1);

    // FIX 2: Thử nhiều threshold levels
    const thresholdFactors = [0.85, 0.9, 0.95, 1.0, 1.05];
    
    for (const factor of thresholdFactors) {
      const threshold = avg * factor;
      const binaryData = new Uint8ClampedArray(originalData.length);
      
      for (let i = 0; i < originalData.length; i += 4) {
        const gray = 0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];
        const v = gray > threshold ? 255 : 0;
        binaryData[i] = binaryData[i + 1] = binaryData[i + 2] = v;
        binaryData[i + 3] = 255;
      }

      const code = jsQR(binaryData, width, height);
      if (code?.data) {
        console.log(`✅ QR via jsQR (${label}, threshold=${factor})`);
        return code.data;
      }
    }

    // FIX 3: Thử invert (QR đảo màu)
    const invertedData = new Uint8ClampedArray(originalData.length);
    for (let i = 0; i < originalData.length; i += 4) {
      invertedData[i] = 255 - originalData[i];
      invertedData[i + 1] = 255 - originalData[i + 1];
      invertedData[i + 2] = 255 - originalData[i + 2];
      invertedData[i + 3] = 255;
    }
    const invertedCode = jsQR(invertedData, width, height);
    if (invertedCode?.data) {
      console.log(`✅ QR via jsQR (${label}, inverted)`);
      return invertedCode.data;
    }

    console.warn(`⚠️ jsQR (${label}, enhanced) không detect`);
    return null;
  } catch (e) {
    console.warn(`⚠️ jsQR (${label}) error:`, e?.message || String(e));
    return null;
  }
};

const QRCodeService = {
  /**
   * Vẽ bounding box của region lên ảnh gốc để debug tầm nhìn
   */
  visualizeRegion: async (imageDataUrl, region) => {
    const img = new Image();
    img.src = imageDataUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = Math.max(2, Math.floor(img.width * 0.003));
    ctx.strokeRect(
      img.width * region.x,
      img.height * region.y,
      img.width * region.width,
      img.height * region.height
    );

    ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
    ctx.fillRect(
      img.width * region.x,
      img.height * region.y,
      img.width * region.width,
      img.height * region.height
    );

    return canvas.toDataURL('image/png');
  },

  /**
   * Crop vùng QR code từ ảnh CCCD với tọa độ cụ thể
   */
  cropQRRegion: async (imageDataUrl, region = { x: 0.6996492301647519, y: 0.09626173970120754, width: 0.2, height: 0.3 }) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const qrX = Math.floor(img.width * region.x);
        const qrY = Math.floor(img.height * region.y);
        const qrWidth = Math.floor(img.width * region.width);
        const qrHeight = Math.floor(img.height * region.height);

        canvas.width = qrWidth;
        canvas.height = qrHeight;

        ctx.drawImage(img, qrX, qrY, qrWidth, qrHeight, 0, 0, qrWidth, qrHeight);

        // Tăng contrast
        const imageData = ctx.getImageData(0, 0, qrWidth, qrHeight);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const factor = 1.5;
          data[i] = Math.min(255, (data[i] - 128) * factor + 128);
          data[i + 1] = Math.min(255, (data[i + 1] - 128) * factor + 128);
          data[i + 2] = Math.min(255, (data[i + 2] - 128) * factor + 128);
        }
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  },

  /**
   * Scan QR code từ ảnh CCCD với retry và deskew
   * [2024-12-10] Added: Xiaomi Style Enhancement trước khi scan
   */
  scanFromImage: async (imageSource, customRegions = null) => {
    try {
      console.log('🔍 Bắt đầu quét QR code...');

      let imageDataUrl = imageSource;
      if (imageSource instanceof File) {
        imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageSource);
        });
      }

      // BƯỚC 0.5: Apply Xiaomi Style Enhancement TRƯỚC khi scan
      console.log('🔧 Áp dụng Xiaomi Style Enhancement (E100/B60/C50)...');
      const enhancedImage = await ImageProcessingService.xiaomiStyleEnhance(imageDataUrl, {
        exposure: 100,
        brightness: 60,
        contrast: 50
      });

      // BƯỚC 0: Thử jsQR enhanced trên ảnh đã enhance
      const fullJsqr = await decodeWithJsqrEnhanced(enhancedImage, 'full-image-xiaomi');
      if (fullJsqr) {
        const parsedData = QRCodeService.parseQRData(fullJsqr);
        return {
          success: true,
          source: 'QR_CODE',
          data: parsedData,
          attempts: 1,
          attemptsLog: [{ method: 'full-image-xiaomi:jsqr-enhanced', note: 'decoded_with_xiaomi_style' }]
        };
      }

      // Thử lại với ảnh gốc (không enhance) - fallback
      const fullJsqrOriginal = await decodeWithJsqrEnhanced(imageDataUrl, 'full-image-original');
      if (fullJsqrOriginal) {
        const parsedData = QRCodeService.parseQRData(fullJsqrOriginal);
        return {
          success: true,
          source: 'QR_CODE',
          data: parsedData,
          attempts: 2,
          attemptsLog: [
            { method: 'full-image-xiaomi:jsqr-enhanced', error: 'no code detected' },
            { method: 'full-image-original:jsqr-enhanced', note: 'decoded_without_enhancement' }
          ]
        };
      }

      let qrData = null;
      let attempts = [
        { method: 'full-image-xiaomi:jsqr-enhanced', error: 'no code detected' },
        { method: 'full-image-original:jsqr-enhanced', error: 'no code detected' }
      ];

      // Lazy import html5-qrcode (chỉ dùng khi jsQR full-image không thành công)
      ensureHiddenQrContainer();
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("qr-reader-hidden", {
        formatsToSupport: [0], // QR_CODE
        verbose: false
      });

      const scan = async (url) => {
        try {
          const blob = await fetch(url).then(r => r.blob());
          const mime = blob.type || 'image/png';
          const ext = mime.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `scan.${ext}`, { type: mime });
          return await html5QrCode.scanFile(file, false);
        } catch (e) {
          throw e;
        }
      };

      const scanWithJsQR = async (dataUrl, label) => {
        try {
          const data = await decodeWithJsqrEnhanced(dataUrl, label);
          if (data) {
            return data;
          }
          throw new Error('jsQR: no code detected (enhanced)');
        } catch (e) {
          attempts.push({ method: `${label}:jsqr`, error: e.message });
          return null;
        }
      };

      const regions = (customRegions && customRegions.length > 0)
        ? customRegions.map((r, idx) => {
            const { name, key, ...rest } = r;
            return { name: name || key || `custom-${idx}`, ...rest };
          })
        : DEFAULT_QR_REGIONS;

      // Helper: scan a list of regions on a given image
      const scanRegions = async (srcLabel, url) => {
        for (const region of regions) {
          const attemptLabel = `${srcLabel}:${region.name}`;
          let cropped = null;
          try {
            console.log(`   Attempt (${attemptLabel}): scanning region...`);
            cropped = await QRCodeService.cropQRRegion(url, region);
            if (ENABLE_QR_DEBUG_VISION) {
              const vision = await QRCodeService.visualizeRegion(url, region);
              attempts.push({ method: `${attemptLabel}:vision`, previewLength: vision?.length || 0 });
            }
            const data = await scan(cropped);
            console.log(`✅ QR found on ${attemptLabel}`);
            return data;
          } catch (err) {
            attempts.push({ method: attemptLabel, error: err.message });
            // Fallback: jsQR decode trên region vừa crop
            if (cropped) {
              const jsqrData = await scanWithJsQR(cropped, attemptLabel);
              if (jsqrData) return jsqrData;
            }
          }
        }
        return null;
      };

      // 1. Scan ảnh đã Xiaomi enhance theo nhiều vùng (ưu tiên)
      console.log('📍 Scanning regions trên ảnh Xiaomi enhanced...');
      qrData = await scanRegions('xiaomi', enhancedImage);

      // 1.5. Scan ảnh gốc theo nhiều vùng (fallback)
      if (!qrData) {
        console.log('📍 Fallback: Scanning regions trên ảnh gốc...');
        qrData = await scanRegions('original', imageDataUrl);
      }

      // 2. Scan ảnh đã Warp + Xiaomi (nếu chưa tìm thấy)
      if (!qrData) {
        try {
          console.log('   Attempt (warped-xiaomi): Warping + Xiaomi enhance...');
          const warped = await ImageProcessingService.warpPerspective(imageDataUrl);
          const warpedEnhanced = await ImageProcessingService.xiaomiStyleEnhance(warped, {
            exposure: 100, brightness: 60, contrast: 50
          });
          qrData = await scanRegions('warped-xiaomi', warpedEnhanced);
          
          // Thử warped gốc nếu enhanced không thành công
          if (!qrData) {
            qrData = await scanRegions('warped', warped);
          }
        } catch (err) {
          attempts.push({ method: 'warped', error: err.message });
        }
      }

      // 3. Deskew / Rotate và scan theo vùng (nếu chưa tìm thấy)
      if (!qrData) {
        const angles = [90, -90, 180];
        for (const angle of angles) {
          try {
            console.log(`   Attempt (rotate_${angle}): Rotate ${angle} deg...`);
            const rotated = await ImageProcessingService.deskew(imageDataUrl, angle);
            qrData = await scanRegions(`rotate_${angle}`, rotated);
            if (qrData) break;
          } catch (err) {
            attempts.push({ method: `rotate_${angle}`, error: err.message });
          }
        }
      }

      if (!qrData) {
        throw new Error(`Không tìm thấy QR code sau ${attempts.length} lần thử.`);
      }

      const parsedData = QRCodeService.parseQRData(qrData);
      return {
        success: true,
        source: 'QR_CODE',
        data: parsedData,
        attempts: attempts.length + 1,
        attemptsLog: attempts
      };

    } catch (error) {
      const msg = error?.message || String(error);
      console.error('❌ QR scan failed:', msg);
      return {
        success: false,
        source: 'QR_CODE',
        error: msg,
        data: null,
        attemptsLog: []
      };
    }
  },

  /**
   * Scan QR THÔ (không parse CCCD), dùng jsQR trên toàn ảnh
   * Phục vụ debug / playground. Nếu jsQR fail sẽ fallback sang html5-qrcode (ZXing).
   */
  scanRawFromImage: async (imageSource) => {
    try {
      let imageDataUrl = imageSource;
      if (imageSource instanceof File) {
        imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageSource);
        });
      }

      let raw = null;
      let from = null;

      // Thử jsQR nguyên ảnh
      const img = new Image();
      img.src = imageDataUrl;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code?.data) {
        console.log('✅ Raw QR via jsQR (full-image)');
        raw = code.data;
        from = 'jsqr';
      } else {
        console.warn('⚠️ jsQR full-image không detect, thử jsQR enhanced + html5-qrcode...');
        // Thử enhanced jsQR
        const enhanced = await decodeWithJsqrEnhanced(imageDataUrl, 'raw-full-image');
        if (enhanced) {
          raw = enhanced;
          from = 'jsqr-enhanced';
        } else {
          ensureHiddenQrContainer();
          ensureHiddenQrContainer();
          const { Html5Qrcode } = await import('html5-qrcode');
          const html5QrCode = new Html5Qrcode("qr-reader-hidden", {
            formatsToSupport: [0],
            verbose: false
          });
          const blob = await fetch(imageDataUrl).then(r => r.blob());
          const mime = blob.type || 'image/png';
          const ext = mime.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `raw.${ext}`, { type: mime });
          raw = await html5QrCode.scanFile(file, false);
          from = 'html5-qrcode';
          console.log('✅ Raw QR via html5-qrcode (full-image)');
        }
      }

      let parsed = null;
      try {
        parsed = QRCodeService.parseQRData(raw);
      } catch (e) {
        // Ignore parse errors here, raw vẫn usable
      }

      return {
        success: true,
        raw,
        parsed,
        engine: from
      };
    } catch (error) {
      const msg = error?.message || String(error);
      console.error('❌ Raw QR scan failed:', msg);
      return {
        success: false,
        raw: null,
        parsed: null,
        error: msg
      };
    }
  },

  parseQRData: (qrString) => {
    const parts = qrString.split('|');
    if (parts.length < 7) throw new Error('Invalid QR format');

    const formatDate = (s) => s.length === 8 ? `${s.substring(0, 2)}/${s.substring(2, 4)}/${s.substring(4)}` : s;

    return {
      soCCCD: parts[0].trim(),
      soCMND: parts[1].trim(),
      tenDayDu: parts[2].trim(),
      ngaySinh: formatDate(parts[3]),
      gioiTinh: parts[4].trim(),
      diaChi: parts[5].trim(),
      ngayCap: formatDate(parts[6]),
      noiCap: null
    };
  },

  calculateSimilarity: (str1, str2) => {
    if (!str1 || !str2) return 0;
    const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").trim();
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    if (s1 === s2) return 1;

    const matrix = [];
    const n = s1.length;
    const m = s2.length;
    if (n === 0) return m === 0 ? 1 : 0;
    if (m === 0) return 0;

    for (let i = 0; i <= n; i++) matrix[i] = [i];
    for (let j = 0; j <= m; j++) matrix[0][j] = j;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return 1 - (matrix[n][m] / Math.max(n, m));
  },

  /**
   * Merge QR + OCR và tính Risk Score
   */
  mergeAndValidate: (qrData, ocrData, faceDistance = 0.5) => {
    console.log('🔀 Merging QR + OCR with Risk Scoring...');

    const result = {
      finalData: {},
      sources: {},
      confidence: {},
      conflicts: [],
      riskScore: 0,
      riskLevel: 'UNKNOWN'
    };

    // 1. Merge Fields
    const fields = ['soCCCD', 'tenDayDu', 'ngaySinh', 'diaChi', 'ngayCap', 'gioiTinh'];
    let matchedCoreFields = 0;
    const coreFields = ['soCCCD', 'ngaySinh', 'gioiTinh'];

    for (const field of fields) {
      const qrVal = qrData?.[field];
      const ocrVal = ocrData?.[field];

      if (qrVal && !ocrVal) {
        result.finalData[field] = qrVal;
        result.sources[field] = 'QR_CODE';
        result.confidence[field] = 1.0;
      } else if (!qrVal && ocrVal) {
        result.finalData[field] = ocrVal;
        result.sources[field] = 'OCR';
        result.confidence[field] = 0.7;
      } else if (qrVal && ocrVal) {
        const sim = QRCodeService.calculateSimilarity(String(qrVal), String(ocrVal));

        // Stricter thresholds
        const isHighConf = field === 'diaChi' || field === 'tenDayDu' ? sim >= 0.90 : sim >= 0.98;

        if (isHighConf) {
          result.finalData[field] = qrVal;
          result.sources[field] = 'QR_CODE (verified)';
          result.confidence[field] = 1.0;
          if (coreFields.includes(field)) matchedCoreFields++;
        } else {
          result.finalData[field] = qrVal; // Prefer QR
          result.sources[field] = 'QR_CODE (mismatch)';
          result.confidence[field] = 0.7;
          result.conflicts.push({ field, qr: qrVal, ocr: ocrVal, sim });
        }
      } else {
        result.finalData[field] = null;
        result.confidence[field] = 0;
      }
    }

    result.finalData.noiCap = ocrData?.noiCap || null;

    // 2. Calculate Risk Score
    // Weights: QR_OK (20%), CoreMatch (20%), Face (40%), Address (20%)
    const qrOk = qrData ? 1 : 0;
    const coreMatchRatio = coreFields.length > 0 ? matchedCoreFields / coreFields.length : 0;

    // Face Score: dist <= 0.45 -> 1.0, dist >= 0.60 -> 0.0
    let faceScore = 0;
    if (faceDistance <= 0.45) faceScore = 1.0;
    else if (faceDistance >= 0.60) faceScore = 0.0;
    else faceScore = (0.60 - faceDistance) / (0.60 - 0.45);

    const addressSim = qrData?.diaChi && ocrData?.diaChi
      ? QRCodeService.calculateSimilarity(qrData.diaChi, ocrData.diaChi)
      : (ocrData?.diaChi ? 0.5 : 0); // Fallback if only OCR address exists

    // If QR is missing, redistribute weights: Face (60%), Address (0%), CoreMatch (0%) -> this is bad.
    // Better: If QR missing, max score is capped, but Face is critical.

    if (!qrData) {
      // Fallback scoring when QR fails: Face (70%), OCR Completeness (30%)
      // We check if OCR got the core fields
      let ocrCompleteness = 0;
      if (ocrData?.soCCCD) ocrCompleteness += 0.33;
      if (ocrData?.tenDayDu) ocrCompleteness += 0.33;
      if (ocrData?.ngaySinh) ocrCompleteness += 0.34;

      result.riskScore = (0.70 * faceScore) + (0.30 * ocrCompleteness);
    } else {
      result.riskScore = (0.20 * qrOk) + (0.20 * coreMatchRatio) + (0.40 * faceScore) + (0.20 * addressSim);
    }

    // 3. Determine Risk Level
    if (result.riskScore >= 0.85 && faceDistance <= 0.45) {
      result.riskLevel = 'AUTO_APPROVE';
    } else if (result.riskScore >= 0.65 || (faceDistance > 0.45 && faceDistance <= 0.60)) {
      result.riskLevel = 'MANUAL_REVIEW';
    } else {
      result.riskLevel = 'REJECT';
    }

    console.log('📊 Risk Score:', result.riskScore.toFixed(2), 'Level:', result.riskLevel);
    return result;
  }
};

export default QRCodeService;