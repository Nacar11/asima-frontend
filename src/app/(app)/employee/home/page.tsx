'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { timeEntriesApi } from '@/features/time-entries/api';
import { ApiError } from '@/lib/api-client';
import { formatInTz, formatTimeInTz } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { TimeEntry } from '@/features/time-entries/schemas';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = useNow();

  const todayQuery = useQuery({
    queryKey: ['time-entries', 'today'],
    queryFn: () => timeEntriesApi.today(),
  });

  const openEntry: TimeEntry | undefined = useMemo(
    () => todayQuery.data?.data?.find((e) => e.status === 'open'),
    [todayQuery.data],
  );
  const isClockedIn = !!openEntry;

  const mutation = useMutation({
    mutationFn: () => timeEntriesApi.punch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success(isClockedIn ? 'Punched out.' : 'Punched in.');
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

  const timeLabel = formatInTz(now, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateLabel = formatInTz(now, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 py-6">
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-500">
          {isClockedIn ? 'Good to see you back' : 'Welcome back'}
          {user ? `, ${user.first_name}` : ''}
        </p>
        <h1 className="mt-2 text-5xl font-semibold tabular-nums tracking-tight text-neutral-950 sm:text-6xl">
          {timeLabel}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">{dateLabel}</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={pending}
          aria-label={isClockedIn ? 'Punch out' : 'Punch in'}
          className={cn(
            'flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-full text-white shadow-xl transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-4',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'sm:h-56 sm:w-56',
            isClockedIn
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              : 'bg-neutral-950 hover:bg-neutral-800 focus:ring-neutral-900',
            !pending && 'hover:scale-[1.02] active:scale-[0.98]',
          )}
        >
          {isClockedIn ? (
            <LogOut className="h-12 w-12" aria-hidden />
          ) : (
            <LogIn className="h-12 w-12" aria-hidden />
          )}
          <span className="text-base font-semibold uppercase tracking-wider">
            {isClockedIn ? 'Punch out' : 'Punch in'}
          </span>
        </button>

        <div
          className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-sm ring-1 ring-neutral-200"
          aria-live="polite"
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isClockedIn ? 'bg-emerald-500' : 'bg-neutral-400',
            )}
            aria-hidden
          />
          <span className="font-medium text-neutral-700">
            {isClockedIn ? 'Clocked in' : 'Clocked out'}
          </span>
          {isClockedIn && openEntry && (
            <span className="text-neutral-500">
              · since {formatTimeInTz(openEntry.time_in)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
