import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type FieldProps = {
  /** Label text shown above the control. */
  label: string;
  /** Field-level error; renders red helper text beneath the control when set. */
  error?: string;
  /**
   * When set, the label associates with the control via `htmlFor`/`id`
   * (control passed as `children` must carry the matching `id`). When omitted,
   * the control is wrapped by the `<label>` for implicit association.
   */
  htmlFor?: string;
  /** The form control (input/select/textarea). */
  children: ReactNode;
  /** Extra classes on the outer wrapper. */
  className?: string;
};

/**
 * Shared label + control + error wrapper. Replaces the per-drawer `Field`
 * copies. Two association modes: pass `htmlFor` to bind an external control by
 * id, or omit it to wrap the control in the `<label>` directly.
 */
export function Field({ label, error, htmlFor, children, className }: FieldProps) {
  const labelText = <span className="block text-sm font-medium text-neutral-800">{label}</span>;
  const errorText = error ? (
    <span className="block text-xs text-red-600">{error}</span>
  ) : null;

  if (htmlFor) {
    return (
      <div className={cn('space-y-1.5', className)}>
        <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-800">
          {label}
        </label>
        {children}
        {errorText}
      </div>
    );
  }

  return (
    <label className={cn('block space-y-1.5', className)}>
      {labelText}
      {children}
      {errorText}
    </label>
  );
}
