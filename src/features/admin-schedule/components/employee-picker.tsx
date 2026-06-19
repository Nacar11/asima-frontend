'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminScheduleKeys } from '@/features/admin-schedule/keys';
import type { AdminUser } from '@/features/admin-users/schemas';

const inputCls = cn(
  'h-9 w-full rounded-md border border-neutral-300 bg-white pl-8 pr-3 text-sm text-neutral-900 shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1',
);

export const employeeName = (u: Pick<AdminUser, 'first_name' | 'last_name'>) =>
  `${u.first_name} ${u.last_name}`.trim();

/**
 * Search-driven employee picker for the admin schedule page. Debounced query
 * over /admin/users; clicking a result calls `onSelect`. Kept separate from the
 * grid so the page just owns the selected employee.
 */
export function EmployeePicker({
  selected,
  onSelect,
}: {
  selected: AdminUser | null;
  onSelect: (u: AdminUser) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: adminScheduleKeys.picker(debounced),
    queryFn: () => adminUsersApi.list({ search: debounced || undefined, limit: 8, is_active: true }),
    enabled: debounced.length > 0,
    placeholderData: (prev) => prev,
  });

  const results = query.data?.data ?? [];

  return (
    <div className="space-y-2">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search an employee by name or email…"
          aria-label="Search employee"
          className={inputCls}
        />
      </div>

      {debounced.length > 0 && (
        <ul className="max-w-sm divide-y divide-neutral-100 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-400">
              {query.isLoading ? 'Searching…' : 'No matches'}
            </li>
          )}
          {results.map((u) => {
            const isSelected = selected?.id === u.id;
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50',
                    isSelected && 'bg-neutral-50',
                  )}
                >
                  <span className="font-medium text-neutral-900">{employeeName(u)}</span>
                  <span className="truncate pl-3 text-xs text-neutral-400">{u.email}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
