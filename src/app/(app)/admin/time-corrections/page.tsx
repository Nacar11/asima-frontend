'use client';

import { RequirePermission } from '@/components/require-permission';
import { AdminTimeCorrectionsPage } from '@/features/time-correction/components/admin-tc-page';

export default function AdminTimeCorrectionsRoute() {
  return (
    <RequirePermission code="TIME_CORRECTION:ViewAll">
      <AdminTimeCorrectionsPage />
    </RequirePermission>
  );
}
