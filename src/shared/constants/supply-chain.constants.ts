/** Allowed supply chain statuses. */
export const SUPPLY_CHAIN_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type SupplyChainStatus = (typeof SUPPLY_CHAIN_STATUSES)[number];

/** Regex for uppercase supply chain codes. */
export const SUPPLY_CHAIN_CODE_PATTERN = /^[A-Z0-9_]+$/;
