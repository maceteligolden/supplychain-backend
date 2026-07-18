import { BatchStatus } from '@/shared/constants';

/**
 * Derives batch allocation status from total allocated quantity vs batch quantity.
 */
export const deriveBatchStatus = (
  quantity: number,
  allocatedTotal: number,
): BatchStatus => {
  if (allocatedTotal <= 0) {
    return 'CREATED';
  }

  if (allocatedTotal >= quantity) {
    return 'FULLY_ALLOCATED';
  }

  return 'PARTIALLY_ALLOCATED';
};
