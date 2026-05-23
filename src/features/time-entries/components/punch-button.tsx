'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { timeEntriesApi } from '@/features/time-entries/api';
import { formatTimeInTz } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import type { TimeEntry, TimeEntryList } from '@/features/time-entries/schemas';

/*
 * Instant-punch toggle per SPEC §11c. No modal, no confirmation: the
 * button label and surrounding state make the action self-describing.
 * Today's list (above the button) refetches after each punch so the
 * user sees their action land immediately.
 *
 * The backend's `/punch` endpoint is idempotent in behavior: if there's
 * an open entry it closes it; otherwise it creates a new one. The DB
 * partial unique index prevents two simultaneous opens, so concurrent
 * clicks (e.g. two tabs) surface as a 409 — we treat that the same as
 * a successful refetch, since the next reload will reflect the actual
 * state.
 */
export function PunchButton() {
  const queryClient = useQueryClient();

  const todayQuery = useQuery({
    queryKey: ['time-entries', 'today'],
    queryFn: () => timeEntriesApi.today(),
  });

  const openEntry: TimeEntry | undefined = useMemo(() => {
    const list = todayQuery.data?.data ?? [];
    return list.find((e) => e.status === 'open');
  }, [todayQuery.data]);

  const mutation = useMutation({
    mutationFn: () => timeEntriesApi.punch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success(openEntry ? 'Punched out.' : 'Punched in.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        toast.warning('Punch state already updated — refreshed.');
        return;
      }
      toast.error('Could not punch. Try again.');
    },
  });

  const pending = mutation.isPending || todayQuery.isLoading;
  const isClockedIn = !!openEntry;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isClockedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500',
            )}
          >
            <Clock className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              {isClockedIn ? 'You are clocked in' : 'You are clocked out'}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isClockedIn && openEntry
                ? `Since ${formatTimeInTz(openEntry.time_in)}`
                : 'Tap punch in to start your shift'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={pending}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            isClockedIn
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 focus:ring-neutral-950'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isClockedIn ? (
            <>
              <LogOut className="h-4 w-4" aria-hidden /> Punch out
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden /> Punch in
            </>
          )}
        </button>
      </div>
    </div>
  );
}
