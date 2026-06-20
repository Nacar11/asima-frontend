'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { RequirePermission } from '@/components/require-permission';
import { adminScheduleApi } from '@/features/admin-schedule/api';
import { adminScheduleKeys } from '@/features/admin-schedule/keys';
import { EmployeePicker, employeeName } from '@/features/admin-schedule/components/employee-picker';
import { ScheduleManager } from '@/features/admin-schedule/components/schedule-manager';
import type { AdminUser } from '@/features/admin-users/schemas';

export default function AdminSchedulesPage() {
  return (
    <RequirePermission code="SCHEDULE:View">
      <AdminSchedulesPageBody />
    </RequirePermission>
  );
}

function AdminSchedulesPageBody() {
  const [employee, setEmployee] = useState<AdminUser | null>(null);

  const scheduleQuery = useQuery({
    queryKey: employee ? adminScheduleKeys.byEmployee(employee.id) : adminScheduleKeys.none(),
    queryFn: () => adminScheduleApi.activeForEmployee(employee!.id),
    enabled: employee !== null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Schedules</h1>
        <p className="text-sm text-neutral-500">
          View and change any employee&apos;s weekly work schedule.
        </p>
      </div>

      <EmployeePicker selected={employee} onSelect={setEmployee} />

      {employee === null && (
        <EmptyState
          icon={CalendarRange}
          title="Pick an employee"
          description="Search for an employee above to see their weekly schedule."
        />
      )}

      {employee !== null && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-700">
            {employeeName(employee)}&apos;s week
          </h2>

          {scheduleQuery.isLoading && <p className="text-sm text-neutral-500">Loading schedule…</p>}
          {scheduleQuery.error && (
            <EmptyState
              tone="error"
              icon={AlertTriangle}
              title="Couldn't load the schedule"
              description="Please try again."
              action={
                <button
                  type="button"
                  onClick={() => scheduleQuery.refetch()}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  Try again
                </button>
              }
            />
          )}
          {scheduleQuery.data && (
            <ScheduleManager employeeId={employee.id} rows={scheduleQuery.data} />
          )}
        </section>
      )}
    </div>
  );
}
