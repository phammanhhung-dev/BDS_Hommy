import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './MetricCard.css';

/**
 * AnimatedCounter - Component đếm số với animation mượt
 */
const AnimatedCounter = ({ value, duration = 1 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const targetValue = parseFloat(value) || 0;
    const increment = targetValue / (duration * 60); // 60fps
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 1000 / 60);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  // Format theo locale Việt Nam
  const formatted = typeof value === 'string' && value.includes('₫')
    ? `₫${Math.round(count).toLocaleString('vi-VN')}`
    : Math.round(count).toLocaleString('vi-VN');
  
  return <span>{formatted}</span>;
};

/**
 * MetricCard - Card hiển thị KPI với animation và hiệu ứng cao cấp
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Icon component từ react-icons
 * @param {string} props.title - Tiêu đề metric
 * @param {string|number} props.value - Giá trị chính
 * @param {string} props.subtitle - Mô tả phụ
 * @param {string} props.trend - Text hiển thị xu hướng
 * @param {boolean} props.trendUp - True nếu xu hướng tăng
 * @param {string} props.color - primary|success|warning|danger|info
 * @param {boolean} props.animated - Bật/tắt counter animation
 * @param {number} props.delay - Delay animation (ms)
 */
const MetricCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle,
  trend, 
  trendUp,
  color = 'primary',
  animated = true,
  delay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className={`metric-card metric-card--${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <motion.div 
        className="metric-card__bg-gradient"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Glow effect on hover */}
      <motion.div 
        className={`metric-card__glow metric-card__glow--${color}`}
        animate={{
          opacity: isHovered ? 0.6 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Content */}
      <div className="metric-card__content">
        {/* Icon with pulse animation */}
        <motion.div 
          className={`metric-card__icon metric-card__icon--${color}`}
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-6 h-6" />
          
          {/* Pulse ring effect */}
          <motion.div 
            className="metric-card__icon-ring"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        {/* Title */}
        <h3 className="metric-card__title">{title}</h3>
        
        {/* Value with counter animation */}
        <div className="metric-card__value">
          {animated ? (
            <AnimatedCounter value={value} duration={1.5} />
          ) : (
            value
          )}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="metric-card__subtitle">{subtitle}</p>
        )}
        
        {/* Trend indicator với animation */}
        {trend && (
          <motion.div 
            className={`metric-card__trend ${trendUp ? 'trend-up' : 'trend-down'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.span 
              className="trend-icon"
              animate={{
                y: trendUp ? [-2, 0, -2] : [2, 0, 2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {trendUp ? '↗' : '↘'}
            </motion.span>
            <span className="trend-text">{trend}</span>
          </motion.div>
        )}
      </div>
      
      {/* Shimmer effect */}
      <div className="metric-card__shimmer" />
      
      {/* Border glow khi hover */}
      <motion.div 
        className="metric-card__border-glow"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default MetricCard;
