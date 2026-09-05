const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const db = require('../config/db'); // nếu cần dùng trực tiếp

// Helper: Tạo JWT token
const generateToken = (userId, vaiTroId) => {
  return jwt.sign(
    { userId, vaiTroId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' } // Token hết hạn sau 7 ngày
  );
};

// POST /api/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });

  try {
    // Query user với thông tin vai trò (JOIN với bảng vaitro)
    const sql = `
      SELECT n.*, v.TenVaiTro, v.VaiTroID
      FROM nguoidung n
      LEFT JOIN vaitro v ON n.VaiTroHoatDongID = v.VaiTroID
      WHERE n.Email = ?
    `;
    const [rows] = await db.query(sql, [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Thông tin đăng nhập không đúng' });

    const user = rows[0];

    // Phát hiện định dạng hash và so sánh tương ứng
    let passwordMatch = false;
    
    if (user.MatKhauHash.startsWith('$2a$') || user.MatKhauHash.startsWith('$2b$') || user.MatKhauHash.startsWith('$2y$')) {
      // Hash dạng bcrypt - dùng bcrypt.compare()
      passwordMatch = await bcrypt.compare(password, user.MatKhauHash);
    } else {
      // Hash dạng MD5 - so sánh trực tiếp sau khi hash password
      const passwordHash = crypto.createHash('md5').update(String(password)).digest('hex');
      passwordMatch = (user.MatKhauHash === passwordHash);
    }
    
    if (!passwordMatch) return res.status(401).json({ error: 'Thông tin đăng nhập không đúng' });

    // Tạo JWT token
    const token = generateToken(user.NguoiDungID, user.VaiTroHoatDongID);

    // Gửi thông báo đăng nhập thành công
    try {
      const ThongBaoService = require('../services/ThongBaoService');
      const thoiGian = new Date().toLocaleString('vi-VN');
      await ThongBaoService.guiThongBao(
        user.NguoiDungID,
        'dang_nhap',
        'Đăng nhập thành công',
        `Tài khoản của bạn vừa đăng nhập thành công vào hệ thống lúc ${thoiGian}.`,
        { type: 'tin-dang', subType: 'dang_nhap', icon: '🔐' },
        '/'
      );
    } catch (notifErr) {
      console.warn('[Auth] Lỗi tạo thông báo đăng nhập:', notifErr.message);
    }

    // loại bỏ trường mật khẩu khi trả về
    const { MatKhauHash, ...safeUser } = user;
    
    res.json({ 
      success: true,
      token,
      user: safeUser 
    });
  } catch (err) {
    console.error('Login error:', err);    if (err.code === 'ER_DUP_ENTRY') {
      const message = err.sqlMessage?.includes('Email')
        ? 'Email này đã được sử dụng'
        : err.sqlMessage?.includes('SoDienThoai')
        ? 'Số điện thoại này đã được sử dụng'
        : 'Dữ liệu đã tồn tại';
      return res.status(409).json({ success: false, error: message });
    }    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
  }
};

// POST /api/register
exports.register = async (req, res) => {
  const { name, email, phone, password, roleId } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'name, email, phone, password là bắt buộc' });
  }

  // Chỉ cho phép đăng ký Khách hàng (1) hoặc Chủ dự án (3)
  const allowedPublicRoles = [1, 3];
  const safeRoleId = allowedPublicRoles.includes(Number(roleId)) ? Number(roleId) : 1;

  try {
    const matKhauHash = crypto.createHash('md5').update(String(password)).digest('hex');
    const [result] = await User.createNguoiDung(name, email, phone, matKhauHash, safeRoleId);

    const token = generateToken(result.insertId, safeRoleId);

    // Gửi thông báo chào mừng thành viên mới
    try {
      const ThongBaoService = require('../services/ThongBaoService');
      await ThongBaoService.guiThongBao(
        result.insertId,
        'khuyen_mai',
        'Chào mừng thành viên mới!',
        'Cảm ơn bạn đã đăng ký tài khoản Hommy. Tặng bạn Voucher VIP20OFF giảm 20% khi thanh toán gói tin VIP.',
        { type: 'khuyen-mai', subType: 'voucher', code: 'VIP20OFF', icon: '🎁', url: '/vi' },
        '/vi'
      );
    } catch (notifErr) {
      console.warn('[Auth] Lỗi tạo thông báo chào mừng:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertId,
        TenDayDu: name,
        Email: email,
        SoDienThoai: phone,
        VaiTroHoatDongID: safeRoleId,
        TenVaiTro: safeRoleId === 3 ? 'Chủ dự án' : 'Khách hàng'
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      const message = err.sqlMessage?.includes('Email')
        ? 'Email này đã được sử dụng'
        : err.sqlMessage?.includes('SoDienThoai')
        ? 'Số điện thoại này đã được sử dụng'
        : 'Dữ liệu đã tồn tại';
      return res.status(409).json({ success: false, error: message, message });
    }
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký', message: 'Lỗi hệ thống khi đăng ký' });
  }
};