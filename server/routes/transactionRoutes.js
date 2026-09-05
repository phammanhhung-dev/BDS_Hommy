const express = require('express');
const router = express.Router();
const tc = require('../controllers/transactionController');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

const adminOnly = [authenticate, requireRoles(['QuanTriVienHeThong'])];

router.get('/', ...adminOnly, tc.list);
router.get('/:id', ...adminOnly, tc.getById);
router.post('/', ...adminOnly, tc.create);
router.put('/:id', ...adminOnly, tc.update);
router.delete('/:id', ...adminOnly, tc.delete);

module.exports = router;
