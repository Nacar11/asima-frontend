import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePagination } from '@/lib/use-pagination';

describe('usePagination', () => {
  it('starts at page 1 by default', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.page).toBe(1);
  });

  it('honors an initial page', () => {
    const { result } = renderHook(() => usePagination(3));
    expect(result.current.page).toBe(3);
  });

  it('advances to the next page', () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.toNext());
    expect(result.current.page).toBe(2);
  });

  it('goes back but clamps at page 1', () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.toNext()); // 2
    act(() => result.current.toPrev()); // 1
    expect(result.current.page).toBe(1);
    act(() => result.current.toPrev()); // stays 1
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1', () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.toNext());
    act(() => result.current.toNext());
    expect(result.current.page).toBe(3);
    act(() => result.current.reset());
    expect(result.current.page).toBe(1);
  });
});
