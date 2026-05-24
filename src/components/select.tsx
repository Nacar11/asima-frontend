'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

/**
 * Custom listbox-pattern select. Replaces native <select> with a fully
 * keyboard-accessible, themeable dropdown.
 *
 * Keyboard: ArrowDown/Up navigate, Home/End jump, Enter/Space commit,
 * Escape closes, typing performs prefix search (500ms window).
 * A11y: aria-haspopup=listbox, aria-expanded, aria-controls, role=option,
 * aria-selected, aria-activedescendant for SR active item.
 *
 * Empty string is reserved for the "no selection" sentinel.
 */
export function Select<T extends string | number>({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  ariaLabel,
  disabled,
  className,
  size = 'md',
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeAheadRef = useRef<{ str: string; t: number }>({ str: '', t: 0 });
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (v: T) => {
      onValueChange(v);
      close();
    },
    [onValueChange, close],
  );

  // Outside click closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Seed active index when opening
  useEffect(() => {
    if (!open) return;
    const i = options.findIndex((o) => o.value === value);
    setActiveIndex(i === -1 ? options.findIndex((o) => !o.disabled) : i);
  }, [open, options, value]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const moveActive = (delta: 1 | -1) => {
    if (options.length === 0) return;
    let i = activeIndex;
    for (let n = 0; n < options.length; n++) {
      i = (i + delta + options.length) % options.length;
      const candidate = options[i];
      if (candidate && !candidate.disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(options.findIndex((o) => !o.disabled));
        break;
      case 'End':
        e.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          const candidate = options[i];
          if (candidate && !candidate.disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt && !opt.disabled) commit(opt.value);
        break;
      }
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const now = Date.now();
          const ref = typeAheadRef.current;
          if (now - ref.t > 500) ref.str = '';
          ref.str += e.key.toLowerCase();
          ref.t = now;
          const i = options.findIndex(
            (o) => !o.disabled && o.label.toLowerCase().startsWith(ref.str),
          );
          if (i >= 0) setActiveIndex(i);
        }
    }
  };

  const heightCls = size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm';

  return (
    <div className={cn('relative inline-block min-w-[140px]', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-neutral-900 shadow-sm transition-colors',
          heightCls,
          open
            ? 'border-neutral-950 ring-2 ring-neutral-950/10'
            : 'border-neutral-300 hover:border-neutral-400',
          'focus:outline-none focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/20',
          'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60',
        )}
      >
        <span
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 text-left',
            !selected && 'text-neutral-400',
          )}
        >
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={cn(
            'absolute left-0 right-0 z-50 mt-1 max-h-64 min-w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg',
            'focus:outline-none',
          )}
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-500">No options</li>
          )}
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={String(opt.value)}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                data-index={i}
                onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!opt.disabled) commit(opt.value);
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  opt.disabled
                    ? 'cursor-not-allowed text-neutral-400'
                    : isActive
                      ? 'bg-neutral-100 text-neutral-950'
                      : 'text-neutral-800',
                )}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{opt.label}</span>
                  {opt.description && (
                    <span className="truncate text-xs text-neutral-500">
                      {opt.description}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check
                    className="h-4 w-4 shrink-0 text-neutral-950"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
