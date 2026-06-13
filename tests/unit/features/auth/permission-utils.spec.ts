import { describe, expect, it } from 'vitest';
import { hasPermission } from '@/features/auth/permission-utils';

describe('hasPermission', () => {
  describe('system_admin bypass', () => {
    it('returns true when isSystemAdmin is true, regardless of required', () => {
      expect(hasPermission([], 'USER:View', true)).toBe(true);
      expect(hasPermission([], ['USER:View', 'USER:Delete'], true)).toBe(true);
    });

    it('returns true for system_admin even when required is undefined', () => {
      expect(hasPermission([], undefined, true)).toBe(true);
    });
  });

  describe('no requirement', () => {
    it('returns true when required is undefined and not system_admin', () => {
      expect(hasPermission(['USER:View'], undefined, false)).toBe(true);
    });

    it('returns true when required is an empty array', () => {
      expect(hasPermission([], [], false)).toBe(true);
    });
  });

  describe('single required code', () => {
    it('returns true when the code is present', () => {
      expect(hasPermission(['USER:View'], 'USER:View', false)).toBe(true);
    });

    it('returns false when the code is missing', () => {
      expect(hasPermission(['USER:View'], 'USER:Delete', false)).toBe(false);
    });

    it('returns false when permissions array is empty', () => {
      expect(hasPermission([], 'USER:View', false)).toBe(false);
    });
  });

  describe('array required codes (AND-semantics)', () => {
    it('returns true when ALL required codes are present', () => {
      expect(hasPermission(['USER:View', 'USER:Update'], ['USER:View', 'USER:Update'], false)).toBe(
        true,
      );
    });

    it('returns false when ANY required code is missing', () => {
      expect(hasPermission(['USER:View'], ['USER:View', 'USER:Update'], false)).toBe(false);
    });

    it('returns true with a single-element array', () => {
      expect(hasPermission(['USER:View'], ['USER:View'], false)).toBe(true);
    });
  });
});
