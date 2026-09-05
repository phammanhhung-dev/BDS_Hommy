/**
 * Animated Icons cho tính năng Gợi ý Tin đăng
 * Sử dụng framer-motion cho animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedIcons.css';

/**
 * Icon với hiệu ứng pulse (nhấp nháy)
 */
export const PulsingIcon = ({ 
  children, 
  color = 'var(--nvbh-primary)', 
  size = 24,
  duration = 1.5 
}) => {
  return (
    <motion.div
      className="animated-icon animated-icon--pulsing"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      style={{
        color,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Loader xoay tròn
 */
export const SpinningLoader = ({ 
  size = 24, 
  color = 'var(--nvbh-primary)',
  strokeWidth = 3 
}) => {
  return (
    <motion.div
      className="animated-icon animated-icon--spinning"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          opacity={0.3}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          strokeDashoffset="23.55"
        />
      </svg>
    </motion.div>
  );
};

/**
 * Icon check với hiệu ứng bounce
 */
export const BouncingCheck = ({ 
  size = 48, 
  color = 'var(--nvbh-success)' 
}) => {
  return (
    <motion.div
      className="animated-icon animated-icon--bouncing"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      style={{ width: size, height: size }}
    >
      <motion.svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.circle
          cx="12"
          cy="12"
          r="11"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d="M6 12l4 4 8-8"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />
      </motion.svg>
    </motion.div>
  );
};

/**
 * Icon X với hiệu ứng shake
 */
export const ShakingX = ({ 
  size = 48, 
  color = 'var(--nvbh-danger)' 
}) => {
  return (
    <motion.div
      className="animated-icon animated-icon--shaking"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: [0, -5, 5, -5, 5, 0]
      }}
      transition={{
        scale: { type: 'spring', stiffness: 260, damping: 20 },
        x: { duration: 0.4, delay: 0.3 }
      }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle cx="12" cy="12" r="11" fill={color} />
        <path
          d="M8 8l8 8M16 8l-8 8"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

/**
 * Dots đang chờ (typing indicator style)
 */
export const WaitingDots = ({ 
  color = 'var(--nvbh-primary)',
  size = 8,
  gap = 4
}) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 }
  };

  return (
    <div 
      className="animated-icon animated-icon--waiting-dots"
      style={{ display: 'flex', gap, alignItems: 'center' }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.4,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.15
          }}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color
          }}
        />
      ))}
    </div>
  );
};

/**
 * QR Code scanning animation
 */
export const ScanningQR = ({ size = 120 }) => {
  return (
    <div 
      className="animated-icon animated-icon--scanning"
      style={{ width: size, height: size, position: 'relative' }}
    >
      {/* QR Frame */}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Corners */}
        <path
          d="M5 20 L5 5 L20 5"
          fill="none"
          stroke="var(--nvbh-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M80 5 L95 5 L95 20"
          fill="none"
          stroke="var(--nvbh-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M95 80 L95 95 L80 95"
          fill="none"
          stroke="var(--nvbh-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M20 95 L5 95 L5 80"
          fill="none"
          stroke="var(--nvbh-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Scanning line */}
      <motion.div
        className="animated-icon__scan-line"
        animate={{
          top: ['10%', '90%', '10%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          left: '10%',
          width: '80%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--nvbh-primary), transparent)',
          boxShadow: '0 0 10px var(--nvbh-primary)'
        }}
      />
    </div>
  );
};

/**
 * Countdown circle
 */
export const CountdownCircle = ({ 
  seconds, 
  totalSeconds, 
  size = 80,
  strokeWidth = 6 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = seconds / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  // Đổi màu khi gần hết giờ
  const getColor = () => {
    if (progress > 0.5) return 'var(--nvbh-success)';
    if (progress > 0.2) return 'var(--nvbh-warning)';
    return 'var(--nvbh-danger)';
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="animated-icon animated-icon--countdown"
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--nvbh-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      {/* Time text */}
      <div 
        className="animated-icon__countdown-text"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.2,
          fontWeight: 600,
          color: getColor(),
          fontFamily: 'var(--nvbh-font-mono, monospace)'
        }}
      >
        {formatTime(seconds)}
      </div>
    </div>
  );
};

/**
 * Success confetti effect
 */
export const SuccessConfetti = ({ show = false }) => {
  if (!show) return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * -200 - 50,
    rotation: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
    color: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="animated-icon animated-icon--confetti">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 1, 
            scale: 0,
            rotate: 0 
          }}
          animate={{ 
            x: p.x, 
            y: p.y, 
            opacity: 0, 
            scale: p.scale,
            rotate: p.rotation 
          }}
          transition={{ 
            duration: 1.5, 
            ease: 'easeOut' 
          }}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  );
};

export default {
  PulsingIcon,
  SpinningLoader,
  BouncingCheck,
  ShakingX,
  WaitingDots,
  ScanningQR,
  CountdownCircle,
  SuccessConfetti
};

