const express = require('express');
const router = express.Router();
const yt = require('../controllers/yeuThichController');
const authenticate = require('../middleware/auth');

// Route toggle yêu thích (nếu có token thì xác thực, hỗ trợ cả body NguoiDungID)
router.post('/toggle', (req, res, next) => {
  if (req.header('Authorization')) return authenticate(req, res, next);
  next();
}, yt.toggle);

router.post('/', authenticate, yt.add);                          // thêm yêu thích (body: TinDangID)
router.delete('/:userId/:tinId', authenticate, yt.remove);       // xoá yêu thích (chỉ user hiện tại)
router.get('/user/:userId', authenticate, yt.listByUser);        // lấy danh sách yêu thích theo user hiện tại
router.get('/user/:userId/details', authenticate, yt.listWithTinDetails); // lấy danh sách yêu thích kèm thông tin tin đăng
router.get('/check', authenticate, yt.check);                    // kiểm tra ?tinId=..

module.exports = router;