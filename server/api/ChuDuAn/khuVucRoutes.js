const express = require('express');
const router = express.Router();
const ChuDuAnModel = require('../../models/ChuDuAnModel');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');

router.get('/khu-vuc', authMiddleware, roleMiddleware(['ChuDuAn']), async (req, res) => {
  try {
    let parentId = req.query.parentId;
    if (parentId === undefined || parentId === null || parentId === '' || parentId === 'null') {
      parentId = null;
    }
    const khuVuc = await ChuDuAnModel.layDanhSachKhuVuc(parentId);
    res.json({
      success: true,
      data: khuVuc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
