'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/layout/app-shell';
import { profileApi } from '@/features/profile/api';
import { ProfileForm } from '@/features/profile/components/profile-form';

export default function MyProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.me(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">My profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Update your display name. Email, title, and role are managed by HR.
        </p>
      </div>

      <Card>
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {error && (
          <p className="text-sm text-red-700">
            Could not load profile. Refresh the page or contact HR if this persists.
          </p>
        )}
        {data && <ProfileForm initial={data} />}
      </Card>
    </div>
  );
}
