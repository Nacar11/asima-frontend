'use client';

import { ApprovalsInbox } from './approvals-inbox';
import { LeaveApprovalDetailDrawer } from './leave-approval-detail-drawer';

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
