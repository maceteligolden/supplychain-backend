/** Allowed actor roles in the supply chain. */
export const ACTOR_TYPES = [
  'COLLECTION_CENTRE',
  'PROCESSOR',
  'WAREHOUSE',
  'EXPORTER',
  'CARRIER',
] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];

/** Allowed actor lifecycle statuses. */
export const ACTOR_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type ActorStatus = (typeof ACTOR_STATUSES)[number];

/** Regex for uppercase actor codes (letters, digits, underscores). */
export const ACTOR_CODE_PATTERN = /^[A-Z0-9_]+$/;
