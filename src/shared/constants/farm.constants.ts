/** Allowed farm lifecycle statuses. */
export const FARM_STATUSES = [
  'DRAFT',
  'MAPPED',
  'READY_FOR_ASSESSMENT',
  'UNDER_REVIEW',
  'ASSESSED',
  'APPROVED',
  'REJECTED',
] as const;

export type FarmStatus = (typeof FARM_STATUSES)[number];

/** Regex for uppercase farm codes. */
export const FARM_CODE_PATTERN = /^[A-Z0-9_]+$/;

/** ISO date pattern YYYY-MM-DD for harvest dates. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
