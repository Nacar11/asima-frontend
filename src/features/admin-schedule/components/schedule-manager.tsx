'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/features/auth/use-auth';
import { usePermissions } from '@/features/auth/use-permissions';
import { hasPermission } from '@/features/auth/permission-utils';
import type { WorkSchedule } from '@/features/schedule/schemas';
import { WeeklyGrid } from '@/features/admin-schedule/components/weekly-grid';
import {
  EditScheduleDrawer,
  todayStr,
} from '@/features/admin-schedule/components/edit-schedule-drawer';
import { ImpactDialog } from '@/features/admin-schedule/components/impact-dialog';
import { useScheduleChange } from '@/features/admin-schedule/hooks/use-schedule-change';
import {
  previewedFrom,
  type ScheduleChangeImpact,
  type ScheduleChangeIntent,
} from '@/features/admin-schedule/schemas';

/**
 * The actionable schedule surface for one employee: the weekly grid plus the
 * full change flow (edit drawer / remove → cascade preview → confirm dialog →
 * apply). A 409 ("affected set drifted since preview") silently re-runs the
 * preview so the admin reviews the fresh impact before committing.
 */
export function ScheduleManager({
  employeeId,
  rows,
}: {
  employeeId: number;
  rows: WorkSchedule[];
}) {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const isAdmin = user?.system_admin ?? false;
  const canEdit = hasPermission(permissions, 'SCHEDULE:Update', isAdmin);
  const canRemove = hasPermission(permissions, 'SCHEDULE:Delete', isAdmin);

  const { preview, apply } = useScheduleChange(employeeId);
  const [editing, setEditing] = useState<WorkSchedule | null>(null);
  const [pending, setPending] = useState<{
    intent: ScheduleChangeIntent;
    impact: ScheduleChangeImpact;
  } | null>(null);

  async function runPreview(intent: ScheduleChangeIntent) {
    try {
      const impact = await preview.mutateAsync(intent);
      setEditing(null);
      setPending({ intent, impact });
    } catch {
      toast.error('Could not preview the change.');
    }
  }

  function onRemove(row: WorkSchedule) {
    void runPreview({
      employee_id: employeeId,
      day_of_week: row.day_of_week,
      effective_from: todayStr(),
      mode: 'remove',
    });
  }

  async function onConfirm() {
    if (!pending) return;
    try {
      await apply.mutateAsync({ intent: pending.intent, previewed: previewedFrom(pending.impact) });
      setPending(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // The affected set changed between preview and apply — re-preview.
        try {
          const impact = await preview.mutateAsync(pending.intent);
          setPending({ intent: pending.intent, impact });
          toast.message('The affected requests changed — please review again.');
        } catch {
          setPending(null);
          toast.error('Please re-open the change and try again.');
        }
        return;
      }
      toast.error('Could not apply the change.');
    }
  }

  return (
    <>
      <WeeklyGrid
        rows={rows}
        canEdit={canEdit}
        canRemove={canRemove}
        onEdit={setEditing}
        onRemove={onRemove}
      />

      <EditScheduleDrawer
        employeeId={employeeId}
        row={editing}
        open={editing !== null}
        submitting={preview.isPending}
        onClose={() => setEditing(null)}
        onPreview={runPreview}
      />

      <ImpactDialog
        impact={pending?.impact ?? null}
        open={pending !== null}
        submitting={apply.isPending || preview.isPending}
        onConfirm={onConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
