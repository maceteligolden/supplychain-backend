import { describe, expect, it } from 'vitest';

import { parseWhispProperties } from '@/shared/integrations/whisp.client';

describe('parseWhispProperties', () => {
  it('extracts cocoa risk and change percentages from WHISP properties', () => {
    const parsed = parseWhispProperties({
      Risk_PCrop: 'High',
      GFC_loss_after_2020_pct: 12,
      umd_tree_cover_gain_pct: 4,
    });

    expect(parsed.whispRiskPcrop).toBe('High');
    expect(parsed.lossPercent).toBe(12);
    expect(parsed.afforestationPercent).toBe(4);
  });

  it('matches property keys case-insensitively', () => {
    const parsed = parseWhispProperties({
      risk_pcrop: 'Medium',
    });

    expect(parsed.whispRiskPcrop).toBe('Medium');
  });
});
