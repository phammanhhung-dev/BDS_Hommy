/**
 * ProtectedRoute - Component bảo vệ route theo vai trò
 * 
 * Quy tắc:
 * - VaiTroID 1: Khách hàng - chỉ vào trang công khai + trang khách hàng
 * - VaiTroID 2: NVBH - chỉ vào /nhan-vien-ban-hang/*
 * - VaiTroID 3: Chủ dự án - chỉ vào /chu-du-an/*, /cai-dat, /xac-thuc-kyc, /vi
 * - VaiTroID 4: NVDH/Operator - chỉ vào /nvdh/*
 * - VaiTroID 5: Admin - có thể vào TẤT CẢ trang
 */

import { Navigate, useLocation } from 'react-router-dom';

// Định nghĩa route cho từng role
const ROLE_ROUTES = {
  // VaiTroID 1: Khách hàng
  1: {
    allowedPrefixes: ['/quan-ly', '/vi', '/tin-dang'],
    defaultRoute: '/',
    roleName: 'Khách hàng'
  },
  // VaiTroID 2: Nhân viên Bán hàng
  2: {
    allowedPrefixes: ['/nhan-vien-ban-hang'],
    defaultRoute: '/nhan-vien-ban-hang',
    roleName: 'Nhân viên Bán hàng'
  },
  // VaiTroID 3: Chủ dự án
  3: {
    allowedPrefixes: ['/chu-du-an', '/cai-dat', '/xac-thuc-kyc', '/vi', '/kyc-debug'],
    defaultRoute: '/chu-du-an/dashboard',
    roleName: 'Chủ dự án'
  },
  // VaiTroID 4: NVDH/Operator
  4: {
    allowedPrefixes: ['/nvdh'],
    defaultRoute: '/nvdh/dashboard',
    roleName: 'Nhân viên Điều hành'
  }
};

// Các tên vai trò alternative
const ROLE_NAME_MAPPING = {
  'NhanVienBanHang': 2,
  'Nhân viên Bán hàng': 2,
  'ChuDuAn': 3,
  'Chủ dự án': 3,
  'chuduan': 3,
  'DieuHanh': 4,
  'Nhân viên Điều hành': 4,
  'Operator': 4,
  'Admin': 5,
  'Quản trị viên Hệ thống': 5
};

/**
 * Lấy VaiTroID từ user object
 */
const getRoleId = (user) => {
  if (!user) return null;
  
  // Ưu tiên VaiTroHoatDongID > VaiTroID > roleId
  let roleId = user.VaiTroHoatDongID || user.VaiTroID || user.roleId;
  
  // Nếu là số thì return
  if (typeof roleId === 'number') return roleId;
  
  // Nếu là string số thì convert
  if (typeof roleId === 'string' && !isNaN(roleId)) return parseInt(roleId);
  
  // Nếu có tên vai trò, map về ID
  const roleName = user.TenVaiTro || user.VaiTro || user.role;
  if (roleName && ROLE_NAME_MAPPING[roleName]) {
    return ROLE_NAME_MAPPING[roleName];
  }
  
  return null;
};

/**
 * Kiểm tra user có quyền truy cập route không
 */
const canAccessRoute = (roleId, pathname) => {
  // Admin (VaiTroID 5) có thể vào tất cả
  if (roleId === 5) return true;
  
  // Khách hàng (VaiTroID 1 hoặc null) - không được vào route của role khác
  // NGOẠI TRỪ /quan-ly (trang quản lý hợp đồng, ví của khách hàng)
  if (roleId === 1 || roleId === null) {
    // Các prefix chỉ dành cho nhân viên/chủ dự án, khách hàng KHÔNG được vào
    const restrictedPrefixes = ['/nhan-vien-ban-hang', '/chu-du-an', '/nvdh'];
    return !restrictedPrefixes.some(prefix => pathname.startsWith(prefix));
  }
  
  // Các role khác (2, 3, 4) - chỉ vào route được phép
  const roleConfig = ROLE_ROUTES[roleId];
  if (!roleConfig) return false;
  
  return roleConfig.allowedPrefixes.some(prefix => pathname.startsWith(prefix));
};

/**
 * Component ProtectedRoute
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {number[]} props.allowedRoles - Danh sách VaiTroID được phép (optional)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  
  // Lấy thông tin user từ localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Chưa đăng nhập → redirect về login
  if (!token || !userStr) {
    console.log('🚫 [ProtectedRoute] Chưa đăng nhập, redirect về /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  let user;
  try {
    const userData = JSON.parse(userStr);
    user = userData.user || userData;
  } catch {
    console.log('🚫 [ProtectedRoute] Lỗi parse user, redirect về /login');
    return <Navigate to="/login" replace />;
  }
  
  const roleId = getRoleId(user);
  const pathname = location.pathname;
  
  console.log('🔐 [ProtectedRoute] Check:', { pathname, roleId, roleName: user?.TenVaiTro });
  
  // Kiểm tra quyền truy cập
  if (!canAccessRoute(roleId, pathname)) {
    // Lấy route mặc định của role
    const roleConfig = ROLE_ROUTES[roleId];
    const defaultRoute = roleConfig?.defaultRoute || '/';
    
    console.log(`🚫 [ProtectedRoute] Role ${roleId} không được phép vào ${pathname}, redirect về ${defaultRoute}`);
    
    return <Navigate to={defaultRoute} replace />;
  }
  
  // Nếu có allowedRoles specific, kiểm tra thêm
  if (allowedRoles && allowedRoles.length > 0) {
    // Admin luôn được phép
    if (roleId !== 5 && !allowedRoles.includes(roleId)) {
      const roleConfig = ROLE_ROUTES[roleId];
      const defaultRoute = roleConfig?.defaultRoute || '/';
      
      console.log(`🚫 [ProtectedRoute] Role ${roleId} không trong allowedRoles, redirect về ${defaultRoute}`);
      
      return <Navigate to={defaultRoute} replace />;
    }
  }
  
  return children;
}

/**
 * HOC để wrap route với protection
 */
export function withRoleProtection(Component, allowedRoles = []) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

