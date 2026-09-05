/**
 * ImageResizeService - Xử lý resize/upscale ảnh cho KYC
 * Đảm bảo ảnh full-res cho OCR/QR processing, resize cho storage
 */

const ImageResizeService = {
  /**
   * Lấy kích thước ảnh từ dataUrl
   * @param {string} dataUrl - Base64 data URL
   * @returns {Promise<{width: number, height: number}>}
   */
  getImageDimensions: async (dataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  },

  /**
   * Trả về ảnh gốc không scale (chỉ validate)
   * @param {string} dataUrl - Base64 data URL
   * @returns {Promise<string>} - Original dataUrl
   */
  getFullResImage: async (dataUrl) => {
    // Validate ảnh có thể load được
    await ImageResizeService.getImageDimensions(dataUrl);
    return dataUrl;
  },

  /**
   * Resize ảnh xuống kích thước nhỏ hơn để lưu DB
   * @param {string} dataUrl - Base64 data URL
   * @param {number} maxWidth - Chiều rộng tối đa (default 800)
   * @param {number} quality - Chất lượng JPEG (0-1, default 0.85)
   * @returns {Promise<string>} - Resized dataUrl
   */
  resizeForStorage: async (dataUrl, maxWidth = 800, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions
        let newWidth = img.width;
        let newHeight = img.height;

        if (img.width > maxWidth) {
          const scale = maxWidth / img.width;
          newWidth = Math.round(img.width * scale);
          newHeight = Math.round(img.height * scale);
        }

        // Always draw to canvas to ensure JPEG format
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  },

  /**
   * Upscale ảnh nhỏ để cải thiện QR detection
   * @param {string} dataUrl - Base64 data URL
   * @param {number} minWidth - Chiều rộng tối thiểu (default 600)
   * @param {number} maxScale - Scale tối đa (default 3)
   * @returns {Promise<string>} - Upscaled dataUrl
   */
  upscaleForQR: async (dataUrl, minWidth = 600, maxScale = 3) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        
        // Nếu ảnh đã đủ lớn, không cần upscale
        if (minSide >= minWidth) {
          resolve(dataUrl);
          return;
        }

        const scale = Math.min(minWidth / minSide, maxScale);
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  },

  /**
   * Tăng contrast cho ảnh (hữu ích cho QR mờ)
   * @param {string} dataUrl - Base64 data URL
   * @param {number} factor - Hệ số contrast (default 1.5)
   * @returns {Promise<string>} - Enhanced dataUrl
   */
  enhanceContrast: async (dataUrl, factor = 1.5) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
};

export default ImageResizeService;

