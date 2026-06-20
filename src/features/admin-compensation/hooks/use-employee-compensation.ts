'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCompensationApi } from '@/features/admin-compensation/api';
import { adminCompensationKeys } from '@/features/admin-compensation/keys';

/** An employee's compensation history (newest first). Disabled until one is picked. */
export function useEmployeeCompensation(employeeId: number | null) {
  return useQuery({
    queryKey:
      employeeId !== null
        ? adminCompensationKeys.byEmployee(employeeId)
        : adminCompensationKeys.none(),
    queryFn: () => adminCompensationApi.historyForEmployee(employeeId!),
    enabled: employeeId !== null,
  });
}
