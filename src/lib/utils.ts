import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format completion count for display (10+, 100+, 1k+, 10k+, etc.)
 */
export function formatCompletionCount(count: number): string {
  if (count === 0) return '0';
  if (count < 10) return `${count}`;
  if (count < 100) return '10+';
  if (count < 1000) return '100+';
  if (count < 10000) return '1k+';
  if (count < 100000) return '10k+';
  if (count < 1000000) return '100k+';
  return '1M+';
}
