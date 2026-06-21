'use client';

import { useState } from 'react';
import { AlertTriangle, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { RequirePermission } from '@/components/require-permission';
import {
  EmployeePicker,
  employeeName,
} from '@/features/admin-compensation/components/employee-picker';
import { CompensationManager } from '@/features/admin-compensation/components/compensation-manager';
import { useEmployeeCompensation } from '@/features/admin-compensation/hooks/use-employee-compensation';
import type { AdminUser } from '@/features/admin-users/schemas';

export default function AdminCompensationPage() {
  return (
    <RequirePermission code="COMPENSATION:ViewAll">
      <AdminCompensationPageBody />
    </RequirePermission>
  );
}

function AdminCompensationPageBody() {
  const [employee, setEmployee] = useState<AdminUser | null>(null);
  const compensationQuery = useEmployeeCompensation(employee?.id ?? null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Compensation</h1>
        <p className="text-sm text-neutral-500">
          View and set any employee&apos;s pay. Rates are effective-dated and HR-only.
        </p>
      </div>

      <EmployeePicker selected={employee} onSelect={setEmployee} />

      {employee === null && (
        <EmptyState
          icon={Wallet}
          title="Pick an employee"
          description="Search for an employee above to see and manage their pay."
        />
      )}

      {employee !== null && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-700">{employeeName(employee)}</h2>

          {compensationQuery.isLoading && (
            <p className="text-sm text-neutral-500">Loading compensation…</p>
          )}
          {compensationQuery.error && (
            <EmptyState
              tone="error"
              icon={AlertTriangle}
              title="Couldn't load compensation"
              description="Please try again."
              action={
                <button
                  type="button"
                  onClick={() => compensationQuery.refetch()}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  Try again
                </button>
              }
            />
          )}
          {compensationQuery.data && (
            <CompensationManager
              employeeId={employee.id}
              employeeName={employeeName(employee)}
              rows={compensationQuery.data}
            />
          )}
        </section>
      )}
    </div>
  );
}
