'use client';

import { RequirePermission } from '@/components/require-permission';
import { ApprovalsPage } from '@/features/approvals/components/approvals-page';

export default function Page() {
  return (
    <RequirePermission code="APPROVAL:View">
      <ApprovalsPage />
    </RequirePermission>
  );
}
