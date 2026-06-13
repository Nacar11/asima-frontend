'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { leaveApi } from '@/features/leave/api';

/**
 * Renders a leave request's attachment. For images it shows a thumbnail that
 * opens the full original in a new tab; for PDFs (where the thumbnail
 * rendition 404s) it falls back to a download link. The bytes are fetched
 * with the caller's bearer token via the api-client — never an unauthenticated
 * `<img src>` — and object URLs are revoked to avoid leaks.
 */
export function LeaveAttachment({ requestId }: { requestId: number }) {
  const thumb = useQuery({
    queryKey: ['leave', 'attachment', requestId, 'thumbnail'],
    queryFn: async () => {
      const blob = await leaveApi.downloadAttachment(requestId, 'thumbnail');
      return URL.createObjectURL(blob);
    },
    retry: false,
  });

  // Revoke the thumbnail object URL when it changes or the component unmounts.
  useEffect(() => {
    const url = thumb.data;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [thumb.data]);

  const openOriginal = async () => {
    const blob = await leaveApi.downloadAttachment(requestId, 'original');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    // Give the new tab time to load before releasing the URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (thumb.isPending) {
    return <span className="text-sm text-neutral-500">Loading attachment…</span>;
  }

  if (thumb.data) {
    return (
      <button
        type="button"
        onClick={openOriginal}
        className={thumbBtn}
        aria-label="View attachment"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob: object URL, not a remote asset */}
        <img src={thumb.data} alt="Attachment preview" className="h-20 w-20 rounded object-cover" />
        <span className="text-xs font-medium text-neutral-600">View full image</span>
      </button>
    );
  }

  // PDF (no thumbnail rendition) or a transient image error → download link.
  return (
    <button type="button" onClick={openOriginal} className={linkBtn}>
      Download attachment
    </button>
  );
}

const thumbBtn = cn(
  'inline-flex items-center gap-3 rounded-md border border-neutral-200 p-2 text-left',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300',
);

const linkBtn = cn(
  'inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300',
);
