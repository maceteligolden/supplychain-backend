import {
  SUPPLY_CHAIN_EVENT_TYPES,
  SupplyChainEventType,
  getSupplyChainEventTypeOrder,
} from '@/shared/constants';

export type ValidateEventSequenceResult =
  | { valid: true }
  | { valid: false; message: string };

type ExistingEvent = {
  type: SupplyChainEventType;
};

/** Validates forward-only event ordering with no duplicate types. */
export const validateEventSequence = (
  existingEvents: ExistingEvent[],
  nextType: SupplyChainEventType,
): ValidateEventSequenceResult => {
  if (existingEvents.some((event) => event.type === nextType)) {
    return {
      valid: false,
      message: `An event of type ${nextType} already exists for this supply chain`,
    };
  }

  const nextOrder = getSupplyChainEventTypeOrder(nextType);
  if (nextOrder === -1) {
    return { valid: false, message: 'Invalid event type' };
  }

  const maxExistingOrder = existingEvents.reduce((max, event) => {
    const order = getSupplyChainEventTypeOrder(event.type);
    return order > max ? order : max;
  }, -1);

  if (nextOrder <= maxExistingOrder) {
    return {
      valid: false,
      message: `Event type ${nextType} cannot be added after later lifecycle steps`,
    };
  }

  return { valid: true };
};

export { SUPPLY_CHAIN_EVENT_TYPES };
