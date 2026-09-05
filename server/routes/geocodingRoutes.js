/**
 * Routes cho Geocoding API
 * Endpoint: POST /api/geocode
 */

const express = require('express');
const router = express.Router();
const GeocodingController = require('../controllers/GeocodingController');
const auth = require('../middleware/auth'); // Production JWT authentication

/**
 * @route   POST /api/geocode
 * @desc    Forward Geocoding - Chuyển địa chỉ thành tọa độ
 * @access  Private (Requires JWT authentication)
 * @body    { address: string }
 * @returns { success: boolean, data: { lat, lng, displayName, address } }
 */
router.post(
  '/',
  auth, // Production JWT authentication
  GeocodingController.validateGeocodeRequest,
  GeocodingController.geocodeAddress
);

router.post(
  '/reverse',
  auth,
  GeocodingController.validateReverseGeocodeRequest,
  GeocodingController.reverseGeocode
);

module.exports = router;
