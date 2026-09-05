const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

router.get('/provinces/legacy', addressController.getLegacyProvinces);
router.get('/provinces/current', addressController.getCurrentProvinces);
router.get('/provinces', addressController.getCurrentProvinces);
router.get('/districts/:provinceId', addressController.getDistricts);
router.get('/wards/:districtId', addressController.getWards);
router.get('/wards/current/:provinceId', addressController.getWardsByCurrentProvince);
router.get('/wards/current-district/:districtId', addressController.getWardsByCurrentDistrict);
router.post('/suggest-mapping', addressController.suggestMapping);
router.get('/suggest-mapping', addressController.getSuggestedMapping);
router.post('/manual-report', addressController.manualReport);
router.post('/convert', addressController.convertLegacyAddress);

module.exports = router;
