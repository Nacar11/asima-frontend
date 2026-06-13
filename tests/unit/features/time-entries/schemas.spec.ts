import { describe, it, expect } from 'vitest';
import {
  TimeEntrySchema,
  TimeEntryListSchema,
  durationMinutes,
  formatDuration,
  type TimeEntry,
} from '@/features/time-entries/schemas';

const openEntry: TimeEntry = {
  id: 1,
  employee_id: 12,
  work_date: '2026-05-23',
  time_in: '2026-05-23T01:00:00.000Z',
  time_out: null,
  source: 'manual',
  status: 'open',
  notes: null,
  created_by: 12,
  updated_by: 12,
  deleted_by: null,
  created_at: '2026-05-23T01:00:00.000Z',
  updated_at: '2026-05-23T01:00:00.000Z',
  deleted_at: null,
};

describe('TimeEntrySchema', () => {
  it('parses an open entry', () => {
    expect(() => TimeEntrySchema.parse(openEntry)).not.toThrow();
  });

  it('rejects an unknown source', () => {
    expect(() => TimeEntrySchema.parse({ ...openEntry, source: 'gps' })).toThrow();
  });

  it('rejects an unknown status', () => {
    expect(() => TimeEntrySchema.parse({ ...openEntry, status: 'pending' })).toThrow();
  });
});

describe('TimeEntryListSchema', () => {
  it('parses the paginated envelope', () => {
    const list = TimeEntryListSchema.parse({
      data: [openEntry],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
    expect(list.data).toHaveLength(1);
    expect(list.has_more).toBe(false);
  });
});

describe('durationMinutes', () => {
  it('returns null for open entries', () => {
    expect(durationMinutes(openEntry)).toBeNull();
  });

  it('computes whole-minute duration between in and out', () => {
    const closed: TimeEntry = {
      ...openEntry,
      status: 'confirmed',
      time_in: '2026-05-23T01:00:00.000Z',
      time_out: '2026-05-23T09:00:00.000Z', // 8h
    };
    expect(durationMinutes(closed)).toBe(8 * 60);
  });

  it('floors out-of-order timestamps to 0', () => {
    const broken: TimeEntry = {
      ...openEntry,
      status: 'confirmed',
      time_in: '2026-05-23T10:00:00.000Z',
      time_out: '2026-05-23T09:00:00.000Z',
    };
    expect(durationMinutes(broken)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('renders "—" for null', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('renders minutes-only when under an hour', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('renders hours and zero-padded minutes', () => {
    expect(formatDuration(8 * 60 + 5)).toBe('8h 05m');
  });
});
