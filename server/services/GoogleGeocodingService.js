/**
 * Service tích hợp Google Geocoding API
 * Độ chính xác cao cho địa chỉ Việt Nam
 * 
 * Setup:
 * 1. Tạo Google Cloud Project: https://console.cloud.google.com
 * 2. Enable Geocoding API
 * 3. Tạo API key với IP restrictions
 * 4. Add to .env: GOOGLE_MAPS_API_KEY=your_key_here
 */

const axios = require('axios');

class GoogleGeocodingService {
  constructor() {
    this.baseURL = 'https://maps.googleapis.com/maps/api/geocode/json';
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('[GoogleGeocodingService] ⚠️ API key not configured. Set GOOGLE_MAPS_API_KEY in .env');
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Forward Geocoding: Địa chỉ → Tọa độ
   * @param {string} address - Địa chỉ cần geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string, accuracy: string} | null>}
   */
  async geocodeAddress(address) {
    if (!this.isAvailable()) {
      throw new Error('Google Geocoding API key not configured');
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        language: 'vi',
        region: 'vn', // Bias results to Vietnam
      });

      console.log(`[GoogleGeocodingService] Geocoding: ${address}`);

      const response = await axios.get(this.baseURL, {
        params,
        timeout: 5000,
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn(`[GoogleGeocodingService] Status: ${data.status}`);
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;

      console.log(`[GoogleGeocodingService] Found: ${result.formatted_address} (${location.lat}, ${location.lng})`);
      console.log(`[GoogleGeocodingService] Accuracy: ${result.geometry.location_type}`);

      return {
        lat: location.lat,
        lng: location.lng,
        displayName: result.formatted_address,
        accuracy: result.geometry.location_type, // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
        placeId: result.place_id,
        addressComponents: result.address_components,
        bounds: result.geometry.bounds,
        viewport: result.geometry.viewport,
      };

    } catch (error) {
      console.error('[GoogleGeocodingService] Error:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle specific Google API errors
        if (error.response.data.error_message) {
          throw new Error(error.response.data.error_message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Reverse Geocoding: Tọa độ → Địa chỉ
   * @param {number} lat - Vĩ độ
   * @param {number} lng - Kinh độ
   * @returns {Promise<string>}
   */
  async reverseGeocode(lat, lng) {
    if (!this.isAvailable()) {
      throw new Error('Google Geocoding API key not configured');
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        language: 'vi',
      });

      console.log(`[GoogleGeocodingService] Reverse geocoding: ${lat}, ${lng}`);

      const response = await axios.get(this.baseURL, {
        params,
        timeout: 5000,
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];
      return {
        displayName: result.formatted_address,
        address: result.address_components,
        addressComponents: result.address_components,
        placeId: result.place_id,
        accuracy: result.geometry.location_type,
      };

    } catch (error) {
      console.error('[GoogleGeocodingService] Reverse geocode error:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleGeocodingService();
