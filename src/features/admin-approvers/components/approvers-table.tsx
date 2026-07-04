'use client';

import { useMemo, useRef } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import type { SelectOption } from '@/components/select';
import { formatDateInTz } from '@/lib/format';
import { InlineApproverCell } from './inline-approver-cell';
import type { EmployeeChainView } from '../schemas';

export type ApproverCandidate = { id: number; name: string };

/**
 * Approvers table — Employee · L1 · L2 · Updated. L1/L2 cells are inline
 * editable when `canUpdate`; otherwise they render the approver's name
 * read-only. Each row's option list excludes that employee (no
 * self-approval), and L2 is locked until the row has an L1.
 *
 * When `selectedIds` + the toggle callbacks are supplied (admin bulk-assign
 * flow), a leading checkbox column appears. The header checkbox is tri-state
 * over the CURRENT page's rows; selection itself is owned by the parent (a
 * Set of employee ids) so it survives paging and filter changes.
 */
export function ApproversTable({
  rows,
  candidates,
  listQueryKey,
  canUpdate,
  selectedIds,
  onToggleOne,
  onTogglePage,
}: {
  rows: EmployeeChainView[];
  candidates: ApproverCandidate[];
  listQueryKey: QueryKey;
  canUpdate: boolean;
  selectedIds?: Set<number>;
  onToggleOne?: (employeeId: number) => void;
  onTogglePage?: (employeeIds: number[], selected: boolean) => void;
}) {
  const selectable = canUpdate && !!selectedIds && !!onToggleOne && !!onTogglePage;
  const headerRef = useRef<HTMLInputElement>(null);

  const pageIds = rows.map((r) => r.employee_id);
  const selectedOnPage = selectable ? pageIds.filter((id) => selectedIds!.has(id)).length : 0;
  const allSelected = selectable && pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someSelected = selectedOnPage > 0 && !allSelected;
  // `indeterminate` is a DOM-only property — set it imperatively each render.
  if (headerRef.current) headerRef.current.indeterminate = someSelected;
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
            {selectable && (
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  ref={headerRef}
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allSelected}
                  onChange={() => onTogglePage!(pageIds, !allSelected)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-neutral-900"
                />
              </th>
            )}
            <th scope="col" className="px-4 py-3 font-medium">
              Employee
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Level 1 approver
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Level 2 approver
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.employee_id} className="align-middle">
              {selectable && (
                <td className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.employee_name}`}
                    checked={selectedIds!.has(row.employee_id)}
                    onChange={() => onToggleOne!(row.employee_id)}
                    className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-neutral-900"
                  />
                </td>
              )}
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
                {row.updated_at ? formatDateInTz(row.updated_at) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadOnly({ name }: { name: string | null }) {
  return (
    <span className={name ? 'text-neutral-900' : 'text-neutral-400'}>{name ?? '— None —'}</span>
  );
}
