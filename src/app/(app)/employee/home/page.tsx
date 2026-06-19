'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { timeEntriesApi } from '@/features/time-entries/api';
import { timeEntryKeys } from '@/features/time-entries/keys';
import { usePunch } from '@/features/time-entries/hooks/use-punch-mutation';
import { durationMinutes, formatDuration } from '@/features/time-entries/schemas';
import { findScheduleForDate, tardinessMinutes } from '@/features/time-entries/metrics';
import { cooldownRemainingSeconds } from '@/features/time-entries/cooldown';
import { scheduleApi } from '@/features/schedule/api';
import { scheduleKeys } from '@/features/schedule/keys';
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

const hhmm = (t: string) => t.slice(0, 5);
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function HomePage() {
  const { user } = useAuth();
  const now = useNow();

  const todayQuery = useQuery({
    queryKey: timeEntryKeys.today(),
    queryFn: () => timeEntriesApi.today(),
  });
  const scheduleQuery = useQuery({
    queryKey: scheduleKeys.me(),
    queryFn: () => scheduleApi.mySchedule(),
  });

  const entries = useMemo(() => todayQuery.data?.data ?? [], [todayQuery.data]);
  const openEntry: TimeEntry | undefined = useMemo(
    () => entries.find((e) => e.status === 'open'),
    [entries],
  );
  const isClockedIn = !!openEntry;

  const todaySchedule = useMemo(
    () => findScheduleForDate(scheduleQuery.data ?? [], todayStr()),
    [scheduleQuery.data],
  );

  // Last punch event (latest time_out, or time_in if still open) drives the
  // optimistic cooldown countdown. The 429 from the server is authoritative.
  const lastEventIso = useMemo(() => {
    const times = entries.map((e) => e.time_out ?? e.time_in).filter(Boolean) as string[];
    return times.sort().at(-1) ?? null;
  }, [entries]);
  const cooldownLeft = cooldownRemainingSeconds(lastEventIso, now);
  const onCooldown = cooldownLeft > 0;

  const workedTodayMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + (durationMinutes(e) ?? 0), 0),
    [entries],
  );

  // Tardiness for the in-progress session, shown as a chip while clocked in.
  const openLate = isClockedIn && openEntry ? tardinessMinutes(openEntry, todaySchedule) : null;

  const mutation = usePunch();

  const onPunch = () =>
    mutation.mutate(undefined, {
      onSuccess: () => {
        if (!isClockedIn) {
          const late = tardinessMinutes(
            { time_in: new Date().toISOString() } as TimeEntry,
            todaySchedule,
          );
          toast.success(late && late > 0 ? `Punched in — you're ${late} min late.` : 'Punched in.');
        } else {
          toast.success('Punched out.');
        }
      },
    });

  const pending = mutation.isPending || todayQuery.isLoading;
  const disabled = pending || onCooldown;

  const timeLabel = formatInTz(now, { hour: 'numeric', minute: '2-digit', hour12: true });
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
          onClick={onPunch}
          disabled={disabled}
          aria-label={isClockedIn ? 'Punch out' : 'Punch in'}
          className={cn(
            'flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-full text-white shadow-xl transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-4',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'sm:h-56 sm:w-56',
            isClockedIn
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              : 'bg-neutral-950 hover:bg-neutral-800 focus:ring-neutral-900',
            !disabled && 'hover:scale-[1.02] active:scale-[0.98]',
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

        <div className="flex flex-col items-center gap-2">
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
              <span className="text-neutral-500">· since {formatTimeInTz(openEntry.time_in)}</span>
            )}
            {openLate !== null && openLate > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {openLate} min late
              </span>
            )}
          </div>

          {onCooldown && (
            <p className="text-xs text-neutral-500" aria-live="polite">
              You can punch again in{' '}
              <span className="font-medium tabular-nums text-neutral-700">
                {Math.floor(cooldownLeft / 60)}:{String(cooldownLeft % 60).padStart(2, '0')}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card title="Today's sessions">
          {entries.length === 0 ? (
            <p className="text-sm text-neutral-500">No punches yet today.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between tabular-nums">
                  <span className="text-neutral-800">
                    {formatTimeInTz(e.time_in)} → {e.time_out ? formatTimeInTz(e.time_out) : '—'}
                  </span>
                  <span className="text-neutral-500">{formatDuration(durationMinutes(e))}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-neutral-100 pt-2 text-sm">
            <span className="text-neutral-500">Worked today: </span>
            <span className="font-medium tabular-nums text-neutral-900">
              {formatDuration(workedTodayMinutes)}
            </span>
          </p>
        </Card>

        <Card title="Today's schedule">
          {todaySchedule ? (
            <p className="text-sm tabular-nums text-neutral-800">
              {hhmm(todaySchedule.expected_in)} – {hhmm(todaySchedule.expected_out)}
              <span className="ml-2 text-neutral-500">expected</span>
            </p>
          ) : (
            <p className="text-sm text-neutral-500">No schedule today.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {title}
      </h2>
      {children}
    </section>
  );
}
