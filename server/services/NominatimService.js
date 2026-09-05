/**
 * Service tích hợp Nominatim Geocoding API (OpenStreetMap)
 * Chuyển đổi địa chỉ → Tọa độ (Forward Geocoding)
 */

const axios = require('axios');

class NominatimService {
  constructor() {
    this.baseURL = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'DapPhongTro/1.0 (contact@dapphongtro.com)'; // REQUIRED by Nominatim
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 giây (rate limit)
  }

  /**
   * Rate limiting - Đảm bảo 1 request/giây
   */
  async _waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Forward Geocoding: Địa chỉ → Tọa độ
   * @param {string} address - Địa chỉ cần geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string} | null>}
   */
  async geocodeAddress(address) {
    try {
      // Rate limiting
      await this._waitForRateLimit();

      console.log(`[NominatimService] Geocoding: ${address}`);

      // Thử query đầy đủ trước
      let result = await this._tryGeocode(address);

      // Nếu không tìm thấy, thử query đơn giản hóa (fallback)
      if (!result) {
        const simplifiedAddress = this._simplifyAddress(address);
        if (simplifiedAddress !== address) {
          console.log(`[NominatimService] Fallback to simplified: ${simplifiedAddress}`);
          await this._waitForRateLimit(); // Rate limit cho request thứ 2
          result = await this._tryGeocode(simplifiedAddress);
        }
      }

      if (!result) {
        console.warn(`[NominatimService] Không tìm thấy: ${address}`);
        return null;
      }

      return result;

    } catch (error) {
      console.error('[NominatimService] Error:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Thử geocode với query cụ thể
   * @private
   */
  async _tryGeocode(query) {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: 1,
        addressdetails: 1,
        countrycodes: 'vn',
      });

      const response = await axios.get(`${this.baseURL}/search`, {
        params,
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'vi',
        },
        timeout: 5000,
      });

      const data = response.data;
      if (!data || data.length === 0) {
        return null;
      }

      const place = data[0];
      
      // Validate coordinates
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid coordinates from Nominatim');
      }

      console.log(`[NominatimService] Found: ${place.display_name} (${lat}, ${lng})`);

      return {
        lat,
        lng,
        displayName: place.display_name,
        address: place.address,
        placeId: place.place_id,
        osmType: place.osm_type,
        osmId: place.osm_id,
      };

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.error('[NominatimService] Request timeout');
      }
      return null;
    }
  }

  /**
   * Đơn giản hóa địa chỉ Việt Nam để tăng tỷ lệ tìm thấy
   * Loại bỏ: số nhà, phường/xã chi tiết
   * Giữ lại: Tên đường chính, Quận/Huyện, Tỉnh/TP
   * 
   * @param {string} address - Địa chỉ gốc
   * @returns {string} Địa chỉ đơn giản hóa
   * 
   * @example
   * Input:  "40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh"
   * Output: "Lê Văn Thọ, Gò Vấp, Ho Chi Minh"
   */
  _simplifyAddress(address) {
    let simplified = address;

    // Loại bỏ số nhà (pattern: số/số, số-số, chỉ số)
    simplified = simplified.replace(/^\d+[\/\-]?\d*\s+/, '');

    // Loại bỏ "Phường X" hoặc "Xã Y"
    simplified = simplified.replace(/,?\s*(Phường|Xã)\s+\d+\s*,?\s*/gi, ', ');

    // Đơn giản hóa "TP. Hồ Chí Minh" → "Ho Chi Minh"
    simplified = simplified.replace(/TP\.\s*Hồ\s*Chí\s*Minh/gi, 'Ho Chi Minh');
    simplified = simplified.replace(/Thành\s*phố\s*Hồ\s*Chí\s*Minh/gi, 'Ho Chi Minh');

    // Loại bỏ "Quận" trước tên quận (giữ lại tên quận)
    simplified = simplified.replace(/\s*Quận\s+/gi, ' ');

    // Loại bỏ nhiều dấu phẩy liên tiếp
    simplified = simplified.replace(/,\s*,+/g, ',');

    // Trim spaces
    simplified = simplified.replace(/\s{2,}/g, ' ').trim();

    // Loại bỏ dấu phẩy đầu/cuối
    simplified = simplified.replace(/^,\s*|,\s*$/g, '');

    return simplified;
  }

  /**
   * Reverse Geocoding: Tọa độ → Địa chỉ (Future enhancement)
   * @param {number} lat - Vĩ độ
   * @param {number} lng - Kinh độ
   * @returns {Promise<string>}
   */
  async reverseGeocode(lat, lng) {
    try {
      await this._waitForRateLimit();

      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: 1,
      });

      console.log(`[NominatimService] Reverse geocoding: ${lat}, ${lng}`);

      const response = await axios.get(`${this.baseURL}/reverse`, {
        params,
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'vi',
        },
        timeout: 5000,
      });

      const data = response.data;
      if (!data) {
        return null;
      }

      return {
        displayName: data.display_name,
        address: data.address,
        addressComponents: Object.entries(data.address || {}).map(([key, value]) => ({ long_name: value })),
      };

    } catch (error) {
      console.error('[NominatimService] Reverse geocode error:', error.message);
      throw error;
    }
  }
}

module.exports = new NominatimService();
