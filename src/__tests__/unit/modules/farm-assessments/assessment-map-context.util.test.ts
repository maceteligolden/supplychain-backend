import { describe, expect, it } from 'vitest';

import { buildAssessmentMapContext } from '@/modules/farm-assessments/assessment-map-context.util';
import type { IFarmAssessmentAnalysis } from '@/modules/farm-assessments/farm-assessment.interface';

const analysis: IFarmAssessmentAnalysis = {
  deforestationPercent: 16,
  afforestationPercent: 5,
  stabilityPercent: 79,
  forestCoverPercent: 84,
  protectedAreaOverlapPercent: 7,
  protectedAreaDetected: true,
  whispRiskPcrop: 'Medium',
};

describe('buildAssessmentMapContext', () => {
  it('builds legend percentages and tile layers for a farm boundary', () => {
    const context = buildAssessmentMapContext({
      boundary: [
        { latitude: 6.6885, longitude: -1.6244 },
        { latitude: 6.6895, longitude: -1.6234 },
        { latitude: 6.6875, longitude: -1.6224 },
      ],
      boundaryAreaHectares: 4.91,
      analysis,
      providerMetadata: {
        wdpa: {
          source: 'FALLBACK',
          protectedAreas: { type: 'FeatureCollection', features: [] },
          nearestProtectedArea: { name: 'Simulated protected area', distanceKm: 0.5 },
        },
      },
    });

    expect(context.legend).toHaveLength(4);
    expect(context.legend[0]?.category).toBe('Tree cover loss');
    expect(context.legend[0]?.percent).toBe(16);
    expect(context.legend[3]?.category).toBe('Non-forest');
    expect(context.tileLayers).toHaveLength(3);
    expect(context.tileLayers.map((layer) => layer.id)).toEqual([
      'tree_cover_density',
      'tree_cover_loss',
      'tree_cover_gain',
    ]);
    expect(context.whispRiskPcrop).toBe('Medium');
    expect(context.bbox).toHaveLength(4);
    expect(context.plots).toHaveLength(1);
  });
});
