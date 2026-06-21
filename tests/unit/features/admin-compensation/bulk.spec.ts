import { describe, expect, it } from 'vitest';
import { BulkCreateCompensationSchema } from '@/features/admin-compensation/schemas';

const item = { employee_id: 12, monthly_salary: 50000, effective_from: '2026-01-01' };

describe('BulkCreateCompensationSchema', () => {
  it('parses a wrapped items array', () => {
    const r = BulkCreateCompensationSchema.parse({ items: [item, { ...item, employee_id: 34 }] });
    expect(r.items).toHaveLength(2);
    expect(r.items[0]?.employee_id).toBe(12);
  });

  it('requires at least one item', () => {
    expect(() => BulkCreateCompensationSchema.parse({ items: [] })).toThrow();
  });
});
