/** Allowed commodity measurement units. */
export const COMMODITY_UNITS = ['KG', 'TON', 'LITRE', 'BAG', 'UNIT'] as const;

export type CommodityUnit = (typeof COMMODITY_UNITS)[number];

/** Regex for uppercase commodity codes (letters, digits, underscores). */
export const COMMODITY_CODE_PATTERN = /^[A-Z0-9_]+$/;
