import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovalsTable } from '@/features/approvals/components/approvals-table';
import type { PendingApproval } from '@/features/approvals/schemas';

const ROW: PendingApproval = {
  id: 9,
  kind: 'leave',
  employee_id: 12,
  employee_name: 'Jackson Castro',
  requested_at: '2026-06-13T08:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  summary: 'sick leave, 2026-06-15 to 2026-06-15',
};

describe('ApprovalsTable', () => {
  it('renders no Kind column (each page is single-kind now)', () => {
    render(<ApprovalsTable rows={[ROW]} />);
    expect(screen.queryByRole('columnheader', { name: /kind/i })).toBeNull();
  });

  it('renders a Details button that calls onDetails with the row', async () => {
    const onDetails = vi.fn();
    render(<ApprovalsTable rows={[ROW]} onDetails={onDetails} />);

    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(onDetails).toHaveBeenCalledWith(ROW);
  });

  it('still renders Approve / Reject when action handlers are provided', () => {
    render(
      <ApprovalsTable rows={[ROW]} onApprove={vi.fn()} onReject={vi.fn()} onDetails={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });
});
