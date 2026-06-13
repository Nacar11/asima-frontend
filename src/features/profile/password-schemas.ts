import { z } from 'zod';

/*
 * Mirrors `PASSWORD_COMPLEXITY_REGEX` in asima-backend/src/users/users.constants.ts.
 * The two regexes MUST stay in sync — if either side relaxes the policy
 * without the other, validation errors will only surface from the backend
 * (with a 400) instead of being caught inline.
 *
 * Policy: at least one lowercase, one uppercase, one digit, one symbol.
 * Length: 8..128 enforced via Zod constraints below.
 */
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one symbol.';

export const ChangeMyPasswordInputSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required').max(128),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.current_password !== data.new_password, {
    path: ['new_password'],
    message: 'New password must differ from current password',
  });

export type ChangeMyPasswordInput = z.infer<typeof ChangeMyPasswordInputSchema>;
