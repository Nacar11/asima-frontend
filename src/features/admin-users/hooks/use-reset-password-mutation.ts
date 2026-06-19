'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '@/features/admin-users/api';
import type { ResetUserPasswordInput } from '@/features/admin-users/schemas';

/**
 * Admin force-reset of a user's password. Toasts success/error; the component
 * resets the form and closes the drawer via the `.mutate()` `onSuccess`.
 */
export function useResetUserPassword(userId: number | undefined) {
  return useMutation({
    mutationFn: (input: ResetUserPasswordInput) => {
      if (userId == null) throw new Error('No user selected');
      return adminUsersApi.resetPassword(userId, input);
    },
    onSuccess: () => toast.success('Password reset. Share the new password securely.'),
    onError: () => toast.error('Could not reset password.'),
  });
}
