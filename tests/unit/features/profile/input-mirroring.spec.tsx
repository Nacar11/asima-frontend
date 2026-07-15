import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { PasswordChangeForm } from '@/features/profile/components/password-change-form';
import type { MirrorEvent } from '@/features/profile/mirror';
import type { MyProfile } from '@/features/profile/schemas';

vi.mock('@/features/profile/api', () => ({
  profileApi: { update: vi.fn(), changePassword: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PROFILE: MyProfile = {
  id: 1,
  email: 'admin@asima.inc',
  first_name: 'Asima',
  last_name: 'Admin',
  title: 'System Administrator',
  is_active: true,
  system_admin: true,
  role: { id: 1, name: 'SUPER_ADMIN' },
};

/* Mirrors the wiring in src/app/(app)/employee/profile/page.tsx. */
function Harness() {
  const [mirror, setMirror] = useState<MirrorEvent | null>(null);
  return (
    <>
      <ProfileForm initial={PROFILE} mirror={mirror} onMirrorInput={setMirror} />
      <PasswordChangeForm mirror={mirror} onMirrorInput={setMirror} />
    </>
  );
}

function renderHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

const allFields = () =>
  ['First name', 'Last name', 'Current password', 'New password', 'Confirm new password'].map(
    (label) => screen.getByLabelText(label),
  );

describe('profile page input mirroring (demo)', () => {
  it('typing in First name mirrors the value into all five fields', async () => {
    const user = userEvent.setup();
    renderHarness();

    const firstName = screen.getByLabelText('First name');
    await user.clear(firstName);
    await user.type(firstName, 'Admin1!');

    for (const field of allFields()) expect(field).toHaveValue('Admin1!');
  });

  it('typing in a password field mirrors back into the name fields', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.type(screen.getByLabelText('New password'), 'Zed9!');

    for (const field of allFields()) expect(field).toHaveValue('Zed9!');
  });
});
