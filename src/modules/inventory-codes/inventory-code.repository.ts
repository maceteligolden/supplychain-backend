import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';
import type { InventoryCodePrefix } from '@/shared/constants';
import {
  formatInventoryCode,
  getInventoryCodeYear,
} from '@/shared/utils/inventory-code.util';

/**
 * InventoryCodeRepository allocates atomic PREFIX-YYYY-NNNN codes.
 */
@injectable()
export class InventoryCodeRepository {
  /**
   * Allocates the next code for an entity prefix in the current UTC year.
   * Uses a transactional upsert so concurrent creates cannot share a sequence.
   */
  async allocateNextCode(prefix: InventoryCodePrefix, year?: number): Promise<string> {
    const codeYear = year ?? getInventoryCodeYear();

    const sequence = await prismaClient.$transaction(async (tx) => {
      const existing = await tx.codeSequence.findUnique({
        where: {
          prefix_year: {
            prefix,
            year: codeYear,
          },
        },
      });

      if (!existing) {
        const created = await tx.codeSequence.create({
          data: {
            prefix,
            year: codeYear,
            lastValue: 1,
          },
        });
        return created.lastValue;
      }

      const updated = await tx.codeSequence.update({
        where: { id: existing.id },
        data: { lastValue: { increment: 1 } },
      });

      return updated.lastValue;
    });

    return formatInventoryCode({
      prefix,
      year: codeYear,
      sequence,
    });
  }
}
