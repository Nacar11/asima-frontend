import { describe, it, expect } from 'vitest';
import {
  WorkScheduleSchema,
  dayName,
  formatBreak,
  trimSeconds,
} from '@/features/schedule/schemas';

describe('WorkScheduleSchema', () => {
  it('parses a typical Mon..Fri 9–6 row', () => {
    const row = WorkScheduleSchema.parse({
      id: 1,
      employee_id: 12,
      day_of_week: 1,
      expected_in: '09:00:00',
      expected_out: '18:00:00',
      break_minutes: 60,
      break_start: '12:00:00',
      effective_from: '2026-01-01',
      effective_to: null,
      created_by: 1,
      updated_by: 1,
      deleted_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      deleted_at: null,
    });
    expect(row.day_of_week).toBe(1);
  });

  it('rejects day_of_week outside 0..6', () => {
    expect(() =>
      WorkScheduleSchema.parse({
        id: 1,
        employee_id: 1,
        day_of_week: 7,
        expected_in: '09:00:00',
        expected_out: '18:00:00',
        break_minutes: 60,
        effective_from: '2026-01-01',
        effective_to: null,
        created_by: null,
        updated_by: null,
        deleted_by: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        deleted_at: null,
      }),
    ).toThrow();
  });
});

describe('dayName', () => {
  it('maps 0..6 to Sunday..Saturday', () => {
    expect(dayName(0)).toBe('Sunday');
    expect(dayName(1)).toBe('Monday');
    expect(dayName(6)).toBe('Saturday');
  });

  it('falls back gracefully for out-of-range input', () => {
    expect(dayName(99)).toBe('Day 99');
  });
});

describe('trimSeconds', () => {
  it('strips seconds from a Postgres TIME string', () => {
    expect(trimSeconds('09:00:00')).toBe('09:00');
    expect(trimSeconds('18:30:00')).toBe('18:30');
  });

  it('returns short strings untouched', () => {
    expect(trimSeconds('09:00')).toBe('09:00');
    expect(trimSeconds('')).toBe('');
  });
});

describe('formatBreak', () => {
  it('combines start, derived end, and duration', () => {
    expect(formatBreak('12:00:00', 60)).toBe('12:00–13:00 (60 min)');
    expect(formatBreak('13:30:00', 45)).toBe('13:30–14:15 (45 min)');
  });

  it('shows a dash when there is no break', () => {
    expect(formatBreak(null, 0)).toBe('—');
    expect(formatBreak('12:00:00', 0)).toBe('—');
  });
});
