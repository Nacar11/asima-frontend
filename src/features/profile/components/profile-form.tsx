'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '@/components/form/field';
import { useUpdateProfile } from '../hooks/use-update-profile-mutation';
import { UpdateMyProfileSchema, type MyProfile, type UpdateMyProfileInput } from '../schemas';
import { errorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';

/*
 * Profile editor — the only fields a user can change about themselves
 * are first_name and last_name (UpdateMeDto contract). Email, role, and
 * title are display-only here; an admin uses /admin/users/:id to change
 * them.
 */
export function ProfileForm({ initial }: { initial: MyProfile }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<UpdateMyProfileInput>({
    resolver: zodResolver(UpdateMyProfileSchema),
    defaultValues: {
      first_name: initial.first_name,
      last_name: initial.last_name,
    },
  });

  // If the parent refetches, keep the form in sync.
  useEffect(() => {
    form.reset({ first_name: initial.first_name, last_name: initial.last_name });
  }, [initial.first_name, initial.last_name, form]);

  const mutation = useUpdateProfile();

  const onSubmit = form.handleSubmit((input) =>
    mutation.mutate(input, {
      onSuccess: () => setServerError(null),
      onError: (err) =>
        setServerError(errorMessage(err, 'Could not update profile. Please try again.')),
    }),
  );
  const pending = mutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          htmlFor="first_name"
          error={form.formState.errors.first_name?.message}
        >
          <input
            id="first_name"
            type="text"
            placeholder="Admin"
            className={inputCls(!!form.formState.errors.first_name)}
            {...form.register('first_name')}
          />
        </Field>
        <Field
          label="Last name"
          htmlFor="last_name"
          error={form.formState.errors.last_name?.message}
        >
          <input
            id="last_name"
            type="text"
            placeholder="Admin"
            className={inputCls(!!form.formState.errors.last_name)}
            {...form.register('last_name')}
          />
        </Field>
      </div>

      <DisplayOnly label="Email" value={initial.email} />
      <DisplayOnly label="Title" value={initial.title ?? '—'} />
      <DisplayOnly label="Role" value={initial.role.name} />

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !form.formState.isDirty}
        className={cn(
          'inline-flex items-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
          'transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-950',
        )}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

const inputCls = (error: boolean) =>
  cn(
    'block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm',
    'focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
  );

const DisplayOnly = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
    <span className="text-neutral-500">{label}</span>
    <span className="font-medium text-neutral-900">{value}</span>
  </div>
);
