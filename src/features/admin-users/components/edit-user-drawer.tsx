'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LabeledCheckbox } from '@/components/labeled-checkbox';
import { Select } from '@/components/select';
import { cn } from '@/lib/cn';
import { adminUsersApi } from '@/features/admin-users/api';
import { adminUserKeys } from '@/features/admin-users/keys';
import { adminRolesApi } from '@/features/admin-roles/api';
import { adminRoleKeys } from '@/features/admin-roles/keys';
import { adminApproversApi } from '@/features/admin-approvers/api';
import { adminApproverKeys } from '@/features/admin-approvers/keys';
import { formatRoleName } from '@/features/admin-roles/format';
import type { SetChainInput } from '@/features/admin-approvers/schemas';
import {
  UpdateAdminUserSchema,
  type AdminUser,
  type UpdateAdminUserInput,
} from '@/features/admin-users/schemas';

/** Empty string is the "— None —" sentinel for the approver selects. */
type ApproverValue = number | '';

export function EditUserDrawer({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: adminRoleKeys.list(),
    queryFn: () => adminRolesApi.list(),
    enabled: open,
  });

  // Candidate approvers — active users, capped. Excludes the employee
  // being edited (no self-approval) when building options below.
  const candidatesQuery = useQuery({
    queryKey: adminUserKeys.approverCandidates(),
    queryFn: () => adminUsersApi.list({ is_active: true, limit: 100 }),
    enabled: open,
    staleTime: 60 * 1000,
  });

  // Current chain for this employee, seeds the selects on open.
  const chainQuery = useQuery({
    queryKey: adminApproverKeys.chain(user?.id),
    queryFn: () => adminApproversApi.getOne(user!.id),
    enabled: open && user !== null,
  });

  const form = useForm<UpdateAdminUserInput>({
    resolver: zodResolver(UpdateAdminUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      title: '',
      role_id: 0,
      is_active: true,
    },
  });

  // Approver chain is a separate resource (different endpoint) — tracked
  // as local state, not part of the profile form.
  const [l1, setL1] = useState<ApproverValue>('');
  const [l2, setL2] = useState<ApproverValue>('');
  const [initialL1, setInitialL1] = useState<ApproverValue>('');
  const [initialL2, setInitialL2] = useState<ApproverValue>('');

  // Re-seed form whenever the selected user changes.
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        title: user.title ?? '',
        role_id: user.role_id,
        is_active: user.is_active,
      });
    }
  }, [user, form]);

  // Seed approver selects once the active chain loads.
  useEffect(() => {
    const rows = chainQuery.data;
    if (!rows) return;
    const seedL1: ApproverValue = rows.l1?.approver_id ?? '';
    const seedL2: ApproverValue = rows.l2?.approver_id ?? '';
    setL1(seedL1);
    setL2(seedL2);
    setInitialL1(seedL1);
    setInitialL2(seedL2);
  }, [chainQuery.data]);

  const approverOptions = useMemo(() => {
    const users = candidatesQuery.data?.data ?? [];
    return [
      { value: '' as const, label: '— None —' },
      ...users
        .filter((u) => u.id !== user?.id)
        .map((u) => ({
          value: String(u.id),
          label: `${u.first_name} ${u.last_name}`,
        })),
    ];
  }, [candidatesQuery.data, user?.id]);

  // Clearing L1 forces L2 to clear too (backend rejects L2 without L1).
  const handleL1Change = (next: ApproverValue) => {
    setL1(next);
    if (next === '') setL2('');
  };

  const chainChanged = l1 !== initialL1 || l2 !== initialL2;
  const dirty = form.formState.isDirty || chainChanged;

  const profileMutation = useMutation({
    mutationFn: (input: UpdateAdminUserInput) => {
      if (!user) throw new Error('No user selected');
      return adminUsersApi.update(user.id, input);
    },
  });

  const chainMutation = useMutation({
    mutationFn: (patch: SetChainInput) => {
      if (!user) throw new Error('No user selected');
      return adminApproversApi.setChain(user.id, patch);
    },
  });

  const saving = profileMutation.isPending || chainMutation.isPending;

  /** Tri-state diff: only send the steps that actually changed. */
  function buildChainPatch(): SetChainInput | null {
    const patch: SetChainInput = {};
    if (l1 !== initialL1) patch.l1_approver_id = l1 === '' ? null : l1;
    if (l2 !== initialL2) patch.l2_approver_id = l2 === '' ? null : l2;
    return Object.keys(patch).length > 0 ? patch : null;
  }

  const onSubmit = form.handleSubmit(async (input) => {
    const payload: UpdateAdminUserInput = {
      ...input,
      title: input.title?.length ? input.title : null,
    };

    try {
      await profileMutation.mutateAsync(payload);
    } catch {
      toast.error('Could not update employee.');
      return;
    }

    const patch = buildChainPatch();
    if (patch) {
      try {
        await chainMutation.mutateAsync(patch);
      } catch {
        // Profile already committed — don't silently roll it back.
        void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
        toast.error('Profile saved, approvers update failed — retry.');
        return;
      }
    }

    void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    void queryClient.invalidateQueries({ queryKey: adminApproverKeys.all });
    toast.success('Employee updated.');
    onClose();
  });

  const title = `Edit ${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title || 'Edit employee'}</SheetTitle>
          <SheetDescription>
            Email changes need a verification flow — not editable here. Use Reset password to set a
            new password.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="edit-user-form" onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={form.formState.errors.first_name?.message}>
                <input type="text" className={inputCls} {...form.register('first_name')} />
              </Field>
              <Field label="Last name" error={form.formState.errors.last_name?.message}>
                <input type="text" className={inputCls} {...form.register('last_name')} />
              </Field>
            </div>

            <Field label="Title" error={form.formState.errors.title?.message}>
              <input type="text" className={inputCls} {...form.register('title')} />
            </Field>

            <Field label="Role" error={form.formState.errors.role_id?.message}>
              <select
                className={inputCls}
                {...form.register('role_id', { valueAsNumber: true })}
                disabled={rolesQuery.isLoading}
              >
                {rolesQuery.data?.data.map((role) => (
                  <option key={role.id} value={role.id}>
                    {formatRoleName(role.name)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <ApproverField label="Level 1 approver">
                <Select<string>
                  value={l1 === '' ? '' : String(l1)}
                  onValueChange={(v) => handleL1Change(v === '' ? '' : Number(v))}
                  options={approverOptions}
                  ariaLabel="Level 1 approver"
                  placeholder="— None —"
                  disabled={candidatesQuery.isLoading}
                  className="w-full"
                />
              </ApproverField>
              <ApproverField label="Level 2 approver">
                <Select<string>
                  value={l2 === '' ? '' : String(l2)}
                  onValueChange={(v) => setL2(v === '' ? '' : Number(v))}
                  options={approverOptions}
                  ariaLabel="Level 2 approver"
                  placeholder="— None —"
                  disabled={candidatesQuery.isLoading || l1 === ''}
                  className="w-full"
                />
              </ApproverField>
            </div>
            {l1 === '' && (
              <p className="text-xs text-neutral-500">
                Assign a Level 1 approver before a Level 2.
              </p>
            )}

            <LabeledCheckbox
              control={form.control}
              name="is_active"
              label="Active"
              description="Inactive employees can't sign in."
            />
          </form>
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={saving || !dirty}
            className={btnPrimary}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const inputCls =
  'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:bg-neutral-50';

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/**
 * Approver picker uses a custom listbox (not a native <select>), so it
 * can't live inside a wrapping <label> the way Field does — the label is
 * a sibling and the control carries its own aria-label.
 */
function ApproverField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {children}
    </div>
  );
}
