import React from 'react';
import './BadgeStatusOperator.css';

/**
 * Status Badge component
 * @param {Object} props
 * @param {string} props.status - Status value
 * @param {Object} props.statusMap - {value: {label, className}}
 */
function BadgeStatusOperator({ status, statusMap }) {
  const config = statusMap?.[status] || { label: status, className: '' };
  
  return (
    <span className={`operator-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

// Predefined status maps
BadgeStatusOperator.TIN_DANG_STATUS = {
  ChoDuyet: { label: 'Chờ duyệt', className: 'operator-badge--pending' },
  DaDang: { label: 'Đã đăng', className: 'operator-badge--approved' },
  TuChoi: { label: 'Từ chối', className: 'operator-badge--rejected' },
  TamNgung: { label: 'Tạm ngưng', className: 'operator-badge--inactive' }
};

BadgeStatusOperator.DU_AN_STATUS = {
  HoatDong: { label: 'Hoạt động', className: 'operator-badge--active' },
  NgungHoatDong: { label: 'Ngưng hoạt động', className: 'operator-badge--rejected' },
  LuuTru: { label: 'Lưu trữ', className: 'operator-badge--inactive' }
};

BadgeStatusOperator.NHAN_VIEN_STATUS = {
  Active: { label: 'Hoạt động', className: 'operator-badge--active' },
  Inactive: { label: 'Không hoạt động', className: 'operator-badge--inactive' }
};

BadgeStatusOperator.BIEN_BAN_STATUS = {
  ChuaBanGiao: { label: 'Chưa bàn giao', className: 'operator-badge--pending' },
  DangBanGiao: { label: 'Đang bàn giao', className: 'operator-badge--pending' },
  DaBanGiao: { label: 'Đã bàn giao', className: 'operator-badge--approved' }
};

export default BadgeStatusOperator;






