'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileApi } from '../api';
import { profileKeys } from '../keys';
import type { UpdateMyProfileInput } from '../schemas';

/**
 * Update the current user's profile. Owns the server-state orchestration —
 * writes the fresh profile into the cache and toasts success. Callers pass
 * `onError`/`onSuccess` to `.mutate()` for UI-specific concerns (the inline
 * error banner).
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => profileApi.update(input),
    onSuccess: (next) => {
      queryClient.setQueryData(profileKeys.me(), next);
      toast.success('Profile updated.');
    },
  });
}
