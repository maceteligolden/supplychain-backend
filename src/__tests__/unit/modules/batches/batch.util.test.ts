import { describe, expect, it } from 'vitest';

import { deriveBatchStatus, generateBatchNumber } from '@/modules/batches/batch.util';

describe('deriveBatchStatus', () => {
  it('returns CREATED when nothing allocated', () => {
    expect(deriveBatchStatus(5000, 0)).toBe('CREATED');
  });

  it('returns PARTIALLY_ALLOCATED when some quantity allocated', () => {
    expect(deriveBatchStatus(5000, 3000)).toBe('PARTIALLY_ALLOCATED');
  });

  it('returns FULLY_ALLOCATED when all quantity allocated', () => {
    expect(deriveBatchStatus(5000, 5000)).toBe('FULLY_ALLOCATED');
  });
});

describe('generateBatchNumber', () => {
  it('generates first sequence for harvest year', () => {
    const batchNumber = generateBatchNumber({
      farmCode: 'ASHANTI_COCOA_FARM',
      harvestDate: '2025-03-15',
      existingBatchNumbers: [],
    });

    expect(batchNumber).toBe('BATCH_ASHANTI_COCOA_FARM_2025_001');
  });

  it('increments sequence when numbers exist for same farm and year', () => {
    const batchNumber = generateBatchNumber({
      farmCode: 'ASHANTI_COCOA_FARM',
      harvestDate: '2025-03-15',
      existingBatchNumbers: ['BATCH_ASHANTI_COCOA_FARM_2025_001'],
    });

    expect(batchNumber).toBe('BATCH_ASHANTI_COCOA_FARM_2025_002');
  });
});
