import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequirePermission } from '@/components/require-permission';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { id: 1, system_admin: false },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const usePermissionsMock = vi.fn();
vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

describe('RequirePermission (APPROVAL:View gate)', () => {
  it('renders children when the required permission is present', () => {
    usePermissionsMock.mockReturnValue({
      permissions: ['APPROVAL:View'],
      isLoading: false,
      isError: false,
    });
    render(
      <RequirePermission code="APPROVAL:View">
        <div>approvals content</div>
      </RequirePermission>,
    );
    expect(screen.getByText('approvals content')).toBeInTheDocument();
  });

  it('renders <NotAuthorized /> when the permission is absent', () => {
    usePermissionsMock.mockReturnValue({
      permissions: [],
      isLoading: false,
      isError: false,
    });
    render(
      <RequirePermission code="APPROVAL:View">
        <div>approvals content</div>
      </RequirePermission>,
    );
    expect(screen.queryByText('approvals content')).not.toBeInTheDocument();
    expect(screen.getByText('Not authorized')).toBeInTheDocument();
  });

  it('renders nothing while permissions are loading', () => {
    usePermissionsMock.mockReturnValue({
      permissions: [],
      isLoading: true,
      isError: false,
    });
    const { container } = render(
      <RequirePermission code="APPROVAL:View">
        <div>approvals content</div>
      </RequirePermission>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
