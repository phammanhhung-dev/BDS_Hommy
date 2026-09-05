/**
 * Tests for NVBH Settings (Cài đặt) page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CaiDatNhanVienBanHang from '../CaiDat';
import * as nhanVienBanHangApi from '../../../api/nhanVienBanHangApi';

vi.mock('../../../api/nhanVienBanHangApi', () => ({
  layHoSo: vi.fn(),
  capNhatHoSo: vi.fn()
}));

const mockHoSoResponse = {
  success: true,
  data: {
    HoSoID: 101,
    NguoiDungID: 501,
    TenDayDu: 'Nguyễn Văn A',
    Email: 'nv.a@example.com',
    SoDienThoai: '0901234567',
    MaNhanVien: 'NVBH-001',
    TrangThaiLamViec: 'DangLamViec',
    KhuVucChinhID: 5,
    TenKhuVucChinh: 'TP. Hồ Chí Minh',
    KhuVucPhuTrach: JSON.stringify(['Quận 1', 'Quận 3']),
    TyLeHoaHong: 5,
    NgayBatDau: '2024-01-01',
    NgayKetThuc: null,
    GhiChu: 'Thích lịch sáng'
  }
};

const renderSettingsPage = () =>
  render(
    <BrowserRouter>
      <CaiDatNhanVienBanHang />
    </BrowserRouter>
  );

describe('CaiDatNhanVienBanHang', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gọi API layHoSo khi mount', async () => {
    nhanVienBanHangApi.layHoSo.mockResolvedValue(mockHoSoResponse);

    renderSettingsPage();

    await waitFor(() => {
      expect(nhanVienBanHangApi.layHoSo).toHaveBeenCalledTimes(1);
    });
  });

  it('hiển thị dữ liệu hồ sơ sau khi tải thành công', async () => {
    nhanVienBanHangApi.layHoSo.mockResolvedValue(mockHoSoResponse);

    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByText(/thông tin cá nhân/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Nguyễn Văn A/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/NVBH-001/i)).toBeInTheDocument();
    });
  });

  it('cho phép cập nhật ghi chú', async () => {
    nhanVienBanHangApi.layHoSo.mockResolvedValue(mockHoSoResponse);
    nhanVienBanHangApi.capNhatHoSo.mockResolvedValue({ success: true });

    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/ghi chú hỗ trợ/i)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/ghi chú hỗ trợ/i);
    fireEvent.change(textarea, { target: { value: 'Ưu tiên ca chiều' } });

    const saveButton = screen.getByRole('button', { name: /lưu ghi chú/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(nhanVienBanHangApi.capNhatHoSo).toHaveBeenCalledWith({ ghiChu: 'Ưu tiên ca chiều' });
      expect(screen.getByText(/đã lưu ghi chú/i)).toBeInTheDocument();
    });
  });
});

