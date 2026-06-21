'use client';

import { Card } from '@/components/layout/app-shell';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import { useMyCompensation } from '@/features/profile/hooks/use-my-compensation-query';

const salaryFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});
const rateFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/**
 * Read-only "my pay" card for the profile page. Self-gates on
 * COMPENSATION:ViewOwn (renders nothing without it) and shows a friendly
 * "not on file" state for a new hire whose pay HR hasn't set yet.
 */
export function CompensationCard() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const allowed = hasPermission(permissions, 'COMPENSATION:ViewOwn', user?.system_admin ?? false);
  const { data, isLoading, error } = useMyCompensation(allowed);

  if (!allowed) return null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-neutral-950">Compensation</h2>
      <p className="mb-4 text-xs text-neutral-500">
        Managed by HR — contact them with any questions.
      </p>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-700">Could not load your compensation.</p>}

      {!isLoading &&
        !error &&
        (data == null ? (
          <p className="text-sm text-neutral-500">No compensation on file yet.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-neutral-500">Monthly salary</dt>
              <dd className="mt-0.5 text-lg font-semibold text-neutral-950">
                {salaryFmt.format(data.monthly_salary)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Hourly rate</dt>
              <dd className="mt-0.5 text-lg font-semibold text-neutral-950">
                {rateFmt.format(data.hourly_rate)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">Effective from</dt>
              <dd className="mt-0.5 text-neutral-800">{data.effective_from}</dd>
            </div>
          </dl>
        ))}
    </Card>
  );
}
