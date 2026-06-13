'use client';

import { RequirePermission } from '@/components/require-permission';
import { LeaveApprovalsPage } from '@/features/approvals/components/leave-approvals-page';

export default function Page() {
  return (
    <RequirePermission code="APPROVAL:View">
      <LeaveApprovalsPage />
    </RequirePermission>
  );
}
