'use client';

import { ApprovalsInbox } from '@/features/approvals/components/approvals-inbox';
import { LeaveApprovalDetailDrawer } from '@/features/approvals/components/leave-approval-detail-drawer';

/** Leave-only pending-approvals inbox (`/leave-approvals`). */
export function LeaveApprovalsPage() {
  return (
    <ApprovalsInbox
      type="leave"
      title="Pending Approvals (Leaves)"
      DetailDrawer={LeaveApprovalDetailDrawer}
    />
  );
}
