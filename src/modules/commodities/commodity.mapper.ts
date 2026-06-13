import { ICommodityOutput, ICommodityRecord } from './commodity.interface';

/**
 * Maps a PostgreSQL commodity record to a public API DTO.
 */
export const mapCommodityToOutput = (record: ICommodityRecord): ICommodityOutput => ({
  id: record.id,
  name: record.name,
  code: record.code,
  imageUrl: record.imageUrl,
  unit: record.unit,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
