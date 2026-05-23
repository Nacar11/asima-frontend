'use client';

import { Card } from '@/components/layout/app-shell';
import { useAuth } from '@/features/auth/use-auth';
import { formatDateTimeInTz } from '@/lib/format';
import { resolveDisplayTz } from '@/lib/tz';

export default function DashboardPage() {
  const { user } = useAuth();
  const tz = resolveDisplayTz();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Welcome{user ? `, ${user.first_name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Self-service surface. Time tracking and schedule land in F5.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-neutral-950">Your account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Email</dt>
              <dd className="font-medium">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Title</dt>
              <dd className="font-medium">{user?.title ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Role</dt>
              <dd className="font-mono text-xs">{user?.role.name ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-neutral-950">Right now</h2>
          <p className="mt-3 text-sm text-neutral-500">
            {formatDateTimeInTz(new Date())}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Display timezone: <span className="font-mono">{tz}</span>
          </p>
        </Card>
      </div>
    </div>
  );
}
