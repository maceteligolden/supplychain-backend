import { describe, expect, it } from 'vitest';

import { INVENTORY_CODE_PREFIXES } from '@/shared/constants';
import {
  formatInventoryCode,
  getInventoryCodeYear,
} from '@/shared/utils/inventory-code.util';

describe('formatInventoryCode', () => {
  it('formats PREFIX-YYYY-NNNN with zero padding', () => {
    expect(
      formatInventoryCode({
        prefix: INVENTORY_CODE_PREFIXES.COMMODITY,
        year: 2026,
        sequence: 1,
      }),
    ).toBe('COM-2026-0001');

    expect(
      formatInventoryCode({
        prefix: INVENTORY_CODE_PREFIXES.FARM,
        year: 2026,
        sequence: 42,
      }),
    ).toBe('FARM-2026-0042');
  });
});

describe('getInventoryCodeYear', () => {
  it('returns the UTC calendar year', () => {
    expect(getInventoryCodeYear(new Date('2026-07-18T00:00:00.000Z'))).toBe(2026);
  });
});
