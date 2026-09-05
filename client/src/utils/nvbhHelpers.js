/**
 * @fileoverview Utility helpers cho module Nhân viên Bán hàng
 * Format, validation, export functions
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * Format currency to VND
 * @param {number} amount - Số tiền
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to Vietnamese locale
 * @param {string|Date} date - Date object or ISO string
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '';
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('vi-VN');
    case 'long':
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'datetime':
      return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    default:
      return d.toLocaleDateString('vi-VN');
  }
};

/**
 * Format date range to human-readable string
 * @param {string|Date} start - Start date
 * @param {string|Date} end - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (start, end) => {
  if (!start || !end) return '';
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
  
  const isSameMonth = startDate.getMonth() === endDate.getMonth() &&
                      startDate.getFullYear() === endDate.getFullYear();
  
  if (isSameMonth) {
    return `${startDate.getDate()} - ${endDate.getDate()} tháng ${startDate.getMonth() + 1}, ${startDate.getFullYear()}`;
  }
  
  return `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`;
};

/**
 * Calculate commission amount
 * @param {number} value - Contract value
 * @param {number} rate - Commission rate (percentage)
 * @returns {number} Commission amount
 */
export const calculateCommission = (value, rate) => {
  if (!value || !rate) return 0;
  return (value * rate) / 100;
};

/**
 * Validate receipt number format
 * @param {string} number - Receipt number
 * @returns {boolean} Is valid
 */
export const validateReceiptNumber = (number) => {
  if (!number || typeof number !== 'string') return false;
  // Format: BN-YYYYMMDD-XXXX (e.g., BN-20251106-0001)
  const pattern = /^BN-\d{8}-\d{4}$/;
  return pattern.test(number);
};

/**
 * Generate receipt number
 * @returns {string} Generated receipt number
 */
export const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `BN-${year}${month}${day}-${random}`;
};

/**
 * Export data to Excel file
 * @param {Array<Object>} data - Data to export
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Sheet name
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Không có dữ liệu để xuất');
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const colWidths = Object.keys(data[0]).map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Export file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('[nvbhHelpers] Export to Excel error:', error);
    throw error;
  }
};

/**
 * Export data to PDF file
 * @param {Object} options - Export options
 * @param {string} options.title - PDF title
 * @param {Array<Array>} options.headers - Table headers
 * @param {Array<Array>} options.data - Table data
 * @param {string} options.filename - Output filename
 */
export const exportToPDF = ({ title, headers, data, filename = 'export' }) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Ngày xuất: ${formatDate(new Date(), 'datetime')}`, 14, 30);
    
    // Add table
    const startY = 40;
    const rowHeight = 10;
    const colWidth = 40;
    
    // Headers
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    headers.forEach((header, i) => {
      doc.text(header, 14 + (i * colWidth), startY);
    });
    
    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    data.forEach((row, rowIndex) => {
      const y = startY + ((rowIndex + 1) * rowHeight);
      row.forEach((cell, colIndex) => {
        doc.text(String(cell || ''), 14 + (colIndex * colWidth), y);
      });
    });
    
    // Save PDF
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error('[nvbhHelpers] Export to PDF error:', error);
    throw error;
  }
};

/**
 * Calculate time difference in human-readable format
 * @param {string|Date} date - Date to compare
 * @returns {string} Time difference string
 */
export const getTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  if (isNaN(diffMs)) return '';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatDate(date);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get week start date (Monday)
 * @param {Date} date - Reference date
 * @returns {Date} Week start date
 */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get week end date (Sunday)
 * @param {Date} date - Reference date
 * @returns {Date} Week end date
 */
export const getWeekEnd = (date = new Date()) => {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
};

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed query object
 */
export const parseQueryString = (queryString) => {
  if (!queryString) return {};
  
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * Build query string from object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  if (!params || typeof params !== 'object') return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format phone number to Vietnamese format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: 0xxx xxx xxx or 0xxxx xxx xxx
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Change object with value and percentage
 */
export const calculateChange = (current, previous) => {
  // Handle undefined/null previous values
  if (previous === undefined || previous === null || previous === 0) {
    return { value: current || 0, percentage: 0, isPositive: true };
  }
  
  const currentVal = current || 0;
  const diff = currentVal - previous;
  const percentage = ((diff / previous) * 100).toFixed(1);
  
  return {
    value: diff,
    percentage: Math.abs(parseFloat(percentage)),
    isPositive: diff >= 0
  };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} CSS class name
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'DaYeuCau': 'info',
    'ChoXacNhan': 'warning',
    'DaXacNhan': 'success',
    'DaDoiLich': 'info',
    'HuyBoiKhach': 'danger',
    'HuyBoiHeThong': 'danger',
    'KhachKhongDen': 'danger',
    'HoanThanh': 'success',
    'DaUyQuyen': 'warning',
    'DaGhiNhan': 'success',
    'DaHoanTra': 'secondary',
    'DaRutVe': 'info',
    'ChoPheDuyet': 'warning',
    'DaPheDuyet': 'success',
    'TuChoi': 'danger'
  };
  
  return statusColors[status] || 'secondary';
};







