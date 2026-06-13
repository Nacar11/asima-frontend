'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeCorrectionApi } from '@/features/time-correction/api';
import type { TcStatus, TimeCorrectionRequest } from '@/features/time-correction/schemas';

/** Statuses that block a second correction for the same day (mirrors the
 *  backend's `findActiveForEmployeeDate`) — and exactly the ones the timesheet
 *  surfaces in its Status / Approver columns. */
const ACTIVE_STATUSES: TcStatus[] = ['pending_l1', 'pending_l2', 'approved'];

/**
 * Map of `work_date` → the active correction for that day, scoped to the date
 * span of the passed entries. The timesheet uses it to (a) disable "Request
 * correction" on days that already have one, and (b) render the Status,
 * Approver, and Time-in-out-diff columns. The backend allows at most one active
 * correction per (employee, day), so keying by date is unambiguous. The query
 * is bounded to the visible window (and active statuses) so it can't miss a
 * row's correction nor grow unbounded with history.
 */
export function useMyCorrectionsByDate(
  entries: { work_date: string }[],
): Map<string, TimeCorrectionRequest> {
  const dates = entries.map((e) => e.work_date).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const query = useQuery({
    queryKey: ['time-correction', 'me', 'active', from, to],
    queryFn: () => timeCorrectionApi.me.list({ from, to, status: ACTIVE_STATUSES, limit: 100 }),
    enabled: dates.length > 0,
  });

  return useMemo(
    () => new Map((query.data?.data ?? []).map((r) => [r.work_date, r] as const)),
    [query.data],
  );
}
