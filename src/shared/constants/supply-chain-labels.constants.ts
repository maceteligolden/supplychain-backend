import {
  SUPPLY_CHAIN_EVENT_TYPES,
  type SupplyChainEventType,
  type SupplyChainStatus,
} from '@/shared/constants';

/** Assessment risk levels used by farm deforestation assessments. */
export const ASSESSMENT_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type AssessmentRiskLevel = (typeof ASSESSMENT_RISK_LEVELS)[number];

export const ASSESSMENT_RISK_LABELS: Record<AssessmentRiskLevel, string> = {
  LOW: 'Low risk',
  MEDIUM: 'Medium risk',
  HIGH: 'High risk',
};

export type SupplyChainOverallRiskLevel =
  | AssessmentRiskLevel
  | 'UNASSESSED'
  | 'NO_FARMS';

export const SUPPLY_CHAIN_OVERALL_RISK_LABELS: Record<
  SupplyChainOverallRiskLevel,
  string
> = {
  LOW: ASSESSMENT_RISK_LABELS.LOW,
  MEDIUM: ASSESSMENT_RISK_LABELS.MEDIUM,
  HIGH: ASSESSMENT_RISK_LABELS.HIGH,
  UNASSESSED: 'Unassessed',
  NO_FARMS: 'No farms linked',
};

export const SUPPLY_CHAIN_STATUS_LABELS: Record<SupplyChainStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const SUPPLY_CHAIN_EVENT_TYPE_LABELS: Record<SupplyChainEventType, string> = {
  HARVEST: 'Harvested at farm',
  COLLECTION: 'Collected / aggregated',
  PROCESSING: 'Processed',
  WAREHOUSING: 'Stored / warehoused',
  EXPORT: 'Exported',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
};

const RISK_ORDER: Record<AssessmentRiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

/** Returns the higher-severity assessment risk level. */
export const maxAssessmentRiskLevel = (
  levels: AssessmentRiskLevel[],
): AssessmentRiskLevel | null => {
  if (levels.length === 0) {
    return null;
  }

  return levels.reduce((current, level) =>
    RISK_ORDER[level] > RISK_ORDER[current] ? level : current,
  );
};

type ActorAddressFields = {
  addressLine1: string | null;
  addressCity: string;
  addressRegion: string;
  addressCountry: string;
};

/** Formats an actor address for display in lists and event timelines. */
export const formatActorAddress = (actor: ActorAddressFields): string => {
  const parts = [
    actor.addressLine1,
    actor.addressCity,
    actor.addressRegion,
    actor.addressCountry,
  ].filter(Boolean);

  return parts.join(', ');
};

/** Re-export event type order helper for consumers that need lifecycle sorting. */
export { SUPPLY_CHAIN_EVENT_TYPES };
