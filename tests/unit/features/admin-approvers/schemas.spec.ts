import { describe, expect, it } from 'vitest';
import {
  EmployeeChainViewSchema,
  EmployeeChainListSchema,
  ActiveChainRowsSchema,
  ActiveChainSchema,
  BulkReassignResultSchema,
  BulkAssignSchema,
  BulkAssignResultSchema,
  ApproverIdsSchema,
  SetChainSchema,
} from '@/features/admin-approvers/schemas';

describe('admin-approvers schemas', () => {
  it('parses a fully-populated employee chain row', () => {
    const row = EmployeeChainViewSchema.parse({
      employee_id: 12,
      employee_name: 'Ada Lovelace',
      employee_email: 'ada@asima.test',
      l1_approver_id: 5,
      l1_approver_name: 'Grace Hopper',
      l2_approver_id: 7,
      l2_approver_name: 'Alan Turing',
      updated_at: '2026-05-30T10:00:00.000Z',
    });
    expect(row.l1_approver_name).toBe('Grace Hopper');
  });

  it('allows null approvers and null updated_at (employee with no chain)', () => {
    const row = EmployeeChainViewSchema.parse({
      employee_id: 99,
      employee_name: 'No Chain',
      employee_email: 'none@asima.test',
      l1_approver_id: null,
      l1_approver_name: null,
      l2_approver_id: null,
      l2_approver_name: null,
      updated_at: null,
    });
    expect(row.l1_approver_id).toBeNull();
  });

  it('parses the paginated list envelope', () => {
    const list = EmployeeChainListSchema.parse({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false,
    });
    expect(list.total).toBe(0);
  });

  it('parses getActiveRows response with chain rows and nulls', () => {
    const res = ActiveChainRowsSchema.parse({
      employee_id: 12,
      l1: {
        id: 1,
        employee_id: 12,
        step: 1,
        approver_id: 5,
        effective_at: '2026-05-30T10:00:00.000Z',
        ended_at: null,
        created_by: 1,
        updated_by: null,
        created_at: '2026-05-30T10:00:00.000Z',
        updated_at: '2026-05-30T10:00:00.000Z',
      },
      l2: null,
    });
    expect(res.l1?.approver_id).toBe(5);
    expect(res.l2).toBeNull();
  });

  it('parses the flat active-chain lookup', () => {
    const active = ActiveChainSchema.parse({ l1_approver_id: 5, l2_approver_id: null });
    expect(active.l2_approver_id).toBeNull();
  });

  it('parses the bulk-reassign result', () => {
    const result = BulkReassignResultSchema.parse({ reassigned: 3, skipped: [8] });
    expect(result.reassigned).toBe(3);
    expect(result.skipped).toEqual([8]);
  });

  it('SetChainSchema accepts tri-state: a number, null, or omitted', () => {
    expect(SetChainSchema.parse({ l1_approver_id: 5 }).l1_approver_id).toBe(5);
    expect(SetChainSchema.parse({ l1_approver_id: null }).l1_approver_id).toBeNull();
    expect(SetChainSchema.parse({})).toEqual({});
  });

  it('BulkAssignSchema requires L1 and at least one employee; L2 optional', () => {
    const ok = BulkAssignSchema.parse({ employee_ids: [12, 13], l1_approver_id: 5 });
    expect(ok.employee_ids).toEqual([12, 13]);
    expect(ok.l2_approver_id).toBeUndefined();
    expect(() => BulkAssignSchema.parse({ employee_ids: [], l1_approver_id: 5 })).toThrow();
    expect(() => BulkAssignSchema.parse({ employee_ids: [12] })).toThrow();
  });

  it('BulkAssignResultSchema parses assigned + skipped reasons', () => {
    const result = BulkAssignResultSchema.parse({
      assigned: 2,
      skipped: [{ employee_id: 5, reason: 'self_approval' }],
    });
    expect(result.assigned).toBe(2);
    expect(result.skipped[0]?.reason).toBe('self_approval');
  });

  it('ApproverIdsSchema parses the lean id envelope', () => {
    const res = ApproverIdsSchema.parse({ employee_ids: [1, 2, 3] });
    expect(res.employee_ids).toEqual([1, 2, 3]);
  });
});
