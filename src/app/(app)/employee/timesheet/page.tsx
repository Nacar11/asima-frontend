'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeEntriesApi } from '@/features/time-entries/api';
import { timeEntryKeys } from '@/features/time-entries/keys';
import { EntriesTable } from '@/features/time-entries/components/entries-table';
import { RequestCorrectionDrawer } from '@/features/time-correction/components/request-correction-drawer';
import { AddLogDrawer } from '@/features/time-correction/components/add-log-drawer';
import { useMyCorrectionsByEntry } from '@/features/time-correction/hooks/use-my-active-corrections';
import { scheduleApi } from '@/features/schedule/api';
import { scheduleKeys } from '@/features/schedule/keys';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/lib/use-pagination';
import { cn } from '@/lib/cn';
import type { TimeEntry } from '@/features/time-entries/schemas';

const PAGE_LIMIT = 20;

export default function MyTimeSheetPage() {
  const { page, toPrev, toNext } = usePagination();
  const [correcting, setCorrecting] = useState<TimeEntry | null>(null);
  const [addingLog, setAddingLog] = useState(false);

  const listQuery = useQuery({
    queryKey: timeEntryKeys.meList(page),
    queryFn: () => timeEntriesApi.listMine({ page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  const scheduleQuery = useQuery({
    queryKey: scheduleKeys.me(),
    queryFn: () => scheduleApi.mySchedule(),
  });

  const correctionsByEntry = useMyCorrectionsByEntry(listQuery.data?.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Time sheet</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Daily attendance and hours worked. Punch in/out from Home.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddingLog(true)}
          className={cn(
            'shrink-0 rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white shadow-sm',
            'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
          )}
        >
          Add Logs
        </button>
      </div>

      {listQuery.isLoading && <p className="text-sm text-neutral-500">Loading entries…</p>}
      {listQuery.error && <p className="text-sm text-red-700">Could not load entries.</p>}
      {listQuery.data && (
        <EntriesTable
          rows={listQuery.data.data}
          schedules={scheduleQuery.data ?? []}
          onRequestCorrection={setCorrecting}
          correctionsByEntry={correctionsByEntry}
        />
      )}

      {listQuery.data && listQuery.data.total > PAGE_LIMIT && (
        <Pagination
          page={listQuery.data.page}
          hasMore={listQuery.data.has_more}
          total={listQuery.data.total}
          limit={listQuery.data.limit}
          onPrev={toPrev}
          onNext={toNext}
        />
      )}

      <RequestCorrectionDrawer
        entry={correcting}
        open={correcting !== null}
        onClose={() => setCorrecting(null)}
      />

      <AddLogDrawer open={addingLog} onClose={() => setAddingLog(false)} />
    </div>
  );
}
