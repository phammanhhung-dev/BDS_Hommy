/**
 * EmptyState Component
 * Generic empty state with icon, title, description, action
 * @component
 */

import React from 'react';
import { 
  HiOutlineInbox, 
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyDollar 
} from 'react-icons/hi2';
import './EmptyState.css';

const iconMap = {
  'inbox': HiOutlineInbox,
  'document': HiOutlineDocumentText,
  'calendar': HiOutlineCalendarDays,
  'chat': HiOutlineChatBubbleLeftRight,
  'currency': HiOutlineCurrencyDollar
};

/**
 * @param {Object} props
 * @param {string} props.icon - Icon name from iconMap
 * @param {string} props.title - Main title
 * @param {string} props.description - Description text
 * @param {string} props.actionLabel - Action button label
 * @param {Function} props.onAction - Action button callback
 * @param {React.ReactNode} props.children - Custom content
 */
const EmptyState = ({ 
  icon = 'inbox',
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu để hiển thị.',
  actionLabel,
  onAction,
  children
}) => {
  const Icon = iconMap[icon] || HiOutlineInbox;

  return (
    <div className="nvbh-empty-state" role="status" aria-label={title}>
      <div className="nvbh-empty-state__icon">
        <Icon />
      </div>
      <h3 className="nvbh-empty-state__title">{title}</h3>
      <p className="nvbh-empty-state__description">{description}</p>
      
      {children}
      
      {actionLabel && onAction && (
        <button
          className="nvbh-empty-state__action"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;







