/** Allowed batch allocation statuses. */
export const BATCH_STATUSES = [
  'CREATED',
  'PARTIALLY_ALLOCATED',
  'FULLY_ALLOCATED',
] as const;

export type BatchStatus = (typeof BATCH_STATUSES)[number];

/** Regex for uppercase batch numbers. */
export const BATCH_NUMBER_PATTERN = /^[A-Z0-9_]+$/;
