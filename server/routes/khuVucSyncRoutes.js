const express = require('express');
const router = express.Router();
const { syncKhuVuc } = require('../controllers/khuVucSyncController');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

const adminOnly = [authenticate, requireRoles(['QuanTriVienHeThong'])];

router.post('/sync', ...adminOnly, syncKhuVuc);

module.exports = router;
