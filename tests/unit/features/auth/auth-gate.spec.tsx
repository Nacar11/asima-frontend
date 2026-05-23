import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue } from '@/features/auth/auth-provider';
import { AuthContext } from '@/features/auth/auth-provider';
import { AuthGate } from '@/features/auth/components/auth-gate';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

function wrap(value: Partial<AuthContextValue>) {
  const merged: AuthContextValue = {
    status: 'loading',
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...value,
  };
  return (
    <AuthContext.Provider value={merged}>
      <AuthGate>
        <div>secret content</div>
      </AuthGate>
    </AuthContext.Provider>
  );
}

describe('AuthGate', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('renders a loading state while auth bootstraps', () => {
    render(wrap({ status: 'loading' }));
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login?reason=expired when unauthenticated', () => {
    render(wrap({ status: 'unauthenticated' }));
    expect(replace).toHaveBeenCalledWith('/login?reason=expired');
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    render(
      wrap({
        status: 'authenticated',
        user: {
          id: 1,
          email: 'u@example.com',
          first_name: 'U',
          last_name: 'Ser',
          title: null,
          is_active: true,
          system_admin: false,
          role: { id: 1, name: 'EMPLOYEE' },
        },
      }),
    );
    expect(screen.getByText('secret content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
