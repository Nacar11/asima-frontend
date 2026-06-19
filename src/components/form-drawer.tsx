import type { FormEventHandler, ReactNode } from 'react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

type FormDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Links the footer submit button to the body `<form>`. */
  formId: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  /** Shown on the submit button while `submitting`. */
  pendingLabel: string;
  submitting: boolean;
  /** Disable submit (defaults to `submitting`). */
  submitDisabled?: boolean;
  /** Extra classes on the SheetContent (e.g. a narrower drawer). */
  contentClassName?: string;
  /** Form fields. */
  children: ReactNode;
};

/**
 * Right-side Sheet shell for a single-submit form drawer: header
 * (title/description), a `space-y-4` body form, and a Cancel/Submit footer.
 * The submit button lives in the footer and links to the body form via
 * `formId`. Use only for drawers that fit this exact shape — drawers with
 * bespoke footers (multi-action detail drawers, the grant drawer's inline
 * submit, apply-leave's form-wraps-footer layout) keep their own markup.
 */
export function FormDrawer({
  open,
  onClose,
  title,
  description,
  formId,
  onSubmit,
  submitLabel,
  pendingLabel,
  submitting,
  submitDisabled,
  contentClassName,
  children,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className={contentClassName}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description != null && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <SheetBody>
          <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
            {children}
          </form>
        </SheetBody>

        <SheetFooter>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitDisabled ?? submitting}
            className={btnPrimary}
          >
            {submitting ? pendingLabel : submitLabel}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const btnPrimary = cn(
  'rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm',
  'hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const btnSecondary = cn(
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700',
  'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900',
);
