/**
 * Activity Timeline Component
 * Hiển thị lịch sử hoạt động của cuộc hẹn dạng timeline đẹp
 */

import React from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineCalendarDays,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineClock
} from 'react-icons/hi2';
import { formatDate } from '../../utils/nvbhHelpers';
import './ActivityTimeline.css';

const ActivityTimeline = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="nvbh-timeline-empty">
        <HiOutlineClock />
        <p>Chưa có hoạt động nào</p>
      </div>
    );
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case 'xac_nhan':
        return <HiOutlineCheckCircle className="nvbh-timeline-icon nvbh-timeline-icon--success" />;
      case 'doi_lich':
        return <HiOutlineCalendarDays className="nvbh-timeline-icon nvbh-timeline-icon--warning" />;
      case 'huy':
        return <HiOutlineXCircle className="nvbh-timeline-icon nvbh-timeline-icon--danger" />;
      case 'bao_cao':
        return <HiOutlineDocumentText className="nvbh-timeline-icon nvbh-timeline-icon--info" />;
      default:
        return <HiOutlineClock className="nvbh-timeline-icon nvbh-timeline-icon--default" />;
    }
  };

  const getActivityTitle = (action) => {
    switch (action) {
      case 'xac_nhan':
        return 'Xác nhận cuộc hẹn';
      case 'doi_lich':
        return 'Đổi lịch cuộc hẹn';
      case 'huy':
        return 'Hủy cuộc hẹn';
      case 'bao_cao':
        return 'Báo cáo kết quả';
      default:
        return 'Hoạt động';
    }
  };

  const getActivityDescription = (activity) => {
    const parts = [];
    
    if (activity.note) {
      parts.push(activity.note);
    }

    if (activity.action === 'doi_lich' && activity.oldTime && activity.newTime) {
      parts.push(
        `Từ ${formatDate(activity.oldTime, 'datetime')} → ${formatDate(activity.newTime, 'datetime')}`
      );
    }

    return parts.join(' • ');
  };

  // Sắp xếp activities theo thời gian (mới nhất ở đầu)
  const sortedActivities = [...activities].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className="nvbh-activity-timeline">
      {sortedActivities.map((activity, index) => (
        <div 
          key={index} 
          className="nvbh-timeline-item"
        >
          <div className="nvbh-timeline-item__marker">
            {getActivityIcon(activity.action)}
            {index < sortedActivities.length - 1 && (
              <div className="nvbh-timeline-item__line"></div>
            )}
          </div>
          
          <div className="nvbh-timeline-item__content">
            <div className="nvbh-timeline-item__header">
              <h4 className="nvbh-timeline-item__title">
                {getActivityTitle(activity.action)}
              </h4>
              <span className="nvbh-timeline-item__time">
                {formatDate(activity.timestamp, 'datetime')}
              </span>
            </div>
            
            {getActivityDescription(activity) && (
              <p className="nvbh-timeline-item__description">
                {getActivityDescription(activity)}
              </p>
            )}
            
            <div className="nvbh-timeline-item__meta">
              <span className="nvbh-timeline-item__actor">
                {activity.actor === 'NVBH' ? 'Nhân viên bán hàng' : 
                 activity.actor === 'CUST' ? 'Khách hàng' : 
                 activity.actor === 'SYS' ? 'Hệ thống' : activity.actor}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
