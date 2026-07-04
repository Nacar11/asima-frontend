'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeCorrectionApi } from '../api';
import { timeCorrectionKeys } from '../keys';
import type { TcStatus, TimeCorrectionRequest } from '../schemas';

/** Statuses that block a second correction for the same entry (mirrors the
 *  backend's `findActiveForEntry`) — and exactly the ones the timesheet
 *  surfaces in its Status / Approver columns. */
const ACTIVE_STATUSES: TcStatus[] = ['pending_l1', 'pending_l2', 'approved'];

/**
 * Pure: map `target_entry_id` → correction, skipping null-target (new-log)
 * rows. Keying by entry is what stops a correction on one entry from lighting
 * up sibling rows on the same day (the per-entry model).
 */
export function keyCorrectionsByEntry(
  rows: TimeCorrectionRequest[],
): Map<number, TimeCorrectionRequest> {
  const out = new Map<number, TimeCorrectionRequest>();
  for (const r of rows) {
    if (r.target_entry_id != null) out.set(r.target_entry_id, r);
  }
  return out;
}

/**
 * Map of `target_entry_id` → active correction, over the date span of the
 * passed entries. The timesheet uses it to drive the Status / Approver /
 * in-out-diff columns and the "Correction requested" guard per entry. The query
 * is bounded to the visible window (and active statuses) so it can't miss a
 * row's correction nor grow unbounded with history.
 */
export function useMyCorrectionsByEntry(
  entries: { work_date: string }[],
): Map<number, TimeCorrectionRequest> {
  const dates = entries.map((e) => e.work_date).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const query = useQuery({
    queryKey: timeCorrectionKeys.meActive(from, to),
    queryFn: () => timeCorrectionApi.me.list({ from, to, status: ACTIVE_STATUSES, limit: 100 }),
    enabled: dates.length > 0,
  });

  return useMemo(() => keyCorrectionsByEntry(query.data?.data ?? []), [query.data]);
}
