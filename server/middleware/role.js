/**
 * Middleware phân quyền dựa trên vai trò
 * Kiểm tra người dùng có quyền truy cập endpoint không
 */

const db = require('../config/db');

/**
 * Tạo middleware kiểm tra vai trò
 * @param {Array<string>} allowedRoles Danh sách vai trò được phép truy cập
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra xem đã có thông tin user từ authMiddleware chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Chưa xác thực người dùng'
        });
      }

      // Nếu là mock user (development) thì bypass kiểm tra DB
      if (req.user.isMockUser) {
        const mockRoleName = req.user.vaiTro || process.env.MOCK_ROLE_NAME || 'ChuDuAn';
        req.user.vaiTros = [mockRoleName];

        const hasMockPermission =
          allowedRoles.length === 0 || allowedRoles.includes(mockRoleName);

        if (!hasMockPermission) {
          return res.status(403).json({
            success: false,
            message: `Không có quyền truy cập. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
          });
        }

        req.user.coQuyenTruyCap = true;
        return next();
      }

      let userRoles;
      try {
        // Lấy tất cả vai trò từ bảng mapping (nếu DB có)
        const [rows] = await db.execute(`
          SELECT vt.TenVaiTro, nvt.VaiTroID
          FROM nguoidung_vaitro nvt
          INNER JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
          WHERE nvt.NguoiDungID = ?
        `, [req.user.id]);
        userRoles = rows;
      } catch (dbError) {
        if (dbError.code === 'ER_NO_SUCH_TABLE') {
          console.warn('⚠️ [ROLE] Table nguoidung_vaitro không tồn tại. Dùng fallback theo token.');
          userRoles = [{
            TenVaiTro: req.user.vaiTroGoc || req.user.vaiTro || 'Unknown',
            VaiTroID: req.user.vaiTroId || null
          }];
        } else {
          throw dbError;
        }
      }

      if (userRoles.length === 0) {
        const fallbackRoleName = req.user.vaiTroGoc || req.user.vaiTro || 'Unknown';
        const fallbackRoleId = req.user.vaiTroId || null;

        if (fallbackRoleName && fallbackRoleName !== 'Unknown') {
          console.warn('⚠️ [ROLE] Không có bản ghi trong nguoidung_vaitro, dùng vai trò từ token:', fallbackRoleName);
          userRoles = [{
            TenVaiTro: fallbackRoleName,
            VaiTroID: fallbackRoleId
          }];
        } else {
          return res.status(403).json({
            success: false,
            message: 'Người dùng chưa được gán vai trò'
          });
        }
      }

      // Chuẩn hóa tên vai trò từ database (bỏ dấu và khoảng trắng)
      const normalizeRoleName = (name) => {
        return name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
          .replace(/\s+/g, '') // Bỏ khoảng trắng
          .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D'); // Đổi đ → d
      };

      // Kiểm tra quyền truy cập
      const userRoleNames = userRoles.map(role => role.TenVaiTro);
      const normalizedUserRoles = userRoleNames.map(normalizeRoleName);
      
      console.log('🔐 [ROLE] Raw roles:', userRoleNames);
      console.log('🔐 [ROLE] Normalized roles:', normalizedUserRoles);
      console.log('🔐 [ROLE] Allowed roles:', allowedRoles);
      
      // Case-insensitive comparison
      const normalizedAllowedRoles = allowedRoles.map(r => normalizeRoleName(r).toLowerCase());
      const normalizedUserRolesLower = normalizedUserRoles.map(r => r.toLowerCase());
      
      const hasPermission = normalizedAllowedRoles.some(role => normalizedUserRolesLower.includes(role));
      console.log('🔐 [ROLE] Has permission:', hasPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền truy cập. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
        });
      }

      // Gắn thông tin vai trò vào request
      req.user.vaiTros = normalizedUserRoles; // Tên đã chuẩn hóa
      req.user.vaiTrosGoc = userRoleNames; // Tên gốc để hiển thị
      req.user.coQuyenTruyCap = true;

      next();
    } catch (error) {
      console.error('Lỗi kiểm tra phân quyền:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền truy cập'
      });
    }
  };
};

/**
 * Helper: enforce exactly one role.
 * @param {string} roleName - required role
 * @returns {Function} Express middleware
 */
