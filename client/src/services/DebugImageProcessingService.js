/**
 * DebugImageProcessingService - Xử lý ảnh nâng cao cho trang debug KYC
 * 
 * CHIẾN LƯỢC: Tận dụng đặc điểm CCCD Việt Nam
 * - Text và QR Code luôn là MÀU ĐEN
 * - Nền CCCD có màu sắc (xanh, vàng, đỏ, gradient)
 * - Watermark thường có màu xanh lá/xanh dương nhạt
 * 
 * PIPELINE:
 * 1. Brightness/Contrast/Exposure adjustment (như Xiaomi HyperOS)
 * 2. Color Extraction: Trích xuất pixel đen (text/QR)
 * 3. HSV/Grayscale Conversion
 * 4. Gaussian Blur: Giảm nhiễu
 * 5. Otsu Binarization: Tự động tìm ngưỡng tối ưu
 * 6. Morphological Operations: Clean up
 */

const DebugImageProcessingService = {
  
  /**
   * Điều chỉnh Brightness/Contrast/Exposure như app chỉnh ảnh Xiaomi
   * @param {string} imageDataUrl - Ảnh gốc
   * @param {Object} options - Tùy chọn
   * @returns {Promise<string>} - Ảnh đã điều chỉnh
   */
  adjustBrightnessContrast: async (imageDataUrl, options = {}) => {
    const {
      // Exposure: 0 = gốc, 100 = tăng gấp đôi, -100 = giảm còn 0
      // Xiaomi exposure 100 ≈ brightness 200%
      exposure = 0,
      // Brightness: 0 = gốc, 100 = sáng max, -100 = tối max  
      // Xiaomi brightness 60 ≈ CSS brightness 160%
      brightness = 0,
      // Contrast: 0 = gốc, 100 = contrast max, -100 = flat
      // Xiaomi contrast 50 ≈ CSS contrast 150%
      contrast = 0,
      debug = false
    } = options;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Chuyển đổi giá trị Xiaomi (-100 to 100) sang CSS filter (%)
        // Exposure 100 → brightness 200%, Exposure 0 → 100%
        const exposureMultiplier = 1 + (exposure / 100);
        // Brightness 60 → 160%, Brightness 0 → 100%
        const brightnessPercent = 100 + (brightness * 0.6); // Scale nhẹ hơn
        // Contrast 50 → 150%, Contrast 0 → 100%
        const contrastPercent = 100 + (contrast * 0.5);

        // Kết hợp exposure và brightness
        const finalBrightness = (brightnessPercent / 100) * exposureMultiplier * 100;

        if (debug) {
          console.log('🔧 [BrightnessContrast] Params:', { exposure, brightness, contrast });
          console.log('🔧 [BrightnessContrast] CSS values:', {
            brightness: finalBrightness.toFixed(0) + '%',
            contrast: contrastPercent.toFixed(0) + '%'
          });
        }

        // Áp dụng CSS filter
        ctx.filter = `brightness(${finalBrightness}%) contrast(${contrastPercent}%)`;
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  },

  /**
   * Xiaomi Style + Pure Black Filter (KHÔNG binarize full)
   * Bước 1: Tăng B/C như Xiaomi
   * Bước 2: Chỉ giữ pixel đen thuần (max<=30 && delta<=8)
   */
  xiaomiPlusPureBlack: async (imageDataUrl, options = {}) => {
    const {
      exposure = 100,
      brightness = 60,
      contrast = 50,
      // Pure black filter params
      maxThreshold = 30,      // max(R,G,B) <= này
      deltaThreshold = 8,     // (max - min) <= này
      debug = false
    } = options;

    return new Promise(async (resolve) => {
      try {
        // Step 1: Apply Xiaomi B/C
        if (debug) console.log('🔧 [XiaomiPureBlack] Step 1: Applying B/C...');
        const bcImage = await DebugImageProcessingService.adjustBrightnessContrast(imageDataUrl, {
          exposure, brightness, contrast, debug
        });

        // Step 2: Apply pure black filter
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let blackCount = 0;
          let whiteCount = 0;

          if (debug) console.log('🔧 [XiaomiPureBlack] Step 2: Pure black filter (max<=' + maxThreshold + ', delta<=' + deltaThreshold + ')');

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            // Điều kiện pure black: max <= 30 AND delta <= 8
            const isPureBlack = max <= maxThreshold && delta <= deltaThreshold;

            if (isPureBlack) {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
              blackCount++;
            } else {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
              whiteCount++;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          if (debug) {
            const total = blackCount + whiteCount;
            console.log('🔧 [XiaomiPureBlack] Black pixels:', blackCount, '(' + (blackCount/total*100).toFixed(2) + '%)');
          }

          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imageDataUrl);
        img.src = bcImage;
      } catch (e) {
        console.error('❌ XiaomiPureBlack error:', e);
        resolve(imageDataUrl);
      }
    });
  },

  /**
   * Pipeline xử lý ảnh tối ưu cho OCR
   * @param {string} imageDataUrl - Ảnh gốc (data URL)
   * @param {Object} options - Tùy chọn xử lý
   * @returns {Promise<string>} - Ảnh đã xử lý
   */
  processForOCR: async (imageDataUrl, options = {}) => {
    const {
      // === BRIGHTNESS/CONTRAST (Xiaomi style) ===
      exposure = 100,      // Xiaomi: 100
      brightness = 60,     // Xiaomi: 60
      contrast = 50,       // Xiaomi: 50
      applyBrightnessFirst = true, // Áp dụng brightness/contrast trước color extraction
      
      // === BLACK TEXT EXTRACTION ===
      // Ngưỡng cho màu đen (text) - pixel có V < blackThreshold sẽ được giữ
      blackThreshold = 80,
      // Tolerance cho saturation (S thấp = màu xám/đen/trắng)
      saturationThreshold = 50,
      // Gaussian blur kernel size
      blurSize = 3,
      // Morphological kernel size
      morphKernel = 2,
      // Sử dụng Otsu thay vì adaptive threshold
      useOtsu = true,
      // Invert result (đen trên trắng)
      invertResult = false,
      // Debug mode - log các bước
      debug = false
    } = options;

    return new Promise(async (resolve) => {
      try {
        // Step 0: Apply brightness/contrast first if enabled
        let processedSrc = imageDataUrl;
        if (applyBrightnessFirst && (exposure !== 0 || brightness !== 0 || contrast !== 0)) {
          if (debug) console.log('🔧 [DebugProcess] Step 0: Applying brightness/contrast...');
          processedSrc = await DebugImageProcessingService.adjustBrightnessContrast(imageDataUrl, {
            exposure, brightness, contrast, debug
          });
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            // Step 1: Color-based black text extraction
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            console.log('🔧 [DebugProcess] Step 1: Extracting black text with params:', {
              exposure, brightness, contrast,
              blackThreshold,
              saturationThreshold,
              blurSize,
              morphKernel,
              useOtsu,
              imageSize: `${canvas.width}x${canvas.height}`
            });

            let blackPixelCount = 0;
            let whitePixelCount = 0;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Convert RGB to HSV-like values
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const delta = max - min;

              // V (Value/Brightness) = max
              const v = max;
              // S (Saturation) = delta / max (scaled to 0-255)
              const s = max === 0 ? 0 : (delta / max) * 255;

              // Xác định pixel đen (text/QR):
              // Điều kiện 1: max <= 30 AND delta <= 8 (pixel đen thuần - không có màu)
              const isPureBlack = max <= 30 && delta <= 8;
              // Điều kiện 2: V thấp (tối) VÀ S thấp (không có màu sắc rõ)
              const isBlackText = v < blackThreshold && s < saturationThreshold;
              // Điều kiện 3: pixel gần đen thuần (r,g,b đều thấp và gần nhau)
              const isNearBlack = r < 60 && g < 60 && b < 60;
              const isDarkGray = v < 100 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30;

              if (isPureBlack || isBlackText || isNearBlack || isDarkGray) {
                // Giữ pixel đen → chuyển thành đen thuần
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                blackPixelCount++;
              } else {
                // Loại bỏ tất cả màu khác → trắng
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                whitePixelCount++;
              }
          }

          console.log('🔧 [DebugProcess] Pixel stats: black=' + blackPixelCount + ', white=' + whitePixelCount);
          console.log('🔧 [DebugProcess] Black percentage:', ((blackPixelCount / (blackPixelCount + whitePixelCount)) * 100).toFixed(2) + '%');

          ctx.putImageData(imageData, 0, 0);

          // Step 2: Check if OpenCV is available
          if (!window.cv || !window.cv.imread) {
            console.warn('⚠️ OpenCV not available, returning color-filtered result only');
            console.log('🔧 [DebugProcess] window.cv:', !!window.cv, 'cv.imread:', !!(window.cv && window.cv.imread));
            // VẪN TRẢ VỀ ẢNH ĐÃ LỌC MÀU - không phải ảnh gốc!
            resolve(canvas.toDataURL('image/png'));
            return;
          }

          if (debug) console.log('🔧 [DebugProcess] Step 2: OpenCV processing...');

          const cv = window.cv;
          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          // Step 3: Gaussian Blur để giảm nhiễu
          const blurred = new cv.Mat();
          if (blurSize > 0) {
            const ksize = blurSize % 2 === 0 ? blurSize + 1 : blurSize;
            cv.GaussianBlur(gray, blurred, new cv.Size(ksize, ksize), 0);
          } else {
            gray.copyTo(blurred);
          }

          // Step 4: Binarization
          const binary = new cv.Mat();
          if (useOtsu) {
            // Otsu's method - tự động tìm ngưỡng tối ưu
            cv.threshold(blurred, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            if (debug) console.log('🔧 [DebugProcess] Applied Otsu binarization');
          } else {
            // Adaptive threshold
            cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
            if (debug) console.log('🔧 [DebugProcess] Applied Adaptive threshold');
          }

          // Step 5: Morphological operations để clean up
          let processed = binary;
          if (morphKernel > 0) {
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(morphKernel, morphKernel));
            const temp = new cv.Mat();
            
            // Opening (erode then dilate) - remove small noise
            cv.morphologyEx(binary, temp, cv.MORPH_OPEN, kernel);
            // Closing (dilate then erode) - fill small holes in text
            cv.morphologyEx(temp, processed, cv.MORPH_CLOSE, kernel);
            
            temp.delete();
            kernel.delete();
            if (debug) console.log('🔧 [DebugProcess] Applied morphological operations');
          }

          // Step 6: Invert nếu cần
          if (invertResult) {
            cv.bitwise_not(processed, processed);
          }

          // Output
          const outputCanvas = document.createElement('canvas');
          cv.imshow(outputCanvas, processed);
          const result = outputCanvas.toDataURL('image/png');

          // Cleanup
          src.delete();
          gray.delete();
          blurred.delete();
          binary.delete();
          if (processed !== binary) processed.delete();

          if (debug) console.log('✅ [DebugProcess] Complete');
          resolve(result);
          } catch (e) {
            console.error('❌ DebugProcess error:', e);
            resolve(imageDataUrl);
          }
        };
        img.onerror = () => resolve(imageDataUrl);
        img.src = processedSrc;
      } catch (e) {
        console.error('❌ DebugProcess init error:', e);
        resolve(imageDataUrl);
      }
    });
  },

  /**
   * Pipeline xử lý ảnh tối ưu cho QR Code
   * QR Code cần contrast cao và không cần morphological ops
   */
  processForQR: async (imageDataUrl, options = {}) => {
    const {
      blackThreshold = 100, // QR cho phép threshold cao hơn
      saturationThreshold = 80,
      blurSize = 1, // Blur nhẹ hơn để giữ chi tiết
      sharpen = true, // Sharpen để tăng edge
      debug = false
    } = options;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);

          // Step 1: Extract black pixels (QR modules)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          if (debug) console.log('🔧 [QRProcess] Step 1: Extracting QR modules...');

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            const v = max;
            const s = max === 0 ? 0 : (delta / max) * 255;

            // QR: black modules vs white background
            const isBlack = v < blackThreshold || (r < 80 && g < 80 && b < 80);
            const isVeryDark = v < 50;

            if (isBlack || isVeryDark) {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
            } else {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Step 2: OpenCV processing
          if (!window.cv || !window.cv.imread) {
            resolve(canvas.toDataURL('image/png'));
            return;
          }

          const cv = window.cv;
          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          // Optional sharpen để tăng edge
          let processed = gray;
          if (sharpen) {
            const sharpened = new cv.Mat();
            const kernel = cv.matFromArray(3, 3, cv.CV_32F, [
              0, -1, 0,
              -1, 5, -1,
              0, -1, 0
            ]);
            cv.filter2D(gray, sharpened, -1, kernel);
            processed = sharpened;
            kernel.delete();
            if (debug) console.log('🔧 [QRProcess] Applied sharpening');
          }

          // Otsu binarization
          const binary = new cv.Mat();
          cv.threshold(processed, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

          const outputCanvas = document.createElement('canvas');
          cv.imshow(outputCanvas, binary);
          const result = outputCanvas.toDataURL('image/png');

          // Cleanup
          src.delete();
          gray.delete();
          if (processed !== gray) processed.delete();
          binary.delete();

          if (debug) console.log('✅ [QRProcess] Complete');
          resolve(result);
        } catch (e) {
          console.error('❌ QRProcess error:', e);
          resolve(imageDataUrl);
        }
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  },

  /**
   * Preset configurations cho các trường hợp khác nhau
   */
  presets: {
    // Preset cho OCR số CCCD (12 chữ số)
    cccdNumber: {
      blackThreshold: 70,
      saturationThreshold: 40,
      blurSize: 1,
      morphKernel: 1,
      useOtsu: true
    },
    // Preset cho OCR text tên (IN HOA)
    cccdName: {
      blackThreshold: 80,
      saturationThreshold: 50,
      blurSize: 3,
      morphKernel: 2,
      useOtsu: true
    },
    // Preset cho OCR địa chỉ (nhiều dòng)
    cccdAddress: {
      blackThreshold: 90,
      saturationThreshold: 60,
      blurSize: 3,
      morphKernel: 1,
      useOtsu: false // Adaptive threshold tốt hơn cho multi-line
    },
    // Preset cho QR code
    qrCode: {
      blackThreshold: 100,
      saturationThreshold: 80,
      blurSize: 1,
      sharpen: true
    }
  },

  /**
   * Test nhiều preset và trả về kết quả tốt nhất
   * (Dùng cho debug - so sánh visual)
   */
  testAllPresets: async (imageDataUrl) => {
    const results = {};
    
    for (const [name, preset] of Object.entries(DebugImageProcessingService.presets)) {
      if (name === 'qrCode') {
        results[name] = await DebugImageProcessingService.processForQR(imageDataUrl, preset);
      } else {
        results[name] = await DebugImageProcessingService.processForOCR(imageDataUrl, preset);
      }
    }
    
    // Thêm raw (không xử lý)
    results.raw = imageDataUrl;
    
    return results;
  }
};

export default DebugImageProcessingService;
