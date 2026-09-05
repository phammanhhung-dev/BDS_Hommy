/**
 * MetricCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import MetricCard from '../MetricCard';

const MockIcon = () => <svg data-testid="mock-icon"><circle /></svg>;

describe('MetricCard Component', () => {
  it('renders without crashing', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Test Label"
        value={100}
      />
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('displays label correctly', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Cuộc hẹn hôm nay"
        value={5}
      />
    );
    expect(screen.getByText('Cuộc hẹn hôm nay')).toBeInTheDocument();
  });

  it('displays numeric value correctly', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={1234}
      />
    );
    expect(screen.getByText('1.234')).toBeInTheDocument();
  });

  it('displays string value correctly', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value="Test Value"
      />
    );
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
      />
    );
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('shows positive change indicator', () => {
    const { container } = render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
        change={10}
        changeType="positive"
      />
    );
    const change = container.querySelector('.nvbh-metric-card__change--positive');
    expect(change).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('shows negative change indicator', () => {
    const { container } = render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
        change={-5}
        changeType="negative"
      />
    );
    const change = container.querySelector('.nvbh-metric-card__change--negative');
    expect(change).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
        onClick={handleClick}
      />
    );
    
    const card = screen.getByRole('button');
    await user.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when not provided', () => {
    render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
      />
    );
    
    const card = screen.queryByRole('button');
    expect(card).not.toBeInTheDocument();
  });

  it('applies correct color variant', () => {
    const { container } = render(
      <MetricCard
        icon={MockIcon}
        label="Test"
        value={100}
        color="success"
      />
    );
    const card = container.querySelector('.nvbh-metric-card--success');
    expect(card).toBeInTheDocument();
  });
});







