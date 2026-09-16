const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

// VNPAY endpoints
router.post('/vnpay/create', PaymentController.createVnPay);
router.get('/vnpay/ipn', PaymentController.vnpayIpn);

// MoMo endpoints
router.post('/momo/create', PaymentController.createMomo);
router.post('/momo/ipn', PaymentController.momoIpn);

module.exports = router;
