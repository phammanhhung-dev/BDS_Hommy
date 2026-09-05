/**
 * Dashboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import * as nhanVienBanHangApi from '../../../api/nhanVienBanHangApi';

// Mock the API
vi.mock('../../../api/nhanVienBanHangApi', () => ({
  layDashboard: vi.fn(),
  formatDate: vi.fn((date) => date?.toLocaleDateString('vi-VN') || ''),
  formatCurrency: vi.fn((amount) => `${amount.toLocaleString('vi-VN')} ₫`)
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    nhanVienBanHangApi.layDashboard.mockResolvedValue({
      success: true,
      data: {
        metrics: {
          cuocHenHomNay: 0,
          choXacNhan: 0,
          hoanThanhTuan: 0,
          thuNhapThang: 0
        },
        cuocHenHomNay: [],
        hieuSuat7Ngay: []
      }
    });

    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/lịch tuần này/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    nhanVienBanHangApi.layDashboard.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderDashboard();
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('displays metrics cards when data loads', async () => {
    nhanVienBanHangApi.layDashboard.mockResolvedValue({
      success: true,
      data: {
        metrics: {
          cuocHenHomNay: 5,
          choXacNhan: 3,
          hoanThanhTuan: 10,
          thuNhapThang: 5000000
        },
        cuocHenHomNay: [],
        hieuSuat7Ngay: []
      }
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('5')[0]).toBeInTheDocument();
      expect(screen.getAllByText('3')[0]).toBeInTheDocument();
      expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    nhanVienBanHangApi.layDashboard.mockRejectedValue(new Error('API Error'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/không thể tải/i)).toBeInTheDocument();
    });
  });

  it('calls layDashboard API on mount', () => {
    nhanVienBanHangApi.layDashboard.mockResolvedValue({
      success: true,
      data: {
        metrics: {
          cuocHenHomNay: 0,
          choXacNhan: 0,
          hoanThanhTuan: 0,
          thuNhapThang: 0
        },
        cuocHenHomNay: [],
        hieuSuat7Ngay: []
      }
    });

    renderDashboard();
    expect(nhanVienBanHangApi.layDashboard).toHaveBeenCalledTimes(1);
  });
});







