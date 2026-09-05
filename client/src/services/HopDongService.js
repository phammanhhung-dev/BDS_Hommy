/**
 * @fileoverview Service API cho Hợp đồng
 * @module HopDongService
 */

import axios from 'axios';

import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();

/**
 * Báo cáo hợp đồng đã ký
 * @param {Object} data - Thông tin hợp đồng
 * @returns {Promise<Object>}
 */
export const baoCaoHopDong = async (data) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE}/api/chu-du-an/hop-dong/bao-cao`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Lấy danh sách hợp đồng
 * @param {Object} filters - {tuNgay, denNgay}
 * @returns {Promise<Array>}
 */
export const layDanhSachHopDong = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (filters.tuNgay) params.append('tuNgay', filters.tuNgay);
  if (filters.denNgay) params.append('denNgay', filters.denNgay);

  const response = await axios.get(
    `${API_BASE}/api/chu-du-an/hop-dong?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

/**
 * Lấy chi tiết hợp đồng
 * @param {number} hopDongId
 * @returns {Promise<Object>}
 */
export const layChiTietHopDong = async (hopDongId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE}/api/chu-du-an/hop-dong/${hopDongId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

/**
 * Upload file scan hợp đồng
 * @param {number} hopDongId
 * @param {File} file - PDF hoặc Image file
 * @returns {Promise<Object>}
 */
export const uploadFileScanHopDong = async (hopDongId, file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_BASE}/api/chu-du-an/hop-dong/${hopDongId}/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};