/**
 * @fileoverview Socket.IO JWT Authentication Middleware
 * @module socketAuth
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Socket.IO middleware để xác thực JWT token
 * Token được truyền qua socket handshake: { auth: { token: 'xxx' } }
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Mock token chỉ hoạt động trong development
    if (process.env.NODE_ENV !== 'production') {
      const mockToken = process.env.MOCK_DEV_TOKEN;
      if (mockToken && token === mockToken) {
        socket.user = {
          NguoiDungID: parseInt(process.env.MOCK_USER_ID || '1', 10),
          id: parseInt(process.env.MOCK_USER_ID || '1', 10),
          TenDayDu: process.env.MOCK_USER_NAME || 'Chu Du An Dev',
          Email: process.env.MOCK_USER_EMAIL || 'chu.du.an.dev@daphongtro.local',
          vaiTroId: parseInt(process.env.MOCK_ROLE_ID || '3', 10),
          vaiTro: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
          isMockUser: true
        };
        return next();
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const userId = decoded.userId || decoded.id || decoded.NguoiDungID;

    // Kiểm tra user còn active trong DB
    const [userRows] = await db.execute(
      'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
      [userId]
    );

    if (userRows.length === 0) {
      return next(new Error('Authentication error: User inactive or not found'));
    }

    const user = userRows[0];

    const [roleRows] = await db.execute(
      'SELECT TenVaiTro FROM vaitro WHERE VaiTroID = ?',
      [user.VaiTroHoatDongID]
    );

    const rawRoleName = roleRows[0]?.TenVaiTro || 'Unknown';
    const normalizedRoleName = rawRoleName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D');

    socket.user = {
      NguoiDungID: user.NguoiDungID,
      id: user.NguoiDungID,
      TenDayDu: user.TenDayDu,
      Email: user.Email,
      vaiTroId: user.VaiTroHoatDongID,
      vaiTro: normalizedRoleName,
      isMockUser: false
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    console.error('[Socket.IO] Auth error:', error.message);
    next(new Error('Authentication error'));
  }
};

module.exports = socketAuth;
