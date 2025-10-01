/**
 * cn - Class Name Utility
 * Combines clsx for conditional classes with tailwind-merge for proper Tailwind CSS class merging
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-2 is overridden)
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
