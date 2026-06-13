'use client';

import { ApprovalsInbox } from '@/features/approvals/components/approvals-inbox';
import { TimeCorrectionApprovalDetailDrawer } from '@/features/approvals/components/time-correction-approval-detail-drawer';

/** Time-correction-only pending-approvals inbox (`/time-correction-approvals`). */
export function TimeCorrectionApprovalsPage() {
  return (
    <ApprovalsInbox
      type="time_correction"
      title="Pending Approvals (Time Corrections)"
      DetailDrawer={TimeCorrectionApprovalDetailDrawer}
    />
  );
}
