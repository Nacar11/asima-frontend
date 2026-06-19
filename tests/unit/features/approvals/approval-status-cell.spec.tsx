import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApprovalStatusCell } from '@/features/approvals/components/approval-status-cell';
import type { PendingApproval } from '@/features/approvals/schemas';

const row = (over: Partial<PendingApproval> = {}): PendingApproval => ({
  id: 1,
  kind: 'leave',
  employee_id: 12,
  employee_name: 'Jackson Castro',
  requested_at: '2026-06-19T00:00:00.000Z',
  current_step: 1,
  current_approver_id: 5,
  current_approver_name: 'Danielle Aguilar',
  summary: 'sick leave, 2026-06-23 to 2026-06-23',
  ...over,
});

describe('ApprovalStatusCell', () => {
  it('shows a "Pending L1" badge for step 1', () => {
    render(<ApprovalStatusCell row={row({ current_step: 1 })} viewerId={999} />);
    expect(screen.getByText('Pending L1')).toBeInTheDocument();
  });

  it('shows a "Pending L2" badge for step 2', () => {
    render(<ApprovalStatusCell row={row({ current_step: 2 })} viewerId={999} />);
    expect(screen.getByText('Pending L2')).toBeInTheDocument();
  });

  it('names the pending approver in the supporting line', () => {
    render(<ApprovalStatusCell row={row()} viewerId={999} />);
    expect(screen.getByText(/Awaiting L1/)).toBeInTheDocument();
    expect(screen.getByText('Danielle Aguilar')).toBeInTheDocument();
  });

  it('marks the approver "(you)" when the viewer is the current approver', () => {
    render(<ApprovalStatusCell row={row({ current_approver_id: 5 })} viewerId={5} />);
    expect(screen.getByText('Danielle Aguilar (you)')).toBeInTheDocument();
  });

  it('does not mark "(you)" when the viewer is not the current approver', () => {
    render(<ApprovalStatusCell row={row({ current_approver_id: 5 })} viewerId={7} />);
    expect(screen.getByText('Danielle Aguilar')).toBeInTheDocument();
    expect(screen.queryByText(/\(you\)/)).not.toBeInTheDocument();
  });
});
