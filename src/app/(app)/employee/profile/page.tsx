'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/layout/app-shell';
import { profileApi } from '@/features/profile/api';
import { profileKeys } from '@/features/profile/keys';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { PasswordChangeForm } from '@/features/profile/components/password-change-form';
import { CompensationCard } from '@/features/profile/components/compensation-card';

export default function MyProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.me(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">My profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Update your display name and password. Email, title, and role are managed by HR.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-950">Identity</h2>
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {error && (
          <p className="text-sm text-red-700">
            Could not load profile. Refresh the page or contact HR if this persists.
          </p>
        )}
        {data && <ProfileForm initial={data} />}
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-neutral-950">Password</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Changing your password does not sign you out of other devices.
        </p>
        <PasswordChangeForm />
      </Card>

      <CompensationCard />
    </div>
  );
}
