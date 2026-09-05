const express = require('express');
const router = express.Router();
const sepayCtrl = require('../controllers/sepayCallbackController');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

router.post('/callback', sepayCtrl.callback);

router.get('/callbacks', authenticate, requireRoles(['QuanTriVienHeThong']), sepayCtrl.listCallbacks);

module.exports = router;
