import React from 'react';

/**
 * Icon wrapper cho Operator
 * - Tối ưu để tích hợp Lucide sau này
 * - Tạm thời hỗ trợ render children (emoji/svg) hoặc name-based registry trong tương lai
 */
export default function IconOperator({
  children,
  size = 18,
  color = 'currentColor',
  style,
  className,
  title,
}) {
  const mergedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    color,
    lineHeight: 0,
    ...style,
  };

  return (
    <span className={className} style={mergedStyle} aria-label={title}>
      {children}
    </span>
  );
}


























