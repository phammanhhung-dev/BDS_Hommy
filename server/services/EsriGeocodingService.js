const axios = require('axios');

class EsriGeocodingService {
  /**
   * Geocode địa chỉ sang tọa độ sử dụng Esri ArcGIS World Geocoding Service
   * @param {string} address 
   * @returns {Promise<{lat: number, lng: number, displayName: string} | null>}
   */
  static async geocodeAddress(address) {
    if (!address || typeof address !== 'string') return null;

    try {
      const response = await axios.get(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(address)}&maxLocations=1`,
        { timeout: 4000 }
      );

      const candidates = response?.data?.candidates;
      if (Array.isArray(candidates) && candidates.length > 0 && candidates[0].location) {
        const loc = candidates[0].location;
        const lat = parseFloat(loc.y);
        const lng = parseFloat(loc.x);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return {
            lat,
            lng,
            displayName: candidates[0].address || address,
            source: 'esri'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('[EsriGeocodingService] Error:', error.message);
      return null;
    }
  }
}

module.exports = EsriGeocodingService;
