/**
 * Hybrid Geocoding Service
 * Tự động chọn service tốt nhất:
 * 1. Google Geocoding (nếu có API key) - Độ chính xác cao
 * 2. Nominatim (fallback) - Miễn phí nhưng kém chính xác hơn
 */

const GoogleGeocodingService = require('./GoogleGeocodingService');
const EsriGeocodingService = require('./EsriGeocodingService');
const NominatimService = require('./NominatimService');

class HybridGeocodingService {
  /**
   * Forward Geocoding với auto-fallback Google -> Esri -> Nominatim
   * @param {string} address - Địa chỉ cần geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string, source: string} | null>}
   */
  async geocodeAddress(address) {
    let result = null;
    let source = null;

    // 1. Thử Google trước (nếu có API key)
    if (GoogleGeocodingService.isAvailable()) {
      try {
        console.log('[HybridGeocodingService] Trying Google Geocoding API...');
        result = await GoogleGeocodingService.geocodeAddress(address);
        source = 'google';
        
        if (result) {
          console.log(`[HybridGeocodingService] ✅ Google found: ${result.displayName}`);
          return { ...result, source };
        }
      } catch (error) {
        console.warn('[HybridGeocodingService] ⚠️ Google failed, falling back to Esri/Nominatim:', error.message);
      }
    }

    // 2. Thử Esri ArcGIS Geocoding Service (Free, No DNS block in Vietnam)
    try {
      console.log('[HybridGeocodingService] Trying Esri ArcGIS Geocoding...');
      result = await EsriGeocodingService.geocodeAddress(address);
      if (result) {
        console.log(`[HybridGeocodingService] ✅ Esri found: ${result.displayName}`);
        return { ...result, source: 'esri' };
      }
    } catch (esriErr) {
      console.warn('[HybridGeocodingService] ⚠️ Esri failed:', esriErr.message);
    }

    // 3. Fallback sang Nominatim
    try {
      console.log('[HybridGeocodingService] Trying Nominatim (OpenStreetMap)...');
      result = await NominatimService.geocodeAddress(address);
      source = 'nominatim';
      
      if (result) {
        console.log(`[HybridGeocodingService] ✅ Nominatim found: ${result.displayName}`);
        return { ...result, source };
      }
    } catch (error) {
      console.warn('[HybridGeocodingService] ⚠️ Nominatim failed:', error.message);
    }

    return null;
  }

  /**
   * Reverse Geocoding
   * @param {number} lat - Vĩ độ
   * @param {number} lng - Kinh độ
   * @returns {Promise<string>}
   */
  async reverseGeocode(lat, lng) {
    // Thử Google trước
    if (GoogleGeocodingService.isAvailable()) {
      try {
        const result = await GoogleGeocodingService.reverseGeocode(lat, lng);
        return result ? { ...result, source: 'google' } : null;
      } catch (error) {
        console.warn('[HybridGeocodingService] Google reverse failed, falling back to Nominatim');
      }
    }

    // Fallback sang Nominatim
    const result = await NominatimService.reverseGeocode(lat, lng);
    return result ? { ...result, source: 'nominatim' } : null;
  }

  /**
   * Get thông tin service đang dùng
   */
  getServiceInfo() {
    return {
      googleAvailable: GoogleGeocodingService.isAvailable(),
      nominatimAvailable: true,
      primaryService: GoogleGeocodingService.isAvailable() ? 'google' : 'nominatim',
    };
  }
}

module.exports = new HybridGeocodingService();
