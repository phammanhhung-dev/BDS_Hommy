import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ChuDuAn/CaiDat.css'; // Reuse CSS của chủ dự án
import '../../styles/ChuDuAnDesignSystem.css'; // Reuse Design System

// React Icons
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles
} from 'react-icons/hi2';

/**
 * Component Cài đặt cho Admin/Operator/Khách hàng trong trang Quản lý
 * Reuse logic từ module Chủ dự án nhưng bỏ layout wrapper
 */
function CaiDatAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('thong-tin');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({});
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load user data from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    setFormData(user);
    setIsLoading(false);
  }, []);

  const tabs = [
    { id: 'thong-tin', label: 'Thông tin cá nhân', icon: <HiOutlineUser /> },
    { id: 'bao-mat', label: 'Bảo mật', icon: <HiOutlineShieldCheck /> },
    { id: 'thong-bao', label: 'Thông báo', icon: <HiOutlineBell /> },
    // { id: 'thanh-toan', label: 'Thanh toán', icon: <HiOutlineCreditCard /> }, // Tạm ẩn thanh toán cho admin/khách
    // { id: 'tai-lieu', label: 'Tài liệu', icon: <HiOutlineDocumentText /> }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      const updatedUser = { ...userData, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      
      setSuccessMessage('Đã lưu thông tin thành công!');
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
    setErrorMessage('');
  };

  const renderThongTin = () => (
    <div className="caidat-content">
      <div className="caidat-section">
        <h2 className="caidat-section-title">Thông tin cơ bản</h2>
        
        <div className="caidat-form">
          <div className="caidat-form-row">
            <div className="caidat-form-group">
              <label className="caidat-label">Họ và tên</label>
              <input
                type="text"
                name="TenDayDu"
                value={formData.TenDayDu || formData.tenDayDu || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="caidat-input"
                placeholder="Nhập họ và tên"
              />
            </div>
            
            <div className="caidat-form-group">
              <label className="caidat-label">Email</label>
              <input
                type="email"
                name="Email"
                value={formData.Email || formData.email || ''}
                onChange={handleInputChange}
                disabled={true}
                className="caidat-input disabled"
                placeholder="Email"
              />
              <small className="caidat-help-text">Email không thể thay đổi</small>
            </div>
          </div>

          <div className="caidat-form-row">
            <div className="caidat-form-group">
              <label className="caidat-label">Số điện thoại</label>
              <input
                type="tel"
                name="SoDienThoai"
                value={formData.SoDienThoai || formData.soDienThoai || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="caidat-input"
                placeholder="0901234567"
              />
            </div>
            
            <div className="caidat-form-group">
              <label className="caidat-label">Ngày sinh</label>
              <input
                type="date"
                name="NgaySinh"
                value={formData.NgaySinh || formData.ngaySinh || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="caidat-input"
              />
            </div>
          </div>

          <div className="caidat-form-group full-width">
            <label className="caidat-label">Địa chỉ</label>
            <textarea
              name="DiaChi"
              value={formData.DiaChi || formData.diaChi || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="caidat-textarea"
              rows="3"
              placeholder="Nhập địa chỉ liên hệ"
            />
          </div>
        </div>
      </div>

      <div className="caidat-section">
        <h2 className="caidat-section-title">Giấy tờ định danh</h2>
        
        <div className="caidat-form">
          <div className="caidat-form-row">
            <div className="caidat-form-group">
              <label className="caidat-label">Số CCCD/CMND</label>
              <input
                type="text"
                name="SoCCCD"
                value={formData.SoCCCD || formData.soCCCD || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="caidat-input"
                placeholder="Số CCCD 12 số"
                maxLength="12"
              />
            </div>
            
            <div className="caidat-form-group">
              <label className="caidat-label">Ngày cấp</label>
              <input
                type="date"
                name="NgayCapCCCD"
                value={formData.NgayCapCCCD || formData.ngayCapCCCD || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="caidat-input"
              />
            </div>
          </div>

          <div className="caidat-form-group full-width">
            <label className="caidat-label">Nơi cấp</label>
            <input
              type="text"
              name="NoiCapCCCD"
              value={formData.NoiCapCCCD || formData.noiCapCCCD || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="caidat-input"
              placeholder="Ví dụ: Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư"
            />
          </div>
        </div>
      </div>

      <div className="caidat-section">
        <h2 className="caidat-section-title">Trạng thái tài khoản</h2>
        
        <div className="caidat-status-grid">
          <div className="caidat-status-card">
            <div className="caidat-status-icon verified">
              <HiOutlineCheck />
            </div>
            <div className="caidat-status-info">
              <div className="caidat-status-label">Vai trò</div>
              <div className="caidat-status-value">{userData.TenVaiTro || userData.vaiTro || 'Người dùng'}</div>
            </div>
          </div>

          <div className="caidat-status-card">
            <div className={`caidat-status-icon ${userData.TrangThaiXacMinh === 'DaXacMinh' ? 'verified' : 'warning'}`}>
              {userData.TrangThaiXacMinh === 'DaXacMinh' ? <HiOutlineCheck /> : <HiOutlineExclamationTriangle />}
            </div>
            <div className="caidat-status-info">
              <div className="caidat-status-label">Xác minh</div>
              <div className="caidat-status-value">
                {userData.TrangThaiXacMinh === 'DaXacMinh' ? 'Đã xác minh' : 
                 userData.TrangThaiXacMinh === 'ChoDuyet' ? 'Đang chờ duyệt' : 'Chưa xác minh'}
              </div>
              {userData.TrangThaiXacMinh !== 'DaXacMinh' && userData.TrangThaiXacMinh !== 'ChoDuyet' && (
                <button 
                  className="caidat-btn-verify"
                  onClick={() => navigate('/xac-thuc-kyc')}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Xác thực ngay
                </button>
              )}
            </div>
          </div>

          <div className="caidat-status-card">
            <div className={`caidat-status-icon ${userData.TrangThai === 'HoatDong' ? 'verified' : 'warning'}`}>
              <HiOutlineCheckCircle />
            </div>
            <div className="caidat-status-info">
              <div className="caidat-status-label">Trạng thái</div>
              <div className="caidat-status-value">
                {userData.TrangThai === 'HoatDong' ? 'Hoạt động' : userData.TrangThai || 'Không xác định'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="caidat-actions">
        {!isEditing ? (
          <button 
            className="caidat-btn primary"
            onClick={() => setIsEditing(true)}
          >
            <HiOutlinePencil />
            <span>Chỉnh sửa</span>
          </button>
        ) : (
          <>
            <button 
              className="caidat-btn success"
              onClick={handleSave}
              disabled={isLoading}
            >
              <HiOutlineCheck />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
            <button 
              className="caidat-btn secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <HiOutlineXMark />
              <span>Hủy</span>
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="caidat-message success">
          <HiOutlineCheck />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="caidat-message error">
          <HiOutlineExclamationTriangle />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );

  const renderBaoMat = () => (
    <div className="caidat-content">
      <div className="caidat-section">
        <h2 className="caidat-section-title">Đổi mật khẩu</h2>
        
        <div className="caidat-form">
          <div className="caidat-form-group">
            <label className="caidat-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="caidat-input"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div className="caidat-form-group">
            <label className="caidat-label">Mật khẩu mới</label>
            <input
              type="password"
              className="caidat-input"
              placeholder="Nhập mật khẩu mới"
            />
            <small className="caidat-help-text">Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số</small>
          </div>

          <div className="caidat-form-group">
            <label className="caidat-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              className="caidat-input"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <div className="caidat-actions">
          <button className="caidat-btn primary">
            <HiOutlineKey />
            <span>Đổi mật khẩu</span>
          </button>
        </div>
      </div>

      <div className="caidat-section">
        <h2 className="caidat-section-title">Xác thực hai yếu tố (2FA)</h2>
        <p className="caidat-description">
          Bảo vệ tài khoản của bạn bằng xác thực hai yếu tố. Tính năng đang phát triển.
        </p>
        <button className="caidat-btn secondary" disabled>
          <HiOutlineShieldCheck />
          <span>Kích hoạt 2FA (Sắp có)</span>
        </button>
      </div>
    </div>
  );

  const renderThongBao = () => (
    <div className="caidat-content">
      <div className="caidat-section">
        <h2 className="caidat-section-title">Cài đặt thông báo</h2>
        <p className="caidat-description">
          Quản lý cách bạn nhận thông báo từ hệ thống.
        </p>

        <div className="caidat-notification-list">
          <div className="caidat-notification-item">
            <div className="caidat-notification-info">
              <div className="caidat-notification-title">Thông báo cuộc hẹn mới</div>
              <div className="caidat-notification-desc">Nhận thông báo khi có khách đặt lịch xem bất động sản</div>
            </div>
            <label className="caidat-switch">
              <input type="checkbox" defaultChecked />
              <span className="caidat-switch-slider"></span>
            </label>
          </div>

          <div className="caidat-notification-item">
            <div className="caidat-notification-info">
              <div className="caidat-notification-title">Tin đăng được duyệt</div>
              <div className="caidat-notification-desc">Thông báo khi tin đăng của bạn được phê duyệt</div>
            </div>
            <label className="caidat-switch">
              <input type="checkbox" defaultChecked />
              <span className="caidat-switch-slider"></span>
            </label>
          </div>

          <div className="caidat-notification-item">
            <div className="caidat-notification-info">
              <div className="caidat-notification-title">Thông báo tin nhắn</div>
              <div className="caidat-notification-desc">Nhận thông báo khi có tin nhắn mới từ khách hàng</div>
            </div>
            <label className="caidat-switch">
              <input type="checkbox" defaultChecked />
              <span className="caidat-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading && !userData.Email) {
    return (
      <div className="caidat-loading">
        <div className="caidat-spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    // Không có wrapper div.chu-du-an-layout, nhúng trực tiếp
    <div className="caidat-container" style={{ padding: 0 }}>
      {/* Header */}
      <div className="caidat-header">
        <div className="caidat-header-content">
          <div className="caidat-title-wrapper">
            <HiOutlineSparkles className="caidat-title-icon" />
            <h1 className="caidat-title">Cài đặt tài khoản</h1>
          </div>
          <p className="caidat-subtitle">Quản lý thông tin cá nhân và tùy chọn tài khoản của bạn</p>
        </div>
      </div>

      <div className="caidat-layout">
        {/* Tabs */}
        <div className="caidat-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`caidat-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="caidat-tab-icon">{tab.icon}</span>
              <span className="caidat-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="caidat-main">
          {activeTab === 'thong-tin' && renderThongTin()}
          {activeTab === 'bao-mat' && renderBaoMat()}
          {activeTab === 'thong-bao' && renderThongBao()}
        </div>
      </div>
    </div>
  );
}

export default CaiDatAdmin;
