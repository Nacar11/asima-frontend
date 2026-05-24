/**
 * Display-friendly labels for role codes.
 *
 * Codes stay as the backend-canonical SCREAMING_SNAKE form (used by
 * permissions guards, the API, and the DB). Only humans see the labels.
 *
 * Overrides win when present; otherwise we title-case each token and
 * keep known acronyms uppercased.
 */
const OVERRIDES: Record<string, string> = {
  EMPLOYEE: 'Employee',
  HR_ADMIN: 'HR Admin',
  OPERATIONS_MANAGER: 'Operations Manager',
  PROJECT_MANAGER: 'Project Manager',
  SUPER_ADMIN: 'Super Admin',
  TECHNICAL_DIRECTOR: 'Technical Director',
};

const ACRONYMS = new Set([
  'HR', 'IT', 'QA', 'PR', 'CEO', 'CTO', 'CFO', 'COO', 'API', 'UI', 'UX',
]);

export function formatRoleName(code: string): string {
  const override = OVERRIDES[code];
  if (override) return override;
  return code
    .split('_')
    .filter(Boolean)
    .map((tok) =>
      ACRONYMS.has(tok)
        ? tok
        : tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase(),
    )
    .join(' ');
}
