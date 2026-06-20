import { describe, expect, it } from 'vitest';

import { validateEventSequence } from '@/modules/supply-chain-events/supply-chain-event.util';

describe('validateEventSequence', () => {
  it('allows first event type on empty chain', () => {
    const result = validateEventSequence([], 'HARVEST');
    expect(result.valid).toBe(true);
  });

  it('rejects duplicate event types', () => {
    const result = validateEventSequence([{ type: 'HARVEST' }], 'HARVEST');
    expect(result.valid).toBe(false);
  });

  it('rejects backwards lifecycle steps', () => {
    const result = validateEventSequence([{ type: 'COLLECTION' }], 'HARVEST');
    expect(result.valid).toBe(false);
  });

  it('allows forward skips', () => {
    const result = validateEventSequence([{ type: 'HARVEST' }], 'PROCESSING');
    expect(result.valid).toBe(true);
  });
});
