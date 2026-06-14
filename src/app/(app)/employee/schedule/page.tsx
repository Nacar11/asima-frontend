'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/layout/app-shell';
import { scheduleApi } from '@/features/schedule/api';
import { scheduleKeys } from '@/features/schedule/keys';
import { WeeklySchedule } from '@/features/schedule/components/weekly-schedule';

export default function MySchedulePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: scheduleKeys.me(),
    queryFn: () => scheduleApi.mySchedule(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">My schedule</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your active weekly schedule. HR manages changes — contact them to update.
        </p>
      </div>

      <Card className="p-0">
        {isLoading && <p className="p-6 text-sm text-neutral-500">Loading schedule…</p>}
        {error && <p className="p-6 text-sm text-red-700">Could not load schedule.</p>}
        {data && data.length === 0 && (
          <p className="p-6 text-sm text-neutral-500">No active schedule on file.</p>
        )}
        {data && data.length > 0 && <WeeklySchedule rows={data} />}
      </Card>
    </div>
  );
}
