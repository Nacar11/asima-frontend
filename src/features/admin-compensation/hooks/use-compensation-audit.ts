'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCompensationApi } from '../api';
import { adminCompensationKeys } from '../keys';

/** The audit trail for one compensation row (newest first). Disabled until an id is given. */
export function useCompensationAudit(compensationId: number | null) {
  return useQuery({
    queryKey:
      compensationId !== null
        ? adminCompensationKeys.audit(compensationId)
        : adminCompensationKeys.none(),
    queryFn: () => adminCompensationApi.auditTrail(compensationId!),
    enabled: compensationId !== null,
  });
}
