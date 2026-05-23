import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `clsx` for conditional class lists, then `twMerge` to deduplicate
 * conflicting Tailwind classes (`p-2 p-4` → `p-4`). One canonical helper
 * used by every component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
