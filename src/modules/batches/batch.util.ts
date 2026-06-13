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

/**
 * Generates the next batch number for a farm and harvest year.
 * Pattern: BATCH_{FARM_CODE}_{YYYY}_{seq}
 */
export const generateBatchNumber = (input: {
  farmCode: string;
  harvestDate: string;
  existingBatchNumbers: string[];
}): string => {
  const year = input.harvestDate.slice(0, 4);
  const prefix = `BATCH_${input.farmCode}_${year}_`;
  const sameFarmYear = input.existingBatchNumbers.filter(
    (batchNumber) =>
      batchNumber.startsWith(prefix) && batchNumber.includes(`_${year}_`),
  );
  const nextSequence = sameFarmYear.length + 1;
  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
};
