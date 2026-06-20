import { describe, expect, it } from 'vitest';

import { deriveRiskLevel } from '@/modules/farm-assessments/assessment-risk.util';

const baseMetrics = {
  deforestationPercent: 4,
  afforestationPercent: 2,
  stabilityPercent: 94,
  forestCoverPercent: 96,
  protectedAreaOverlapPercent: 0,
  protectedAreaDetected: false,
};

describe('deriveRiskLevel', () => {
  it('returns HIGH when deforestation is at least 35%', () => {
    expect(
      deriveRiskLevel({
        ...baseMetrics,
        deforestationPercent: 35,
        forestCoverPercent: 65,
      }),
    ).toBe('HIGH');
  });

  it('returns HIGH when WHISP cocoa risk is high', () => {
    expect(
      deriveRiskLevel({
        ...baseMetrics,
        whispRiskPcrop: 'High',
      }),
    ).toBe('HIGH');
  });

  it('returns MEDIUM when deforestation is at least 12%', () => {
    expect(
      deriveRiskLevel({
        ...baseMetrics,
        deforestationPercent: 12,
        forestCoverPercent: 88,
      }),
    ).toBe('MEDIUM');
  });

  it('returns MEDIUM when WHISP cocoa risk is medium', () => {
    expect(
      deriveRiskLevel({
        ...baseMetrics,
        whispRiskPcrop: 'Medium',
      }),
    ).toBe('MEDIUM');
  });

  it('returns LOW for minimal deforestation without WHISP risk', () => {
    expect(deriveRiskLevel(baseMetrics)).toBe('LOW');
  });
});
