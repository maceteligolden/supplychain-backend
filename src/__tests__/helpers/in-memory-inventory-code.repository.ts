import { InventoryCodeRepository } from '@/modules/inventory-codes';
import type { InventoryCodePrefix } from '@/shared/constants';
import {
  formatInventoryCode,
  getInventoryCodeYear,
} from '@/shared/utils/inventory-code.util';

/**
 * In-memory inventory code allocator for integration tests.
 */
export class InMemoryInventoryCodeRepository extends InventoryCodeRepository {
  private sequences = new Map<string, number>();

  override allocateNextCode(
    prefix: InventoryCodePrefix,
    year?: number,
  ): Promise<string> {
    const codeYear = year ?? getInventoryCodeYear();
    const key = `${prefix}:${codeYear}`;
    const next = (this.sequences.get(key) ?? 0) + 1;
    this.sequences.set(key, next);

    return Promise.resolve(
      formatInventoryCode({
        prefix,
        year: codeYear,
        sequence: next,
      }),
    );
  }
}
