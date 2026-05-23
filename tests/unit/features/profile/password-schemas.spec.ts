import { describe, it, expect } from 'vitest';
import { ChangeMyPasswordInputSchema } from '@/features/profile/password-schemas';

const valid = {
  current_password: 'OldP@ssw0rd!',
  new_password: 'NewP@ssw0rd!',
  confirm_password: 'NewP@ssw0rd!',
};

describe('ChangeMyPasswordInputSchema', () => {
  it('accepts a complex password matching the backend regex', () => {
    expect(() => ChangeMyPasswordInputSchema.parse(valid)).not.toThrow();
  });

  it.each([
    ['Short1!', 'too short'],
    ['nouppercase1!', 'no uppercase'],
    ['NOLOWERCASE1!', 'no lowercase'],
    ['NoDigitsHere!', 'no digit'],
    ['NoSymbolsHere1', 'no symbol'],
  ])('rejects "%s" — %s', (pw) => {
    expect(() =>
      ChangeMyPasswordInputSchema.parse({
        ...valid,
        new_password: pw,
        confirm_password: pw,
      }),
    ).toThrow();
  });

  it('rejects when confirm_password does not match new_password', () => {
    expect(() =>
      ChangeMyPasswordInputSchema.parse({
        ...valid,
        confirm_password: 'DifferentP@ss1!',
      }),
    ).toThrow(/match/i);
  });

  it('rejects when new_password equals current_password', () => {
    expect(() =>
      ChangeMyPasswordInputSchema.parse({
        current_password: 'SameP@ss1!',
        new_password: 'SameP@ss1!',
        confirm_password: 'SameP@ss1!',
      }),
    ).toThrow(/differ/i);
  });
});
