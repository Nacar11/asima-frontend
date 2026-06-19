import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/pagination';

describe('Pagination', () => {
  it('disables Previous on page 1', () => {
    render(<Pagination page={1} hasMore onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  it('disables Next when there are no more pages', () => {
    render(<Pagination page={2} hasMore={false} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
  });

  it('fires onPrev / onNext on click', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(<Pagination page={2} hasMore onPrev={onPrev} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders a "Showing X–Y of Z" summary when total + limit are given', () => {
    render(<Pagination page={2} hasMore total={45} limit={20} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText(/showing 21–40 of 45/i)).toBeInTheDocument();
  });

  it('omits the summary when total/limit are absent', () => {
    render(<Pagination page={1} hasMore onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
  });
});
