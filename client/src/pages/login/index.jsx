import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding } from 'react-icons/fa';
import './login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { getDefaultRouteByRole, updateUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authApi.login({
        email,
        password,
      });

      const { token, user } = res.data || {};
      if (!token || !user) {
        throw new Error('Phản hồi đăng nhập không hợp lệ: thiếu token hoặc user');
      }

      localStorage.setItem('token', String(token));
      localStorage.setItem('user', JSON.stringify({ token, ...user }));

      updateUser(user);

      const vaiTroId = user?.VaiTroHoatDongID || user?.VaiTroID || user?.roleId;
      const tenVaiTro = user?.TenVaiTro || user?.VaiTro || user?.role;
      const defaultRoute = getDefaultRouteByRole(vaiTroId, tenVaiTro);

      navigate(defaultRoute);
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError('Sai email hoặc mật khẩu. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-bds">
      {/* Background gradient */}
      <div className="login-page-bds__bg" />

      <div className="login-page-bds__container">
        {/* Left panel - Branding */}
        <div className="login-page-bds__left">
          <div className="login-page-bds__brand">
            <div className="login-page-bds__brand-icon">
              <FaBuilding size={48} />
            </div>
            <h1 className="login-page-bds__brand-name">Hommy BĐS</h1>
            <p className="login-page-bds__brand-tagline">
              Nền tảng quản lý bất động sản chuyên nghiệp
            </p>
          </div>

          <div className="login-page-bds__features">
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">🏢</span>
              <div>
                <h3>Quản lý dự án BĐS</h3>
                <p>Quản lý toàn bộ dự án, tin đăng và giao dịch</p>
              </div>
            </div>
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">🤖</span>
              <div>
                <h3>Định giá AI thông minh</h3>
                <p>Dự đoán giá BĐS bằng Machine Learning</p>
              </div>
            </div>
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">📊</span>
              <div>
                <h3>Dashboard phân tích</h3>
                <p>Báo cáo và thống kê theo thời gian thực</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Login form */}
        <div className="login-page-bds__right">
          <div className="login-page-bds__form-wrapper">
            <div className="login-page-bds__form-header">
              <h2>Chào mừng trở lại!</h2>
              <p>Đăng nhập vào tài khoản Hommy BĐS của bạn</p>
            </div>

            <form className="login-page-bds__form" onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="login-page-bds__field">
                <label htmlFor="email">Email</label>
                <div className="login-page-bds__input-wrapper">
                  <FaEnvelope className="login-page-bds__input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="Nhập địa chỉ email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="login-page-bds__field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="login-page-bds__input-wrapper">
                  <FaLock className="login-page-bds__input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-page-bds__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="login-page-bds__forgot">
                <a href="#" className="login-page-bds__forgot-link">Quên mật khẩu?</a>
              </div>

              {/* Error message */}
              {error && (
                <div className="login-page-bds__error" role="alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="login-page-bds__submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="login-page-bds__loading">
                    <span className="login-page-bds__spinner" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              {/* Divider */}
              <div className="login-page-bds__divider">
                <span>hoặc</span>
              </div>

              {/* Register link */}
              <div className="login-page-bds__register">
                <p>
                  Chưa có tài khoản?{' '}
                  <Link to="/dangky" className="login-page-bds__register-link">
                    Đăng ký miễn phí
                  </Link>
                </p>
              </div>

              {/* Back home */}
              <button
                type="button"
                className="login-page-bds__back"
                onClick={() => navigate('/')}
              >
                ← Quay lại trang chủ
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
