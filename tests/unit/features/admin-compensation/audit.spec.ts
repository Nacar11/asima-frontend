import { describe, expect, it } from 'vitest';
import { CompensationAuditSchema } from '@/features/admin-compensation/schemas';
import { auditActionLabel, describeAuditChange } from '@/features/admin-compensation/audit-format';

const base = {
  id: 1,
  compensation_id: 7,
  employee_id: 12,
  before_monthly_salary: null as number | null,
  after_monthly_salary: null as number | null,
  before_hourly_rate: null as number | null,
  after_hourly_rate: null as number | null,
  before_effective_from: null as string | null,
  after_effective_from: null as string | null,
  actor_id: 1,
  created_at: '2026-06-21T00:00:00.000Z',
};

describe('CompensationAuditSchema', () => {
  it('parses an audit entry from the API', () => {
    const e = CompensationAuditSchema.parse({
      ...base,
      action: 'created',
      after_monthly_salary: 50000,
    });
    expect(e.action).toBe('created');
    expect(e.after_monthly_salary).toBe(50000);
  });

  it('rejects an unknown action', () => {
    expect(() => CompensationAuditSchema.parse({ ...base, action: 'frobnicated' })).toThrow();
  });
});

describe('auditActionLabel', () => {
  it('maps each action to a human label', () => {
    expect(auditActionLabel('created')).toBe('Set');
    expect(auditActionLabel('updated')).toBe('Correction');
    expect(auditActionLabel('deleted')).toBe('Removed');
  });
});

describe('describeAuditChange', () => {
  it('describes a creation as the new salary', () => {
    const s = describeAuditChange(
      { ...base, action: 'created', after_monthly_salary: 50000 },
      'PHP',
    );
    expect(s).toContain('50,000.00');
  });

  it('describes a correction as before → after', () => {
    const s = describeAuditChange(
      { ...base, action: 'updated', before_monthly_salary: 50000, after_monthly_salary: 52000 },
      'PHP',
    );
    expect(s).toContain('50,000.00');
    expect(s).toContain('52,000.00');
    expect(s).toContain('→');
  });

  it('describes a removal with the prior salary', () => {
    const s = describeAuditChange(
      { ...base, action: 'deleted', before_monthly_salary: 50000 },
      'PHP',
    );
    expect(s.toLowerCase()).toContain('removed');
    expect(s).toContain('50,000.00');
  });
});
