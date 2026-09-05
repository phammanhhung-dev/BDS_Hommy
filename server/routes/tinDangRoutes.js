const express = require('express');
const router = express.Router();
const tinController = require('../controllers/tinDangController');
const authenticate = require('../middleware/auth');
const { requireRole, requireRoles } = require('../middleware/role');

router.get('/', tinController.getAll);
router.get('/:id', tinController.getById);
router.post('/', authenticate, requireRoles(['ChuDuAn', 'QuanTriVienHeThong']), tinController.create);
router.put('/:id', authenticate, requireRoles(['ChuDuAn', 'QuanTriVienHeThong']), tinController.update);
router.delete('/:id', authenticate, requireRoles(['ChuDuAn', 'QuanTriVienHeThong']), tinController.delete);

// approve/reject
router.post('/:id/approve', authenticate, requireRoles(['Operator', 'QuanTriVienHeThong']), tinController.approve);

module.exports = router;