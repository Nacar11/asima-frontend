import { describe, it, expect } from 'vitest';
import { MyProfileSchema, UpdateMyProfileSchema } from '@/features/profile/schemas';

describe('MyProfileSchema', () => {
  it('parses a valid /users/me payload', () => {
    const result = MyProfileSchema.parse({
      id: 1,
      email: 'jane@asima.dev',
      first_name: 'Jane',
      last_name: 'Smith',
      title: 'Senior PM',
      is_active: true,
      system_admin: false,
      role: { id: 4, name: 'PROJECT_MANAGER' },
    });
    expect(result.email).toBe('jane@asima.dev');
    expect(result.role.name).toBe('PROJECT_MANAGER');
  });

  it('accepts null title (backend allows it)', () => {
    expect(() =>
      MyProfileSchema.parse({
        id: 1,
        email: 'a@b.co',
        first_name: 'A',
        last_name: 'B',
        title: null,
        is_active: true,
        system_admin: false,
        role: { id: 1, name: 'EMPLOYEE' },
      }),
    ).not.toThrow();
  });
});

describe('UpdateMyProfileSchema', () => {
  it('trims whitespace before validating', () => {
    const result = UpdateMyProfileSchema.parse({
      first_name: '  Jane  ',
      last_name: '  Smith  ',
    });
    expect(result.first_name).toBe('Jane');
    expect(result.last_name).toBe('Smith');
  });

  it('rejects empty first_name', () => {
    expect(() => UpdateMyProfileSchema.parse({ first_name: '   ', last_name: 'Smith' })).toThrow();
  });

  it('rejects first_name longer than 100 chars', () => {
    expect(() =>
      UpdateMyProfileSchema.parse({
        first_name: 'a'.repeat(101),
        last_name: 'Smith',
      }),
    ).toThrow();
  });
});
