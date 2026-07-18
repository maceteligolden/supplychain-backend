/** Inventory entity prefixes for PREFIX-YYYY-NNNN codes. */
export const INVENTORY_CODE_PREFIXES = {
  COMMODITY: 'COM',
  FARM: 'FARM',
  ACTOR: 'ACT',
  SUPPLY_CHAIN: 'SC',
  BATCH: 'BAT',
} as const;

export type InventoryCodePrefix =
  (typeof INVENTORY_CODE_PREFIXES)[keyof typeof INVENTORY_CODE_PREFIXES];

/** Generated inventory codes: PREFIX-YYYY-NNNN. */
export const INVENTORY_CODE_PATTERN = /^[A-Z]+-\d{4}-\d{4}$/;
