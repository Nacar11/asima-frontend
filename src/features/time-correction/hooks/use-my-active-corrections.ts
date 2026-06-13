'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeCorrectionApi } from '@/features/time-correction/api';
import type { TcStatus } from '@/features/time-correction/schemas';

/** Statuses that block a second correction for the same day (mirrors the
 *  backend's `findActiveForEmployeeDate`). */
const ACTIVE_STATUSES: TcStatus[] = ['pending_l1', 'pending_l2', 'approved'];

/**
 * Returns the set of `work_date`s — scoped to the date span of the passed
 * entries — that already have an active correction. The timesheet uses it to
 * disable "Request correction" on those rows. The query is bounded to the
 * visible window (and active statuses) so it can't miss a row's correction nor
 * grow unbounded with history (review fix #2).
 */
export function useMyActiveCorrections(entries: { work_date: string }[]): Set<string> {
  const dates = entries.map((e) => e.work_date).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const query = useQuery({
    queryKey: ['time-correction', 'me', 'active', from, to],
    queryFn: () => timeCorrectionApi.me.list({ from, to, status: ACTIVE_STATUSES, limit: 100 }),
    enabled: dates.length > 0,
  });

  return useMemo(() => new Set((query.data?.data ?? []).map((r) => r.work_date)), [query.data]);
}
