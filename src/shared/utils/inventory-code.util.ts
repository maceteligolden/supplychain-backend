import type { InventoryCodePrefix } from '@/shared/constants';

/**
 * Formats an inventory code as PREFIX-YYYY-NNNN.
 */
export const formatInventoryCode = (input: {
  prefix: InventoryCodePrefix;
  year: number;
  sequence: number;
}): string => {
  const padded = String(input.sequence).padStart(4, '0');
  return `${input.prefix}-${input.year}-${padded}`;
};

/**
 * Returns the calendar year used for inventory code allocation.
 */
export const getInventoryCodeYear = (date: Date = new Date()): number =>
  date.getUTCFullYear();
