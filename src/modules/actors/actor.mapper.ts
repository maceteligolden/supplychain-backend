import {
  IActorAddressOutput,
  IActorAddressRecord,
  IActorOutput,
  IActorRecord,
} from './actor.interface';

/**
 * Maps flat address columns to a nested address DTO.
 */
export const mapAddressToOutput = (record: IActorRecord): IActorAddressOutput => ({
  line1: record.addressLine1 ?? undefined,
  city: record.addressCity,
  region: record.addressRegion,
  country: record.addressCountry,
});

/**
 * Maps a nested address DTO to flat columns for persistence.
 */
export const mapAddressToRecord = (
  address: IActorAddressOutput,
): IActorAddressRecord => ({
  addressLine1: address.line1?.trim() || null,
  addressCity: address.city.trim(),
  addressRegion: address.region.trim(),
  addressCountry: address.country.trim(),
});

/**
 * Maps a PostgreSQL actor record to a public API DTO.
 */
export const mapActorToOutput = (record: IActorRecord): IActorOutput => ({
  id: record.id,
  name: record.name,
  code: record.code,
  type: record.type,
  address: mapAddressToOutput(record),
  status: record.status,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
