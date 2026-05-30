'use client';

import * as React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/cn';

/**
 * Form-bound checkbox + label, wired into React Hook Form via `Controller`.
 *
 * This is the canonical reusable for any "boolean toggle inline with a
 * label" field in the app (Active, Send invite email, Send notifications,
 * Remember me, …). It composes our owned shadcn primitive at
 * `@/components/ui/checkbox` — do not import that primitive directly
 * inside a form unless you genuinely need something this wrapper
 * does not provide.
 *
 * Why a Layer-3 wrapper:
 *  - RHF's `register()` does not work with Radix's `onCheckedChange`
 *    contract (Radix emits `true | false | 'indeterminate'`; RHF wants
 *    `boolean`). The wrapper normalizes via `field.onChange(v === true)`.
 *  - Label click toggles the checkbox via shared `htmlFor`/`id` — no
 *    extra prop wiring at the call site.
 *  - Optional helper `description` is wired to the checkbox through
 *    `aria-describedby` for screen readers.
 *
 * Indeterminate state is intentionally NOT exposed — none of today's
 * use cases need it, and a form value of `'indeterminate'` is a footgun.
 * Re-introduce as an opt-in prop when a real use case appears.
 */

type LabeledCheckboxProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Optional stable id; defaults to a generated one via `React.useId`. */
  id?: string;
  /** Wrapper-level className (applied to the outermost <div>). */
  className?: string;
};

export function LabeledCheckbox<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  id: idProp,
  className,
}: LabeledCheckboxProps<TFieldValues>) {
  const reactId = React.useId();
  const id = idProp ?? `cb-${reactId}`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn('flex items-start gap-2', className)}>
          <Checkbox
            id={id}
            ref={field.ref}
            checked={field.value === true}
            onCheckedChange={(next) => field.onChange(next === true)}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-describedby={descriptionId}
            // Pull the box down a hair so it baselines against the label
            // text on the first line of multi-line descriptions.
            className="mt-0.5"
          />
          <div className="flex flex-col">
            <label
              htmlFor={id}
              className={cn(
                'select-none text-sm leading-5 text-neutral-800',
                disabled && 'cursor-not-allowed opacity-60',
                !disabled && 'cursor-pointer',
              )}
            >
              {label}
            </label>
            {description && (
              // Sibling of <label>, not nested inside it — keeps the
              // accessible name concise ("Active") and exposes the
              // helper text via aria-describedby on the checkbox.
              <p id={descriptionId} className="mt-0.5 text-xs text-neutral-500">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}
