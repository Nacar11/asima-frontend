'use client';

import { RequirePermission } from '@/components/require-permission';
import { TimeCorrectionApprovalsPage } from '@/features/approvals/components/time-correction-approvals-page';

export default function Page() {
  return (
    <RequirePermission code="APPROVAL:View">
      <TimeCorrectionApprovalsPage />
    </RequirePermission>
  );
}
