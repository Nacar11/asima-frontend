import { cn } from '@/lib/cn';
import { TC_STATUS_META } from '../format';
import type { TcStatus } from '../schemas';

export function TcStatusBadge({ status }: { status: TcStatus }) {
  const meta = TC_STATUS_META[status];
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', meta.className)}>
      {meta.label}
    </span>
  );
}
