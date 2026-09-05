const express = require('express');
const router = express.Router();
const kv = require('../controllers/khuVucController');
const addressController = require('../controllers/address.controller');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

const adminOnly = [authenticate, requireRoles(['QuanTriVienHeThong'])];

router.get('/', kv.getAll);
router.get('/tree', addressController.getKhuVucTree);
router.get('/:id/nhan-vien', authenticate, kv.getNhanVien);
router.get('/:id', kv.getById);
router.post('/', ...adminOnly, kv.create);
router.put('/:id', ...adminOnly, kv.update);
router.delete('/:id', ...adminOnly, kv.delete);

module.exports = router;
