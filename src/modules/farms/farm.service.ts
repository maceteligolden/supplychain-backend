import { inject, injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import {
  ICreateFarmInput,
  IDeleteFarmOutput,
  IFarmOutput,
  IGetFarmsOutput,
  IUpdateFarmInput,
} from './farm.interface';
import { mapFarmToOutput, mapLocationToRecord, mapOwnerToRecord } from './farm.mapper';
import { FarmRepository } from './farm.repository';

/**
 * FarmService implements farm CRUD business logic.
 */
@injectable()
export class FarmService {
  constructor(
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
  ) {}

  /** Lists all farms with total count. */
  async listFarms(): Promise<IGetFarmsOutput> {
    const [records, total] = await Promise.all([
      this.farmRepository.findAll(),
      this.farmRepository.countAll(),
    ]);

    return {
      farms: records.map(mapFarmToOutput),
      total,
    };
  }

  /** Returns a single farm by id. */
  async getFarmById(id: string): Promise<IFarmOutput> {
    const record = await this.farmRepository.findById(id);

    if (!record) {
      throw new NotFoundError('Farm not found');
    }

    return mapFarmToOutput(record);
  }

  /** Creates a farm with a unique code and valid commodity links. */
  async createFarm(input: ICreateFarmInput): Promise<IFarmOutput> {
    const code = input.code.toUpperCase();
    await this.assertCodeAvailable(code);
    await this.assertCommodityIdsExist(input.commodityIds);

    const record = await this.farmRepository.create({
      name: input.name,
      code,
      status: input.status ?? 'DRAFT',
      owner: mapOwnerToRecord(input.owner),
      location: mapLocationToRecord(input.location),
      annualProductionEstimateKg: input.annualProductionEstimateKg,
      areaHectares: input.areaHectares,
      declarationAccepted: input.declarationAccepted,
    });

    await this.farmRepository.setCommodities(record.id, input.commodityIds);

    const created = await this.farmRepository.findById(record.id);

    if (!created) {
      throw new NotFoundError('Farm not found');
    }

    return mapFarmToOutput(created);
  }

  /** Updates an existing farm. */
  async updateFarm(id: string, input: IUpdateFarmInput): Promise<IFarmOutput> {
    const existing = await this.farmRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Farm not found');
    }

    const nextCode = input.code ? input.code.toUpperCase() : existing.code;

    if (nextCode !== existing.code) {
      await this.assertCodeAvailable(nextCode, id);
    }

    if (input.commodityIds) {
      await this.assertCommodityIdsExist(input.commodityIds);
    }

    const nextOwner = input.owner
      ? {
          ownerFirstName:
            input.owner.firstName !== undefined
              ? input.owner.firstName.trim()
              : existing.ownerFirstName,
          ownerLastName:
            input.owner.lastName !== undefined
              ? input.owner.lastName.trim()
              : existing.ownerLastName,
          ownerPhone:
            input.owner.phone !== undefined
              ? input.owner.phone.trim()
              : existing.ownerPhone,
          ownerEmail:
            input.owner.email !== undefined
              ? input.owner.email.trim()
              : existing.ownerEmail,
        }
      : undefined;

    const nextLocation = input.location
      ? {
          country: input.location.country?.trim() ?? existing.country,
          region: input.location.region?.trim() ?? existing.region,
          city: input.location.city?.trim() ?? existing.city,
          latitude:
            input.location.latitude !== undefined
              ? input.location.latitude
              : existing.latitude,
          longitude:
            input.location.longitude !== undefined
              ? input.location.longitude
              : existing.longitude,
        }
      : undefined;

    const updated = await this.farmRepository.updateById(id, {
      name: input.name,
      code: input.code ? nextCode : undefined,
      status: input.status,
      owner: nextOwner,
      location: nextLocation,
      annualProductionEstimateKg: input.annualProductionEstimateKg,
      areaHectares: input.areaHectares,
      declarationAccepted: input.declarationAccepted,
    });

    if (!updated) {
      throw new NotFoundError('Farm not found');
    }

    if (input.commodityIds) {
      await this.farmRepository.setCommodities(id, input.commodityIds);
    }

    const refreshed = await this.farmRepository.findById(id);

    if (!refreshed) {
      throw new NotFoundError('Farm not found');
    }

    return mapFarmToOutput(refreshed);
  }

  /** Deletes a farm by id when not referenced by batches. */
  async deleteFarm(id: string): Promise<IDeleteFarmOutput> {
    const existing = await this.farmRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Farm not found');
    }

    const isReferenced = await this.farmRepository.isReferencedByBatches(id);

    if (isReferenced) {
      throw new BadRequestError('Cannot delete farm referenced by batches');
    }

    const deleted = await this.farmRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Farm not found');
    }

    return { success: true, id };
  }

  private async assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.farmRepository.findByCode(code);

    if (existing && existing.id !== excludeId) {
      throw new BadRequestError('Farm code already exists', {
        issues: [{ path: 'code', message: 'Code must be unique' }],
      });
    }
  }

  private async assertCommodityIdsExist(commodityIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(commodityIds)];
    const found = await prismaClient.commodity.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (found.length !== uniqueIds.length) {
      const foundIds = new Set(found.map((commodity) => commodity.id));
      const invalidIds = uniqueIds.filter((commodityId) => !foundIds.has(commodityId));

      throw new BadRequestError('One or more commodity IDs are invalid', {
        issues: [
          {
            path: 'commodityIds',
            message: `Invalid commodity IDs: ${invalidIds.join(', ')}`,
          },
        ],
      });
    }
  }
}