const requireRole = (roleName) => {
  if (!roleName) {
    throw new Error('requireRole yêu cầu tên vai trò hợp lệ');
  }
  return roleMiddleware([roleName]);
};

/**
 * Helper: enforce one of multiple roles.
 * @param {string[]} roleNames - allowed roles
 * @returns {Function} Express middleware
 */
const requireRoles = (roleNames = []) => {
  if (!Array.isArray(roleNames)) {
    throw new Error('requireRoles yêu cầu danh sách vai trò dạng mảng');
  }
  return roleMiddleware(roleNames);
};

/**
 * Middleware kiểm tra quyền chủ sở hữu tài nguyên
 * Đảm bảo người dùng chỉ có thể truy cập tài nguyên của chính họ
 */
const ownershipMiddleware = (resourceType, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user.id;

      let query = '';
      let params = [];

      switch (resourceType) {
        case 'TinDang':
          // Tin đăng có thể thuộc dự án hoặc độc lập (tìm theo ChuDuAnID trực tiếp)
          query = `
            SELECT td.TinDangID
            FROM tindang td
            LEFT JOIN duan da ON td.DuAnID = da.DuAnID
            WHERE td.TinDangID = ? AND (td.ChuDuAnID = ? OR da.ChuDuAnID = ?)
          `;
          params = [resourceId, userId, userId];
          break;

        case 'CuocHen':
          // CuocHen liên kết với tin đăng, tin đăng có thể độc lập hoặc thuộc dự án
          query = `
            SELECT ch.CuocHenID
            FROM cuochen ch
            INNER JOIN tindang td ON ch.TinDangID = td.TinDangID
            LEFT JOIN duan da ON td.DuAnID = da.DuAnID
            WHERE ch.CuocHenID = ? AND (td.ChuDuAnID = ? OR da.ChuDuAnID = ?)
          `;
          params = [resourceId, userId, userId];
          break;

        case 'DuAn':
          query = 'SELECT DuAnID FROM duan WHERE DuAnID = ? AND ChuDuAnID = ?';
          params = [resourceId, userId];
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Loại tài nguyên không được hỗ trợ'
          });
      }

      const [rows] = await db.execute(query, params);

      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập tài nguyên này'
        });
      }

      next();
    } catch (error) {
      console.error('Lỗi kiểm tra quyền sở hữu:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền sở hữu'
      });
    }
  };
};

/**
 * Middleware cho phép act-as (chuyển đổi vai trò)
 * Cho phép người dùng có nhiều vai trò hoạt động với vai trò khác
 */
const actAsMiddleware = () => {
  return async (req, res, next) => {
    try {
      const actAsRole = req.header('X-Act-As-Role');
      
      if (actAsRole && req.user.vaiTros && req.user.vaiTros.includes(actAsRole)) {
        // Ghi log act-as action
        const NhatKyHeThongService = require('../services/NhatKyHeThongService');
        await NhatKyHeThongService.ghiNhan(
          req.user.id,
          'act_as_role',
          'NguoiDung',
          req.user.id,
          { vaiTroHienTai: req.user.vaiTro },
          { vaiTroActAs: actAsRole },
          req.ip,
          req.get('User-Agent')
        );

        // Cập nhật vai trò hiện tại
        req.user.vaiTroActAs = actAsRole;
        req.user.isActingAs = true;
      }

      next();
    } catch (error) {
      console.error('Lỗi act-as middleware:', error);
      next(); // Không chặn request nếu có lỗi
    }
  };
};

module.exports = {
  roleMiddleware,
  requireRole,
  requireRoles,
  ownershipMiddleware,
  actAsMiddleware
};
