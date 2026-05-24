import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Centered empty/error state for tables, lists, and search results.
 * Use `tone="error"` when surfacing a fetch failure.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
}) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        isError ? 'border-red-200 bg-red-50/40' : 'border-neutral-200 bg-white',
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            'mb-3 flex h-12 w-12 items-center justify-center rounded-full',
            isError ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500',
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <h3
        className={cn(
          'text-sm font-semibold',
          isError ? 'text-red-900' : 'text-neutral-900',
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
