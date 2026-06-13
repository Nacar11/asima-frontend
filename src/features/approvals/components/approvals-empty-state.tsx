import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';

export function ApprovalsEmptyState({ canSeeAll = false }: { canSeeAll?: boolean }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No pending approvals"
      description={
        canSeeAll
          ? 'There are no requests waiting for approval across the organization right now.'
          : 'No requests need your approval right now. New items will appear here when an employee submits a request that lands on your step.'
      }
    />
  );
}
