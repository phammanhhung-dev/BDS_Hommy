/**
 * MetricCard - Card hiển thị metric/số liệu
 * Glass morphism design với icon và change indicator
 */

import React from 'react';
import './MetricCard.css';

const MetricCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  color = 'primary', // 'primary', 'success', 'warning', 'danger'
  onClick,
  actionLabel
}) => {
  // Format giá trị số
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('vi-VN');
    }
    return val;
  };

  // Render change indicator
  const renderChange = () => {
    if (change === undefined || change === null) return null;

    const isPositive = changeType === 'positive' || (typeof change === 'number' && change > 0);
    const isNegative = changeType === 'negative' || (typeof change === 'number' && change < 0);

    const changeClass = isPositive
      ? 'nvbh-metric-card__change--positive'
      : isNegative
      ? 'nvbh-metric-card__change--negative'
      : 'nvbh-metric-card__change--neutral';

    const arrow = isPositive ? '↑' : isNegative ? '↓' : '';

    return (
      <span className={`nvbh-metric-card__change ${changeClass}`}>
        {arrow} {Math.abs(change)}%
      </span>
    );
  };

  return (
    <div
      className={`nvbh-metric-card nvbh-metric-card--${color} ${onClick ? 'nvbh-metric-card--interactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="nvbh-metric-card__header">
        <div className={`nvbh-metric-card__icon nvbh-metric-card__icon--${color}`}>
          {Icon && <Icon />}
        </div>
        <span className="nvbh-metric-card__label">{label}</span>
      </div>

      <div className="nvbh-metric-card__body">
        <div className="nvbh-metric-card__value">{formatValue(value)}</div>
        {renderChange()}
      </div>

      {onClick && (
        <div className="nvbh-metric-card__footer">
          <span className="nvbh-metric-card__action">
            {actionLabel || 'Xem chi tiết'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;








