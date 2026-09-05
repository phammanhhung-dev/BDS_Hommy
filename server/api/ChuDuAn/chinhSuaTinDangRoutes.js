const express = require('express');
const router = express.Router();
const ChuDuAnController = require('../../controllers/ChuDuAnController');
const auth = require('../../middleware/authSimple');
const role = require('../../middleware/roleSimple');

/**
 * @route   GET /api/chu-du-an/chinh-sua-tin-dang/:id
 * @desc    Lấy thông tin tin đăng để chỉnh sửa
 * @access  Private - Chủ dự án
 */
router.get('/:id', 
  auth, 
  role(['ChuDuAn']), 
  ChuDuAnController.layTinDangDeChinhSua
);

/**
 * @route   PUT /api/chu-du-an/chinh-sua-tin-dang/:id
 * @desc    Cập nhật tin đăng (lưu nháp hoặc gửi duyệt)
 * @access  Private - Chủ dự án
 */
router.put('/:id',
  auth,
  role(['ChuDuAn']),
  ChuDuAnController.capNhatTinDang
);

/**
 * @route   GET /api/chu-du-an/tin-nhap
 * @desc    Lấy danh sách tin nháp
 * @access  Private - Chủ dự án
 */
router.get('/nhap/danh-sach',
  auth,
  role(['ChuDuAn']),
  ChuDuAnController.layDanhSachTinNhap
);

module.exports = router;
