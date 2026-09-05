/**
 * StatusBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/NhanVienBanHang/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="DaXacNhan" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays correct label for DaXacNhan status', () => {
    render(<StatusBadge status="DaXacNhan" />);
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
  });

  it('displays correct label for ChoXacNhan status', () => {
    render(<StatusBadge status="ChoXacNhan" />);
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
  });

  it('displays correct label for HoanThanh status', () => {
    render(<StatusBadge status="HoanThanh" />);
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  });

  it('applies correct variant class for success status', () => {
    const { container } = render(<StatusBadge status="DaXacNhan" />);
    const badge = container.querySelector('.nvbh-status-badge--success');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant class for warning status', () => {
    const { container } = render(<StatusBadge status="ChoXacNhan" />);
    const badge = container.querySelector('.nvbh-status-badge--warning');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant class for danger status', () => {
    const { container } = render(<StatusBadge status="HuyBoiKhach" />);
    const badge = container.querySelector('.nvbh-status-badge--danger');
    expect(badge).toBeInTheDocument();
  });

  it('shows dot when showDot prop is true', () => {
    const { container } = render(<StatusBadge status="DaXacNhan" showDot />);
    const dot = container.querySelector('.nvbh-status-badge__dot');
    expect(dot).toBeInTheDocument();
  });

  it('does not show dot when showDot prop is false', () => {
    const { container } = render(<StatusBadge status="DaXacNhan" showDot={false} />);
    const dot = container.querySelector('.nvbh-status-badge__dot');
    expect(dot).not.toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    render(<StatusBadge status="UnknownStatus" />);
    expect(screen.getByText('UnknownStatus')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="DaXacNhan" className="custom-class" />);
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});







