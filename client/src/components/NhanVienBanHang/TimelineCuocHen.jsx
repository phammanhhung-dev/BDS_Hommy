/**
 * TimelineCuocHen - Timeline hiển thị lịch sử cuộc hẹn
 * Vertical timeline với icons và timestamps
 */

import React from 'react';
import StatusBadge from './StatusBadge';
import './TimelineCuocHen.css';

const TimelineCuocHen = ({ events = [] }) => {
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get icon cho event type
  const getEventIcon = (type) => {
    switch (type) {
      case 'created':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        );
      case 'confirmed':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'rescheduled':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'completed':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  if (events.length === 0) {
    return (
      <div className="nvbh-timeline-empty">
        <p>Chưa có lịch sử</p>
      </div>
    );
  }

  return (
    <div className="nvbh-timeline">
      {events.map((event, index) => (
        <div key={index} className="nvbh-timeline__item">
          <div className={`nvbh-timeline__marker nvbh-timeline__marker--${event.type}`}>
            {getEventIcon(event.type)}
          </div>
          <div className="nvbh-timeline__content">
            <div className="nvbh-timeline__header">
              <span className="nvbh-timeline__title">{event.title}</span>
              <span className="nvbh-timeline__timestamp">{formatTimestamp(event.timestamp)}</span>
            </div>
            {event.description && (
              <p className="nvbh-timeline__description">{event.description}</p>
            )}
            {event.status && (
              <StatusBadge status={event.status} size="sm" />
            )}
            {event.user && (
              <span className="nvbh-timeline__user">Bởi: {event.user}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineCuocHen;








