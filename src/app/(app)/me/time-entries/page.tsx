'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeEntriesApi } from '@/features/time-entries/api';
import { PunchButton } from '@/features/time-entries/components/punch-button';
import { EntriesTable } from '@/features/time-entries/components/entries-table';
import { cn } from '@/lib/cn';

const PAGE_LIMIT = 20;

export default function MyTimeEntriesPage() {
  const [page, setPage] = useState(1);

  const listQuery = useQuery({
    queryKey: ['time-entries', 'me', page],
    queryFn: () => timeEntriesApi.listMine({ page, limit: PAGE_LIMIT }),
    // Keep previous data while paginating so the table doesn't flicker.
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">My time entries</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Punch in to start your shift; punch out to close it.
        </p>
      </div>

      <PunchButton />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-950">History</h2>
        {listQuery.isLoading && (
          <p className="text-sm text-neutral-500">Loading entries…</p>
        )}
        {listQuery.error && (
          <p className="text-sm text-red-700">Could not load history.</p>
        )}
        {listQuery.data && <EntriesTable rows={listQuery.data.data} />}

        {listQuery.data && (listQuery.data.total > PAGE_LIMIT) && (
          <Paginator
            page={listQuery.data.page}
            hasMore={listQuery.data.has_more}
            total={listQuery.data.total}
            limit={listQuery.data.limit}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </div>
    </div>
  );
}

function Paginator({
  page,
  hasMore,
  total,
  limit,
  onPrev,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  return (
    <div className="flex items-center justify-between text-xs text-neutral-500">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <PagerButton onClick={onPrev} disabled={page === 1}>
          Previous
        </PagerButton>
        <PagerButton onClick={onNext} disabled={!hasMore}>
          Next
        </PagerButton>
      </div>
    </div>
  );
}

const PagerButton = ({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700',
      'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50',
    )}
    {...rest}
  >
    {children}
  </button>
);
