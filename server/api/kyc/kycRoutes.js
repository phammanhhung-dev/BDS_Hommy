const express = require('express');
const router = express.Router();
const KycController = require('../../controllers/KycController');
const uploadKyc = require('../../middleware/uploadKyc');
const authMiddleware = require('../../middleware/auth');

router.post('/xac-thuc', 
  authMiddleware,
  uploadKyc.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'cccdBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  KycController.xacThucKYC
);

router.get('/lich-su', authMiddleware, KycController.getLichSu);

module.exports = router;
