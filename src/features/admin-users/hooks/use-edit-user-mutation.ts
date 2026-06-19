'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminApproverKeys } from '@/features/admin-approvers/keys';
import type { SetChainInput } from '@/features/admin-approvers/schemas';
import type { UpdateAdminUserInput } from '@/features/admin-users/schemas';

/**
 * Raised when the profile update committed but the subsequent approver-chain
 * update failed — lets the UI message the partial success distinctly.
 */
class ChainUpdateError extends Error {}

type EditUserVars = {
  input: UpdateAdminUserInput;
  /** Tri-state chain diff, or null when the chain is unchanged. */
  chainPatch: SetChainInput | null;
};

/**
 * Edit an employee: update the profile, then (if the chain changed) set the
 * approver chain. The two are sequential because the chain update must not run
 * if the profile save fails; if the profile commits but the chain fails we
 * surface a distinct "retry the approvers" message and still refresh the list.
 * Component handles the drawer close via the `.mutate()` `onSuccess`.
 */
export function useEditUser(userId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, chainPatch }: EditUserVars) => {
      if (userId == null) throw new Error('No user selected');
      await adminUsersApi.update(userId, input);
      if (chainPatch) {
        try {
          await adminApproversApi.setChain(userId, chainPatch);
        } catch {
          // Profile already committed — don't silently roll it back.
          void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
          throw new ChainUpdateError();
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminApproverKeys.all });
      toast.success('Employee updated.');
    },
    onError: (err) => {
      if (err instanceof ChainUpdateError) {
        toast.error('Profile saved, approvers update failed — retry.');
        return;
      }
      toast.error('Could not update employee.');
    },
  });
}
