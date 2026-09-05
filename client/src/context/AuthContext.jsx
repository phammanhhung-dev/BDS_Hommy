/**
 * AuthContext - Quản lý trạng thái đăng nhập
 * 
 * Chức năng:
 * - Kiểm tra user đã đăng nhập khi load app
 * - Auto-redirect đến trang phù hợp theo vai trò
 * - Cung cấp thông tin user cho toàn app
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Tạo context
const AuthContext = createContext(null);

// Hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};

// Các routes công khai (không cần redirect)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/dangky',
  '/tin-dang', // Prefix cho chi tiết tin đăng công khai
  '/xem-ngay', // Prefix cho xem qua QR
  '/khach-hang', // Module quản lý cho Khách hàng
  '/quan-ly', // Trang quản lý (cho khách hàng xem hợp đồng, ví, etc.)
];

// Hàm lấy route mặc định theo vai trò
const getDefaultRouteByRole = (vaiTroId, tenVaiTro) => {
  // Chuyển về số để so sánh chính xác
  const roleId = Number(vaiTroId);
  
  console.log('🧮 [Auth] getDefaultRouteByRole:', { vaiTroId, roleId, tenVaiTro });
  
  // VaiTroID: 1=Khách hàng, 2=NVBH, 3=Chủ dự án, 4=NVDH, 5=Admin
  if (roleId === 1 || tenVaiTro === 'Khách hàng' || tenVaiTro === 'KhachHang' || tenVaiTro === 'Customer') {
    return '/';
  }
  if (roleId === 2 || tenVaiTro === 'Nhân viên Bán hàng' || tenVaiTro === 'NhanVienBanHang') {
    return '/nhan-vien-ban-hang';
  }
  if (roleId === 3 || tenVaiTro === 'Chủ dự án' || tenVaiTro === 'chuduan') {
    return '/chu-du-an/dashboard';
  }
  if (roleId === 4 || tenVaiTro === 'Nhân viên Điều hành' || tenVaiTro === 'DieuHanh' || tenVaiTro === 'Operator') {
    return '/nvdh/dashboard';
  }
  if (roleId === 5 || tenVaiTro === 'Quản trị viên Hệ thống' || tenVaiTro === 'Admin') {
    return '/quan-ly';
  }
  // Không xác định → Trang chủ
  return '/';
};

// Kiểm tra route có phải là public không
const isPublicRoute = (pathname) => {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return pathname === route || pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
};

// Provider component
export const AuthProvider = ({ children }) => {
  console.log('🏠 [AuthProvider] Initializing...');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra đăng nhập khi mount
  useEffect(() => {
    console.log('🏠 [AuthProvider] useEffect mount - checking auth');
    checkAuthStatus();
  }, []);

  // Auto-redirect khi user thay đổi hoặc khi vào route '/'
  useEffect(() => {
    console.log('🔄 [Auth] useEffect triggered:', {
      loading,
      isAuthenticated,
      hasUser: !!user,
      pathname: location.pathname
    });
    
    if (!loading && isAuthenticated && user) {
      const currentPath = location.pathname;
      const hasAutoRedirected = sessionStorage.getItem('hasAutoRedirected') === 'true';
      
      // 1. Nếu đang ở trang '/login' hoặc '/dangky' -> luôn redirect về dashboard
      if (currentPath === '/login' || currentPath === '/dangky') {
        const vaiTroId = user?.VaiTroHoatDongID || user?.VaiTroID || user?.roleId;
        const tenVaiTro = user?.TenVaiTro || user?.VaiTro || user?.role;
        const defaultRoute = getDefaultRouteByRole(vaiTroId, tenVaiTro);
        
        console.log('🎯 [Auth] Redirecting already authenticated user from login/register:', {
          from: currentPath,
          to: defaultRoute,
          vaiTroId,
          tenVaiTro
        });
        
        if (defaultRoute !== '/') {
          navigate(defaultRoute, { replace: true });
        }
      }
      // 2. Nếu đang ở trang chủ '/' và chưa từng auto-redirect -> thực hiện redirect lần đầu
      else if (currentPath === '/' && !hasAutoRedirected) {
        const vaiTroId = user?.VaiTroHoatDongID || user?.VaiTroID || user?.roleId;
        const tenVaiTro = user?.TenVaiTro || user?.VaiTro || user?.role;
        const defaultRoute = getDefaultRouteByRole(vaiTroId, tenVaiTro);
        
        console.log('🎯 [Auth] Initial auto-redirect on app load:', {
          from: currentPath,
          to: defaultRoute
        });
        
        if (defaultRoute !== '/') {
          sessionStorage.setItem('hasAutoRedirected', 'true');
          navigate(defaultRoute, { replace: true });
        }
      }
      
      // Đánh dấu đã qua lần đầu để không redirect nữa khi navigate qua lại trang chủ
      if (currentPath !== '/login' && currentPath !== '/dangky' && currentPath !== '/') {
        sessionStorage.setItem('hasAutoRedirected', 'true');
      }
    }
  }, [loading, isAuthenticated, user, location.pathname, navigate]);


  // Kiểm tra trạng thái đăng nhập từ localStorage
  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      console.log('🔍 [Auth] Checking auth status:', {
        hasToken: !!token,
        hasUserStr: !!userStr,
        userStr: userStr?.substring(0, 100) // Log 100 ký tự đầu
      });

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        
        // Kiểm tra xem có phải cấu trúc nested không (có trường .user)
        const actualUser = userData.user || userData;
        
        console.log('✅ [Auth] User đã đăng nhập:', {
          VaiTroID: actualUser?.VaiTroID,
          VaiTroHoatDongID: actualUser?.VaiTroHoatDongID,
          TenVaiTro: actualUser?.TenVaiTro,
          NguoiDungID: actualUser?.NguoiDungID
        });
        
        setUser(actualUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('ℹ️ [Auth] Chưa đăng nhập');
      }
    } catch (error) {
      console.error('❌ [Auth] Lỗi kiểm tra auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    console.log('👋 [Auth] Đã đăng xuất');
    // Force reload để clear React state hoàn toàn
    window.location.href = '/login';
  };

  // Cập nhật user sau khi đăng nhập
  const updateUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Lấy vai trò hiện tại
  const getCurrentRole = () => {
    if (!user) return null;
    return {
      id: user?.VaiTroHoatDongID || user?.VaiTroID || user?.roleId,
      name: user?.TenVaiTro || user?.VaiTro || user?.role
    };
  };

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    checkAuthStatus,
    logout,
    updateUser,
    getCurrentRole,
    getDefaultRouteByRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
