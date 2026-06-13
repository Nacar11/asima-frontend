'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { usePermissions } from '@/features/auth/use-permissions';
import { useAuth } from '@/features/auth/use-auth';
import { hasPermission } from '@/features/auth/permission-utils';
import { usePendingApprovals } from '@/features/approvals/hooks/use-pending-approvals';
import { APPROVAL_ACTIONS } from '@/features/approvals/actions';
import { RejectApprovalDialog } from '@/features/approvals/components/reject-approval-dialog';
import { ApprovalsEmptyState } from '@/features/approvals/components/approvals-empty-state';
import { ApprovalsTable } from '@/features/approvals/components/approvals-table';
import type { PendingApproval, PendingApprovalKind } from '@/features/approvals/schemas';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';

const PAGE_LIMIT = 20;

/** Shared prop contract for the per-kind detail drawer the inbox renders. */
export type ApprovalDetailDrawerProps = {
  row: PendingApproval | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (row: PendingApproval) => void;
  onReject?: (row: PendingApproval) => void;
  busy?: boolean;
};

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body!.message.join(', ') : body?.message;
    return msg
      ? `${err.status}: ${msg}`
      : `Request failed (HTTP ${err.status}). Please try again.`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong while loading approvals.';
}

/**
 * Generic single-kind approvals inbox. Each resource page renders this with
 * its `type` and matching `DetailDrawer`; the query, approve/reject
 * mutations, reject-note dialog, pagination, and the selected-row drawer all
 * live here once. Identity/scoping is the server's job (`APPROVAL:View`,
 * `findInboxForApprover`); the `canSeeAll` flag only switches the subtitle.
 */
export function ApprovalsInbox({
  type,
  title,
  DetailDrawer,
}: {
  type: PendingApprovalKind;
  title: string;
  DetailDrawer: React.ComponentType<ApprovalDetailDrawerProps>;
}) {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const isSysAdmin = user?.system_admin ?? false;
  const canSeeAll =
    isSysAdmin || hasPermission(permissions, 'APPROVAL:ApproveAny', isSysAdmin);

  const [page, setPage] = useState(1);
  const query = usePendingApprovals({ type, page, limit: PAGE_LIMIT });

  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PendingApproval | null>(null);
  const [rejecting, setRejecting] = useState<PendingApproval | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['approvals'] });

  const approveMutation = useMutation({
    mutationFn: (row: PendingApproval) => {
      const handlers = APPROVAL_ACTIONS[row.kind];
      if (!handlers) throw new Error(`No approve handler for kind ${row.kind}`);
      return handlers.approve(row.id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success('Request approved.');
      setSelected(null);
    },
    onError: () => toast.error('Could not approve the request.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ row, note }: { row: PendingApproval; note: string }) => {
      const handlers = APPROVAL_ACTIONS[row.kind];
      if (!handlers) throw new Error(`No reject handler for kind ${row.kind}`);
      return handlers.reject(row.id, note);
    },
    onSuccess: () => {
      void invalidate();
      toast.success('Request rejected.');
      setRejecting(null);
      setSelected(null);
    },
    onError: () => toast.error('Could not reject the request.'),
  });

  // Opening the reject dialog also closes the drawer so the two overlays
  // never stack. Both the table row and the drawer route through here.
  const openReject = (row: PendingApproval) => {
    setSelected(null);
    setRejecting(row);
  };

  const busy = approveMutation.isPending || rejectMutation.isPending;
  const pendingId = approveMutation.isPending
    ? (approveMutation.variables?.id ?? null)
    : null;
  const drawerBusy = busy && selected != null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">
          {canSeeAll
            ? 'Every pending request across the organization.'
            : 'Requests where you are the current approver.'}
        </p>
      </header>

      {query.isLoading && <p className="text-sm text-neutral-500">Loading approvals…</p>}

      {query.error && (
        <EmptyState
          tone="error"
          icon={AlertTriangle}
          title="Couldn't load approvals"
          description={describeError(query.error)}
          action={
            <button
              type="button"
              onClick={() => query.refetch()}
              className={cn(
                'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm',
                'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
              )}
            >
              Try again
            </button>
          }
        />
      )}

      {query.data &&
        (query.data.data.length === 0 ? (
          <ApprovalsEmptyState canSeeAll={canSeeAll} />
        ) : (
          <ApprovalsTable
            rows={query.data.data}
            onDetails={(row) => setSelected(row)}
            onApprove={(row) => approveMutation.mutate(row)}
            onReject={openReject}
            pendingId={pendingId}
          />
        ))}

      {query.data && query.data.total > PAGE_LIMIT && (
        <Paginator
          page={query.data.page}
          hasMore={query.data.has_more}
          total={query.data.total}
          limit={query.data.limit}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <DetailDrawer
        row={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onApprove={(row) => approveMutation.mutate(row)}
        onReject={openReject}
        busy={drawerBusy}
      />

      <RejectApprovalDialog
        open={rejecting !== null}
        summary={rejecting?.summary ?? ''}
        pending={rejectMutation.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(note) => {
          if (rejecting) rejectMutation.mutate({ row: rejecting, note });
        }}
      />
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
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 1}
          className={cn(
            'rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700',
            'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasMore}
          className={cn(
            'rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700',
            'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
