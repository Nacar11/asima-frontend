import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditTrailPanel } from '@/features/admin-compensation/components/audit-trail-panel';

const auditTrailMock = vi.fn();
vi.mock('@/features/admin-compensation/api', () => ({
  adminCompensationApi: { auditTrail: (...a: unknown[]) => auditTrailMock(...a) },
}));

type Entry = Record<string, unknown>;
const entry = (over: Entry): Entry => ({
  id: 1,
  compensation_id: 7,
  employee_id: 12,
  action: 'created',
  before_monthly_salary: null,
  after_monthly_salary: 50000,
  before_hourly_rate: null,
  after_hourly_rate: null,
  before_effective_from: null,
  after_effective_from: '2026-01-01',
  actor_id: 1,
  created_at: '2026-06-21T00:00:00.000Z',
  ...over,
});

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuditTrailPanel compensationId={7} currency="PHP" />
    </QueryClientProvider>,
  );
}

describe('AuditTrailPanel', () => {
  beforeEach(() => auditTrailMock.mockReset());

  it('fetches the trail for the row and renders each entry (label + change)', async () => {
    auditTrailMock.mockResolvedValue([
      entry({
        id: 2,
        action: 'updated',
        before_monthly_salary: 50000,
        after_monthly_salary: 52000,
      }),
      entry({ id: 1, action: 'created', after_monthly_salary: 50000 }),
    ]);
    renderPanel();

    expect(await screen.findByText('Correction')).toBeInTheDocument();
    expect(screen.getByText(/50,000\.00 →/)).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(auditTrailMock).toHaveBeenCalledWith(7);
  });

  it('shows an empty state when the row has no recorded changes', async () => {
    auditTrailMock.mockResolvedValue([]);
    renderPanel();
    expect(await screen.findByText(/no changes recorded/i)).toBeInTheDocument();
  });
});
