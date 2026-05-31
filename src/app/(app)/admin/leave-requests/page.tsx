'use client';

import { RequirePermission } from '@/components/require-permission';
import { AdminLeavePage } from '@/features/leave/components/admin-leave-page';

export default function AdminLeaveRequestsRoute() {
  return (
    <RequirePermission code="LEAVE:ViewAll">
      <AdminLeavePage />
    </RequirePermission>
  );
}
