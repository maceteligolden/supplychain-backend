import { describe, expect, it } from 'vitest';

import { deriveBatchStatus } from '@/modules/batches/batch.util';

describe('deriveBatchStatus', () => {
  it('returns CREATED when nothing is allocated', () => {
    expect(deriveBatchStatus(100, 0)).toBe('CREATED');
  });

  it('returns PARTIALLY_ALLOCATED when some quantity remains', () => {
    expect(deriveBatchStatus(100, 40)).toBe('PARTIALLY_ALLOCATED');
  });

  it('returns FULLY_ALLOCATED when allocated reaches quantity', () => {
    expect(deriveBatchStatus(100, 100)).toBe('FULLY_ALLOCATED');
  });
});
