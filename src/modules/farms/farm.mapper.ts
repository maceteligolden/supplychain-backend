import {
  IFarmLocationOutput,
  IFarmLocationRecord,
  IFarmOutput,
  IFarmOwnerOutput,
  IFarmOwnerRecord,
  IFarmRecord,
} from './farm.interface';

/**
 * Maps flat owner columns to a nested owner DTO.
 */
export const mapOwnerToOutput = (record: IFarmRecord): IFarmOwnerOutput => ({
  firstName: record.ownerFirstName,
  lastName: record.ownerLastName,
  phone: record.ownerPhone,
  email: record.ownerEmail,
});

/**
 * Maps a nested owner DTO to flat columns for persistence.
 */
export const mapOwnerToRecord = (owner: IFarmOwnerOutput): IFarmOwnerRecord => ({
  ownerFirstName: owner.firstName.trim(),
  ownerLastName: owner.lastName.trim(),
  ownerPhone: owner.phone.trim(),
  ownerEmail: owner.email.trim(),
});

/**
 * Maps flat location columns to a nested location DTO.
 */
export const mapLocationToOutput = (record: IFarmRecord): IFarmLocationOutput => ({
  country: record.country,
  region: record.region,
  city: record.city,
  latitude: record.latitude ?? undefined,
  longitude: record.longitude ?? undefined,
});

/**
 * Maps a nested location DTO to flat columns for persistence.
 */
export const mapLocationToRecord = (
  location: IFarmLocationOutput,
): IFarmLocationRecord => ({
  country: location.country.trim(),
  region: location.region.trim(),
  city: location.city.trim(),
  latitude: location.latitude ?? null,
  longitude: location.longitude ?? null,
});

/**
 * Maps a PostgreSQL farm record to a public API DTO.
 */
export const mapFarmToOutput = (record: IFarmRecord): IFarmOutput => ({
  id: record.id,
  name: record.name,
  code: record.code,
  status: record.status,
  owner: mapOwnerToOutput(record),
  commodityIds: record.commodityIds,
  location: mapLocationToOutput(record),
  annualProductionEstimateKg: record.annualProductionEstimateKg ?? undefined,
  areaHectares: record.areaHectares ?? undefined,
  declarationAccepted: record.declarationAccepted,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
