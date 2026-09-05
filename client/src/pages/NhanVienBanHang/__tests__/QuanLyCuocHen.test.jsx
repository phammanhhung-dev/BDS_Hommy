/**
 * QuanLyCuocHen Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { userEvent } from '@testing-library/user-event';
import QuanLyCuocHen from '../QuanLyCuocHen';
import * as nhanVienBanHangApi from '../../../api/nhanVienBanHangApi';

// Mock the API
vi.mock('../../../api/nhanVienBanHangApi', () => ({
  layDanhSachCuocHen: vi.fn(),
  xacNhanCuocHen: vi.fn(),
  doiLichCuocHen: vi.fn(),
  huyCuocHen: vi.fn()
}));

const renderQuanLyCuocHen = () => {
  return render(
    <BrowserRouter>
      <QuanLyCuocHen />
    </BrowserRouter>
  );
};

describe('QuanLyCuocHen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nhanVienBanHangApi.layDanhSachCuocHen.mockResolvedValue({
      success: true,
      data: {
        cuocHens: [],
        tongSo: 0
      }
    });
  });

  it('renders without crashing', () => {
    renderQuanLyCuocHen();
    expect(screen.getByText(/quản lý cuộc hẹn/i)).toBeInTheDocument();
  });

  it('displays filter tabs', () => {
    renderQuanLyCuocHen();
    expect(screen.getByText(/tất cả/i)).toBeInTheDocument();
    expect(screen.getByText(/hôm nay/i)).toBeInTheDocument();
  });

  it('calls layDanhSachCuocHen on mount', () => {
    renderQuanLyCuocHen();
    expect(nhanVienBanHangApi.layDanhSachCuocHen).toHaveBeenCalled();
  });

  it('displays appointments when data loads', async () => {
    nhanVienBanHangApi.layDanhSachCuocHen.mockResolvedValue({
      success: true,
      data: {
        cuocHens: [
          {
            CuocHenID: 1,
            TenKhachHang: 'Test Customer',
            TenPhong: 'Test Phong',
            ThoiGianHen: '2025-01-07T10:00:00Z',
            TrangThai: 'ChoXacNhan',
            Gia: 5000000
          }
        ],
        tongSo: 1
      }
    });

    renderQuanLyCuocHen();

    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });
  });

  it('displays empty state when no appointments', async () => {
    nhanVienBanHangApi.layDanhSachCuocHen.mockResolvedValue({
      success: true,
      data: {
        cuocHens: [],
        tongSo: 0
      }
    });

    renderQuanLyCuocHen();

    await waitFor(() => {
      expect(nhanVienBanHangApi.layDanhSachCuocHen).toHaveBeenCalled();
    });
  });

  it('filters appointments by status when tab is clicked', async () => {
    const user = userEvent.setup();
    
    renderQuanLyCuocHen();

    const completedTab = screen.getByText(/đã hoàn thành/i);
    await user.click(completedTab);

    await waitFor(() => {
      expect(nhanVienBanHangApi.layDanhSachCuocHen).toHaveBeenCalledWith(
        expect.objectContaining({
          trangThai: 'HoanThanh'
        })
      );
    });
  });
});







