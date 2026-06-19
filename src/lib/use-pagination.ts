'use client';

import { useCallback, useState } from 'react';

/**
 * Page-number state for the `{ data, total, has_more }` list contract. Holds
 * the 1-based page and the prev/next/reset transitions (prev clamps at 1).
 * `has_more` is server-driven, so it stays with the query response and is
 * passed to <Pagination> — this hook owns only the page cursor.
 */
export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const toPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const toNext = useCallback(() => setPage((p) => p + 1), []);
  const reset = useCallback(() => setPage(1), []);

  return { page, setPage, toPrev, toNext, reset };
}
