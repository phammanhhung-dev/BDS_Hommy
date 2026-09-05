/**
 * StatusBadge - Badge hiển thị trạng thái
 * Hỗ trợ các trạng thái của cuộc hẹn và giao dịch
 */

import React from 'react';
import './StatusBadge.css';

// Mapping trạng thái cuộc hẹn
const statusConfig = {
  // Cuộc hẹn
  'DaYeuCau': { label: 'Đã yêu cầu', variant: 'info' },
  'ChoXacNhan': { label: 'Chờ xác nhận', variant: 'warning' },
  'DaXacNhan': { label: 'Đã xác nhận', variant: 'success' },
  'DaDoiLich': { label: 'Đã đổi lịch', variant: 'info' },
  'HuyBoiKhach': { label: 'Hủy bởi khách', variant: 'danger' },
  'HuyBoiHeThong': { label: 'Hủy bởi hệ thống', variant: 'danger' },
  'KhachKhongDen': { label: 'Khách không đến', variant: 'danger' },
  'HoanThanh': { label: 'Hoàn thành', variant: 'success' },
  
  // Giao dịch
  'DaUyQuyen': { label: 'Chờ xác nhận', variant: 'warning' },
  'DaGhiNhan': { label: 'Đã xác nhận', variant: 'success' },
  'DaHoanTra': { label: 'Đã hoàn trả', variant: 'secondary' },
  'DaRutVe': { label: 'Đã rút về', variant: 'info' },
  
  // Phê duyệt
  'ChoPheDuyet': { label: 'Chờ phê duyệt', variant: 'warning' },
  'DaPheDuyet': { label: 'Đã phê duyệt', variant: 'success' },
  'TuChoi': { label: 'Từ chối', variant: 'danger' }
};

const StatusBadge = ({ status, size = 'md', showDot = false, className = '' }) => {
  const config = statusConfig[status] || { label: status, variant: 'secondary' };

  return (
    <span
      className={`nvbh-status-badge nvbh-status-badge--${config.variant} nvbh-status-badge--${size} ${className}`}
      role="status"
      aria-label={config.label}
    >
      {showDot && <span className="nvbh-status-badge__dot" />}
      <span className="nvbh-status-badge__label">{config.label}</span>
    </span>
  );
};

export default StatusBadge;








