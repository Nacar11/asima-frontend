import { cn } from '@/lib/cn';

type PaginationProps = {
  /** 1-based current page. */
  page: number;
  /** From the list response — disables Next when false. */
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** When both `total` and `limit` are given, render a "Showing X–Y of Z" summary. */
  total?: number;
  limit?: number;
};

/**
 * Shared prev/next pager for the `{ data, total, has_more }` list contract.
 * Pass `total` + `limit` to show the range summary (list pages); omit them for
 * the bare button pair. The caller decides whether to render it at all
 * (typically `total > limit`).
 */
export function Pagination({ page, hasMore, onPrev, onNext, total, limit }: PaginationProps) {
  const summary =
    total != null && limit != null
      ? `Showing ${(page - 1) * limit + 1}–${Math.min(total, page * limit)} of ${total}`
      : null;

  return (
    <div className="flex items-center justify-between text-xs text-neutral-500">
      {summary ? <span>{summary}</span> : <span />}
      <div className="flex gap-2">
        <PagerButton onClick={onPrev} disabled={page === 1}>
          Previous
        </PagerButton>
        <PagerButton onClick={onNext} disabled={!hasMore}>
          Next
        </PagerButton>
      </div>
    </div>
  );
}

const PagerButton = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700',
      'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50',
    )}
    {...rest}
  >
    {children}
  </button>
);
