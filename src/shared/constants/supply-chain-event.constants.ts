/** Ordered supply chain lifecycle event types. */
export const SUPPLY_CHAIN_EVENT_TYPES = [
  'HARVEST',
  'COLLECTION',
  'PROCESSING',
  'WAREHOUSING',
  'EXPORT',
  'IN_TRANSIT',
  'DELIVERED',
] as const;

export type SupplyChainEventType = (typeof SUPPLY_CHAIN_EVENT_TYPES)[number];

/** Returns the sort order index for an event type (0-based). */
export const getSupplyChainEventTypeOrder = (type: SupplyChainEventType): number =>
  SUPPLY_CHAIN_EVENT_TYPES.indexOf(type);
