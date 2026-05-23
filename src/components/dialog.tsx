'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Thin wrapper around the native HTML <dialog> element. The browser
 * handles modal semantics, focus trap, Escape-to-close, and backdrop
 * for us — no library needed.
 *
 * Usage:
 *   <Dialog open={open} onClose={() => setOpen(false)} title="…">
 *     <form>…</form>
 *   </Dialog>
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  widthClass,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Override max width (default `max-w-md`). */
  widthClass?: string;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  // Sync external `open` with the dialog element's imperative API.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Closing via Escape fires a 'close' event — relay to onClose so React
  // state stays in sync with the DOM.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = () => onClose();
    el.addEventListener('close', handle);
    return () => el.removeEventListener('close', handle);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        // Click on the backdrop (the dialog itself, not its content) → close.
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'rounded-lg border border-neutral-200 p-0 shadow-xl backdrop:bg-black/40',
        'w-full',
        widthClass ?? 'max-w-md',
      )}
    >
      <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
