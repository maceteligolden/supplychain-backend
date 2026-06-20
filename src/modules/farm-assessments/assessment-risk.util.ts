import type { AssessmentRiskLevel } from '@/shared/constants';

export type AssessmentAnalysisMetrics = {
  deforestationPercent: number;
  afforestationPercent: number;
  stabilityPercent: number;
  forestCoverPercent: number;
  protectedAreaOverlapPercent: number;
  protectedAreaDetected: boolean;
  whispRiskPcrop?: string | null;
};

const WHISP_HIGH_RISK = new Set(['high', 'yes']);
const WHISP_MEDIUM_RISK = new Set(['medium', 'moderate']);

function normalizeWhispRisk(
  value: string | null | undefined,
): AssessmentRiskLevel | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (WHISP_HIGH_RISK.has(normalized)) {
    return 'HIGH';
  }

  if (WHISP_MEDIUM_RISK.has(normalized)) {
    return 'MEDIUM';
  }

  if (normalized === 'low' || normalized === 'no') {
    return 'LOW';
  }

  return null;
}

/** Derives risk level from deforestation metrics and optional WHISP cocoa risk. */
export function deriveRiskLevel(
  analysis: AssessmentAnalysisMetrics,
): AssessmentRiskLevel {
  const whispRisk = normalizeWhispRisk(analysis.whispRiskPcrop);

  if (analysis.deforestationPercent >= 35 || whispRisk === 'HIGH') {
    return 'HIGH';
  }

  if (analysis.deforestationPercent >= 12 || whispRisk === 'MEDIUM') {
    return 'MEDIUM';
  }

  return 'LOW';
}

/** Computes stability percent from loss and gain percentages. */
export function deriveStabilityPercent(
  deforestationPercent: number,
  afforestationPercent: number,
): number {
  return Math.max(0, 100 - deforestationPercent - afforestationPercent);
}
