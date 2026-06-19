'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileApi, type ChangeMyPasswordRequest } from '@/features/profile/api';

/**
 * Change the current user's password. Toasts success; the component handles
 * the error paths inline (429 throttle banner, 401 "current password is
 * incorrect", 400 validation) since they drive component-local state.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangeMyPasswordRequest) => profileApi.changePassword(input),
    onSuccess: () => {
      toast.success('Password updated.');
    },
  });
}
