import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import './RevenueChart.css';

/**
 * Custom Tooltip với glass morphism effect
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        className="revenue-chart-tooltip"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="tooltip-header">
          <span className="tooltip-label">{label}</span>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <div 
                className="tooltip-color-dot" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">
                ₫{entry.value.toLocaleString('vi-VN')} triệu
              </span>
            </div>
          ))}
        </div>
        
        {/* Glow effect */}
        <div className="tooltip-glow" />
      </motion.div>
    );
  }
  return null;
};

/**
 * RevenueChart - Biểu đồ doanh thu với hiệu ứng cao cấp
 * 
 * @param {Array} data - Dữ liệu doanh thu [{ month, revenue, deposits, contracts }]
 * @param {number} height - Chiều cao chart (px)
 * @param {boolean} showGrid - Hiển thị grid
 * @param {boolean} showLegend - Hiển thị legend
 * @param {string} gradientColor - Màu gradient: primary|success|info
 */
const RevenueChart = ({ 
  data, 
  height = 400,
  showGrid = true,
  showLegend = true,
  gradientColor = 'primary',
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Color mapping
  const colorMap = {
    primary: { main: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.4)' },
    success: { main: '#10b981', light: '#34d399', glow: 'rgba(16, 185, 129, 0.4)' },
    info: { main: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.4)' },
  };
  
  const colors = colorMap[gradientColor];
  
  // Calculate max value for reference line
  const maxValue = Math.max(...data.map(d => d.revenue));
  
  return (
    <motion.div 
      className="revenue-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Doanh Thu Theo Tháng</h3>
          <p className="chart-subtitle">Biểu đồ xu hướng doanh thu và các chỉ số liên quan</p>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot legend-dot--primary" />
              <span>Doanh thu</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot legend-dot--success" />
              <span>Đặt cọc</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot legend-dot--info" />
              <span>Hợp đồng</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart 
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setActiveIndex(state.activeTooltipIndex);
              } else {
                setActiveIndex(null);
              }
            }}
          >
            {/* Gradient definitions */}
            <defs>
              {/* Main gradient */}
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.main} stopOpacity={0.05}/>
              </linearGradient>
              
              {/* Animated glow gradient */}
              <linearGradient id="colorRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.light} stopOpacity={1}>
                  <animate 
                    attributeName="stop-opacity" 
                    values="1;0.6;1" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                </stop>
                <stop offset="100%" stopColor={colors.main} stopOpacity={0.1}/>
              </linearGradient>
              
              {/* Shadow for depth */}
              <filter id="shadow" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Grid với custom styling */}
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={1}
                vertical={false}
              />
            )}
            
            {/* X Axis */}
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
              height={60}
            />
            
            {/* Y Axis */}
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
              tickFormatter={(value) => `₫${value}tr`}
              width={80}
            />
            
            {/* Reference line at max value */}
            <ReferenceLine 
              y={maxValue} 
              stroke="rgba(139, 92, 246, 0.3)" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Peak', 
                fill: '#8b5cf6', 
                fontSize: 10,
                position: 'right'
              }}
            />
            
            {/* Tooltip */}
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{
                stroke: colors.light,
                strokeWidth: 2,
                strokeDasharray: '5 5',
              }}
            />
            
            {/* Main Area - Revenue */}
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Doanh thu"
              stroke={colors.main} 
              strokeWidth={3}
              fill="url(#colorRevenue)"
              filter="url(#shadow)"
              activeDot={{ 
                r: 8, 
                fill: colors.light,
                stroke: colors.main,
                strokeWidth: 3,
                style: {
                  filter: `drop-shadow(0 0 12px ${colors.glow})`,
                  transition: 'all 0.3s ease',
                }
              }}
              dot={{
                r: 4,
                fill: colors.main,
                strokeWidth: 2,
                stroke: '#1a1d29',
              }}
            />
            
            {/* Secondary Area - Deposits (optional) */}
            {data[0]?.deposits !== undefined && (
              <Area 
                type="monotone" 
                dataKey="deposits" 
                name="Đặt cọc"
                stroke="#10b981" 
                strokeWidth={2}
                fill="rgba(16, 185, 129, 0.1)"
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#10b981' }}
              />
            )}
            
            {/* Tertiary Area - Contracts (optional) */}
            {data[0]?.contracts !== undefined && (
              <Area 
                type="monotone" 
                dataKey="contracts" 
                name="Hợp đồng"
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="rgba(59, 130, 246, 0.1)"
                strokeDasharray="3 3"
                dot={{ r: 3, fill: '#3b82f6' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Ambient glow effect */}
        <div className="chart-ambient-glow" style={{ 
          background: `radial-gradient(circle at center, ${colors.glow}, transparent)` 
        }} />
      </div>
      
      {/* Shimmer loading indicator */}
      <div className="chart-shimmer" />
    </motion.div>
  );
};

export default RevenueChart;
