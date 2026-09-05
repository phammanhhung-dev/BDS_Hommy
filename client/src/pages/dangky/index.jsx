import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaPhone, FaUserTie, FaBuilding } from 'react-icons/fa';
import '../login/login.css'; // Dùng cùng CSS với trang login

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('khachhang');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { getDefaultRouteByRole, updateUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let roleId;
      switch (role) {
        case 'chuduan':
          roleId = 3;
          break;
        case 'nhanvienbanhang':
          roleId = 2;
          break;
        case 'nhanviendieuhanh':
          roleId = 4;
          break;
        default:
          roleId = 1;
      }

      const payload = {
        name: fullname,
        email,
        phone,
        password,
        roleId,
      };

      const res = await authApi.register(payload);
      const { token, user } = res.data;

      if (token) {
        localStorage.setItem('token', String(token));
        localStorage.setItem('user', JSON.stringify({ token, ...user }));
        updateUser(user);

        const vaiTroId = user?.VaiTroHoatDongID || user?.VaiTroID || user?.roleId;
        const tenVaiTro = user?.TenVaiTro || user?.VaiTro || user?.role;
        const defaultRoute = getDefaultRouteByRole(vaiTroId, tenVaiTro);

        navigate(defaultRoute);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Lỗi đăng ký:', err?.response?.data || err.message);
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'khachhang', label: 'Khách hàng / Người mua', icon: '🏠', desc: 'Tìm kiếm và mua/thuê bất động sản' },
    { value: 'chuduan', label: 'Chủ dự án / Nhà đầu tư', icon: '🏢', desc: 'Đăng tin và quản lý dự án BĐS' },
  ];

  return (
    <div className="login-page-bds">
      <div className="login-page-bds__bg" />

      <div className="login-page-bds__container">
        {/* Left Panel - Branding */}
        <div className="login-page-bds__left">
          <div className="login-page-bds__brand">
            <div className="login-page-bds__brand-icon">
              <FaBuilding size={48} />
            </div>
            <h1 className="login-page-bds__brand-name">Hommy BĐS</h1>
            <p className="login-page-bds__brand-tagline">
              Tham gia cộng đồng bất động sản hàng đầu Việt Nam
            </p>
          </div>

          <div className="login-page-bds__features">
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">🔍</span>
              <div>
                <h3>Tìm kiếm BĐS dễ dàng</h3>
                <p>Hàng nghìn tin đăng mua bán, cho thuê uy tín</p>
              </div>
            </div>
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">📱</span>
              <div>
                <h3>Quản lý mọi nơi</h3>
                <p>Theo dõi giao dịch và cuộc hẹn trên mọi thiết bị</p>
              </div>
            </div>
            <div className="login-page-bds__feature-item">
              <span className="login-page-bds__feature-icon">🛡️</span>
              <div>
                <h3>An toàn & Bảo mật</h3>
                <p>Xác thực KYC, hợp đồng điện tử có hiệu lực pháp lý</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="login-page-bds__right">
          <div className="login-page-bds__form-wrapper">
            <div className="login-page-bds__form-header">
              <h2>Tạo tài khoản mới</h2>
              <p>Đăng ký để bắt đầu trải nghiệm Hommy BĐS</p>
            </div>

            <form className="login-page-bds__form" onSubmit={handleSubmit}>
              {/* Full name */}
              <div className="login-page-bds__field">
                <label htmlFor="fullname">Họ và tên</label>
                <div className="login-page-bds__input-wrapper">
                  <FaUser className="login-page-bds__input-icon" />
                  <input
                    type="text"
                    id="fullname"
                    placeholder="Nhập họ và tên đầy đủ"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-page-bds__field">
                <label htmlFor="email">Email</label>
                <div className="login-page-bds__input-wrapper">
                  <FaEnvelope className="login-page-bds__input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="Nhập địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="login-page-bds__field">
                <label htmlFor="phone">Số điện thoại</label>
                <div className="login-page-bds__input-wrapper">
                  <FaPhone className="login-page-bds__input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-page-bds__field">
                <label htmlFor="reg-password">Mật khẩu</label>
                <div className="login-page-bds__input-wrapper">
                  <FaLock className="login-page-bds__input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
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

              {/* Role Selection */}
              <div className="login-page-bds__field">
                <label htmlFor="role">Loại tài khoản</label>
                <div className="login-page-bds__input-wrapper">
                  <FaUserTie className="login-page-bds__input-icon" />
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    style={{ paddingLeft: '2.75rem', appearance: 'none', cursor: 'pointer' }}
                  >
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  {roleOptions.find(o => o.value === role)?.desc}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="login-page-bds__error" role="alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="login-page-bds__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="login-page-bds__loading">
                    <span className="login-page-bds__spinner" />
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  'Tạo tài khoản miễn phí'
                )}
              </button>

              <div className="login-page-bds__divider">
                <span>đã có tài khoản?</span>
              </div>

              <div className="login-page-bds__register">
                <Link to="/login" className="login-page-bds__register-link">
                  Đăng nhập ngay
                </Link>
              </div>

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

export default Register;
