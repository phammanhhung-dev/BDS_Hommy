const express = require('express');
const router = express.Router();
const sepayCtrl = require('../controllers/sepayController');
const sepaySync = require('../services/sepaySyncService');
const authenticate = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

const adminOnly = [authenticate, requireRoles(['QuanTriVienHeThong'])];

router.get('/transactions', ...adminOnly, sepayCtrl.getTransactions);

router.post('/sync-now', ...adminOnly, async (req, res) => {
  try {
    const stats = await sepaySync.syncOnce(req.body || {});
    return res.json({ message: 'Sync completed', stats });
  } catch (err) {
    console.error('[Sepay] Sync error:', err);
    return res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
