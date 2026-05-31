'use client';

import { useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import type { SelectOption } from '@/components/select';
import { InlineApproverCell } from '@/features/admin-approvers/components/inline-approver-cell';
import type { EmployeeChainView } from '@/features/admin-approvers/schemas';

export type ApproverCandidate = { id: number; name: string };

/**
 * Approvers table — Employee · L1 · L2 · Updated. L1/L2 cells are inline
 * editable when `canUpdate`; otherwise they render the approver's name
 * read-only. Each row's option list excludes that employee (no
 * self-approval), and L2 is locked until the row has an L1.
 */
export function ApproversTable({
  rows,
  candidates,
  listQueryKey,
  canUpdate,
}: {
  rows: EmployeeChainView[];
  candidates: ApproverCandidate[];
  listQueryKey: QueryKey;
  canUpdate: boolean;
}) {
  const optionsByEmployee = useMemo(() => {
    const cache = new Map<number, SelectOption<string>[]>();
    return (employeeId: number) => {
      let opts = cache.get(employeeId);
      if (!opts) {
        opts = [
          { value: '', label: '— None —' },
          ...candidates
            .filter((c) => c.id !== employeeId)
            .map((c) => ({ value: String(c.id), label: c.name })),
        ];
        cache.set(employeeId, opts);
      }
      return opts;
    };
  }, [candidates]);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Employee</th>
            <th scope="col" className="px-4 py-3 font-medium">Level 1 approver</th>
            <th scope="col" className="px-4 py-3 font-medium">Level 2 approver</th>
            <th scope="col" className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.employee_id} className="align-middle">
              <td className="px-4 py-3">
                <div className="font-medium text-neutral-900">{row.employee_name}</div>
                <div className="text-xs text-neutral-500">{row.employee_email}</div>
              </td>
              <td className="px-4 py-3">
                {canUpdate ? (
                  <InlineApproverCell
                    employeeId={row.employee_id}
                    step={1}
                    currentApproverId={row.l1_approver_id}
                    options={optionsByEmployee(row.employee_id)}
                    listQueryKey={listQueryKey}
                  />
                ) : (
                  <ReadOnly name={row.l1_approver_name} />
                )}
              </td>
              <td className="px-4 py-3">
                {canUpdate ? (
                  <InlineApproverCell
                    employeeId={row.employee_id}
                    step={2}
                    currentApproverId={row.l2_approver_id}
                    options={optionsByEmployee(row.employee_id)}
                    listQueryKey={listQueryKey}
                    disabled={row.l1_approver_id === null}
                  />
                ) : (
                  <ReadOnly name={row.l2_approver_name} />
                )}
              </td>
              <td className="px-4 py-3 text-xs text-neutral-500">
                {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadOnly({ name }: { name: string | null }) {
  return <span className={name ? 'text-neutral-900' : 'text-neutral-400'}>{name ?? '— None —'}</span>;
}
