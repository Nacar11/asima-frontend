'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';

/**
 * Soft-delete an employee. Invalidates the user list and toasts success/error;
 * the component closes the dialog via the `.mutate()` `onSuccess`.
 */
export function useDeleteAdminUser(userId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (userId == null) throw new Error('No user selected');
      return adminUsersApi.remove(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success('Employee deleted.');
    },
    onError: () => toast.error('Could not delete employee.'),
  });
}
