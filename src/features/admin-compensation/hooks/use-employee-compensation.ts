'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCompensationApi } from '../api';
import { adminCompensationKeys } from '../keys';

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
