import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveDetailDrawer } from '@/features/leave/components/leave-detail-drawer';
import type { LeaveRequest } from '@/features/leave/schemas';

const approveMock = vi.fn();
const rejectMock = vi.fn();
const adminCancelMock = vi.fn();
const adminUpdateMock = vi.fn();
const downloadMock = vi.fn();
vi.mock('@/features/leave/api', () => ({
  leaveApi: {
    approve: (...a: unknown[]) => approveMock(...a),
    reject: (...a: unknown[]) => rejectMock(...a),
    downloadAttachment: (...a: unknown[]) => downloadMock(...a),
    admin: {
      cancel: (...a: unknown[]) => adminCancelMock(...a),
      update: (...a: unknown[]) => adminUpdateMock(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PENDING: LeaveRequest = {
  id: 1,
  employee_id: 12,
  leave_type: 'vacation',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  working_days: 3,
  day_portion: 'full',
  start_time: null,
  end_time: null,
  reason: 'Trip',
  status: 'pending_l1',
  submitted_at: '2026-05-30T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  decision_note: null,
  decision_path: null,
  cancelled_at: null,
  cancelled_by: null,
  l1_approver_id: 5,
  l2_approver_id: null,
  created_at: '2026-05-30T10:00:00.000Z',
  updated_at: '2026-05-30T10:00:00.000Z',
};

function renderDrawer(props: Partial<React.ComponentProps<typeof LeaveDetailDrawer>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LeaveDetailDrawer
        request={PENDING}
        employeeName="Ada Lovelace"
        open
        onClose={vi.fn()}
        canApproveAny
        canUpdate
        canDelete
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('LeaveDetailDrawer', () => {
  beforeEach(() => {
    approveMock.mockReset().mockResolvedValue(PENDING);
    rejectMock.mockReset().mockResolvedValue(PENDING);
    adminCancelMock.mockReset().mockResolvedValue(PENDING);
    adminUpdateMock.mockReset().mockResolvedValue(PENDING);
    downloadMock.mockReset().mockResolvedValue(new Blob(['x']));
    // jsdom doesn't implement object URLs.
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('renders no attachment section when the request has none', () => {
    renderDrawer();
    expect(screen.queryByText('Attachment')).not.toBeInTheDocument();
  });

  it('shows an image thumbnail for a request with an image attachment', async () => {
    renderDrawer({ request: { ...PENDING, leave_type: 'sick', attachment_id: 9 } });
    expect(screen.getByText('Attachment')).toBeInTheDocument();
    // Thumbnail rendition loads → "View full image" affordance.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /view attachment/i })).toBeInTheDocument(),
    );
    expect(downloadMock).toHaveBeenCalledWith(1, 'thumbnail');
  });

  it('falls back to a download link when the thumbnail 404s (PDF)', async () => {
    downloadMock.mockRejectedValueOnce(new Error('404')); // thumbnail rendition missing
    renderDrawer({ request: { ...PENDING, leave_type: 'sick', attachment_id: 9 } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /download attachment/i })).toBeInTheDocument(),
    );
  });

  it('shows the request details', () => {
    renderDrawer();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
  });

  it('force-approves via the override path', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(approveMock).toHaveBeenCalledWith(1));
  });

  it('requires a note to reject', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    // Note field appears; confirm without text does nothing.
    await userEvent.click(screen.getByRole('button', { name: /confirm reject/i }));
    expect(rejectMock).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/rejection note/i), 'No coverage');
    await userEvent.click(screen.getByRole('button', { name: /confirm reject/i }));
    await waitFor(() => expect(rejectMock).toHaveBeenCalledWith(1, 'No coverage'));
  });

  it('cancels the request (HR override)', async () => {
    // Cancel now requires the leave not be fully elapsed.
    renderDrawer({ request: { ...PENDING, end_date: '2099-12-31' } });
    await userEvent.click(screen.getByRole('button', { name: /cancel request/i }));
    await waitFor(() => expect(adminCancelMock).toHaveBeenCalledWith(1));
  });

  it('hides every action on a terminal (rejected) request', () => {
    renderDrawer({ request: { ...PENDING, status: 'rejected', end_date: '2099-12-31' } });
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel request/i })).not.toBeInTheDocument();
  });

  it('lets an approved, not-yet-elapsed request be cancelled but not re-approved', () => {
    renderDrawer({ request: { ...PENDING, status: 'approved', end_date: '2099-12-31' } });
    // Approve / reject / edit are pending-only.
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    // …but cancel is available under the broadened rule.
    expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument();
  });

  it('hides cancel on an approved request that has already elapsed', () => {
    renderDrawer({ request: { ...PENDING, status: 'approved', end_date: '2026-06-05' } });
    expect(screen.queryByRole('button', { name: /cancel request/i })).not.toBeInTheDocument();
  });
});
