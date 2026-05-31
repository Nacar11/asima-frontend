'use client';

import { RequirePermission } from '@/components/require-permission';
import { ApproversPage } from '@/features/admin-approvers/components/approvers-page';

export default function AdminApproversRoute() {
  return (
    <RequirePermission code="APPROVAL_CHAIN:View">
      <ApproversPage />
    </RequirePermission>
  );
}
