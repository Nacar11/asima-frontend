'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
import type { CreateAdminUserInput } from '@/features/admin-users/schemas';
import { ApiError } from '@/lib/api-client';

/**
 * Create an employee. Invalidates the user list and toasts success/conflict.
 * The component passes `onSuccess` to `.mutate()` for the form reset + close.
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminUserInput) => adminUsersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success('Employee created.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Email already in use.');
        return;
      }
      toast.error('Could not create employee.');
    },
  });
}
