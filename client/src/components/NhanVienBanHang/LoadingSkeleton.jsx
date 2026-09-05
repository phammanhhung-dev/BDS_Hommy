/**
 * LoadingSkeleton Component
 * Skeleton loaders for lists and cards
 * @component
 */

import React from 'react';
import './LoadingSkeleton.css';

/**
 * @param {Object} props
 * @param {string} props.type - Skeleton type: 'card', 'list', 'table', 'text'
 * @param {number} props.count - Number of skeleton items
 * @param {string} props.height - Custom height
 */
const LoadingSkeleton = ({ type = 'card', count = 3, height }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="nvbh-skeleton nvbh-skeleton--card">
            <div className="nvbh-skeleton__header" />
            <div className="nvbh-skeleton__body">
              <div className="nvbh-skeleton__line nvbh-skeleton__line--full" />
              <div className="nvbh-skeleton__line nvbh-skeleton__line--75" />
              <div className="nvbh-skeleton__line nvbh-skeleton__line--50" />
            </div>
            <div className="nvbh-skeleton__footer" />
          </div>
        );
      
      case 'list':
        return (
          <div className="nvbh-skeleton nvbh-skeleton--list">
            <div className="nvbh-skeleton__avatar" />
            <div className="nvbh-skeleton__content">
              <div className="nvbh-skeleton__line nvbh-skeleton__line--75" />
              <div className="nvbh-skeleton__line nvbh-skeleton__line--50" />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="nvbh-skeleton nvbh-skeleton--table">
            <div className="nvbh-skeleton__line nvbh-skeleton__line--full" />
          </div>
        );
      
      case 'text':
        return (
          <div className="nvbh-skeleton nvbh-skeleton--text" style={{ height }}>
            <div className="nvbh-skeleton__line nvbh-skeleton__line--full" />
          </div>
        );
      
      default:
        return (
          <div className="nvbh-skeleton nvbh-skeleton--card">
            <div className="nvbh-skeleton__line nvbh-skeleton__line--full" />
          </div>
        );
    }
  };

  return (
    <div className="nvbh-loading-skeleton" aria-busy="true" aria-label="Đang tải...">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LoadingSkeleton;







