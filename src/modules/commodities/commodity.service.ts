import { inject, injectable } from 'tsyringe';

import { InventoryCodeRepository } from '@/modules/inventory-codes';
import { INVENTORY_CODE_PREFIXES } from '@/shared/constants';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import {
  ICommodityOutput,
  ICreateCommodityInput,
  IDeleteCommodityOutput,
  IGetCommoditiesOutput,
  IUpdateCommodityInput,
} from './commodity.interface';
import { mapCommodityToOutput } from './commodity.mapper';
import { CommodityRepository } from './commodity.repository';
import { buildCommodityImageUrl, deleteCommodityImageFile } from './commodity.util';

/**
 * CommodityService implements commodity CRUD business logic.
 */
@injectable()
export class CommodityService {
  constructor(
    @inject(CommodityRepository)
    private readonly commodityRepository: CommodityRepository,
    @inject(InventoryCodeRepository)
    private readonly inventoryCodeRepository: InventoryCodeRepository,
  ) {}

  /** Lists all commodities with total count. */
  async listCommodities(): Promise<IGetCommoditiesOutput> {
    const [documents, total] = await Promise.all([
      this.commodityRepository.findAll(),
      this.commodityRepository.countAll(),
    ]);

    return {
      commodities: documents.map(mapCommodityToOutput),
      total,
    };
  }

  /** Returns a single commodity by id. */
  async getCommodityById(id: string): Promise<ICommodityOutput> {
    const document = await this.commodityRepository.findById(id);

    if (!document) {
      throw new NotFoundError('Commodity not found');
    }

    return mapCommodityToOutput(document);
  }

  /** Creates a commodity with a server-generated inventory code. */
  async createCommodity(input: ICreateCommodityInput): Promise<ICommodityOutput> {
    const code = await this.inventoryCodeRepository.allocateNextCode(
      INVENTORY_CODE_PREFIXES.COMMODITY,
    );

    const document = await this.commodityRepository.create({
      name: input.name,
      code,
      unit: input.unit,
      imageUrl: input.storedImageFilename
        ? buildCommodityImageUrl(input.storedImageFilename)
        : '',
    });

    return mapCommodityToOutput(document);
  }

  /** Updates an existing commodity. Codes are immutable. */
  async updateCommodity(
    id: string,
    input: IUpdateCommodityInput,
  ): Promise<ICommodityOutput> {
    const existing = await this.commodityRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Commodity not found');
    }

    const hasFieldUpdate = input.name !== undefined || input.unit !== undefined;
    const hasImageUpdate = Boolean(input.storedImageFilename);

    if (!hasFieldUpdate && !hasImageUpdate) {
      throw new BadRequestError('At least one field is required');
    }

    if (input.storedImageFilename && existing.imageUrl) {
      deleteCommodityImageFile(existing.imageUrl);
    }

    const nextImageUrl = input.storedImageFilename
      ? buildCommodityImageUrl(input.storedImageFilename)
      : undefined;

    const updated = await this.commodityRepository.updateById(id, {
      name: input.name,
      unit: input.unit,
      imageUrl: nextImageUrl,
    });

    if (!updated) {
      throw new NotFoundError('Commodity not found');
    }

    return mapCommodityToOutput(updated);
  }

  /** Deletes a commodity by id when not referenced by farms or batches. */
  async deleteCommodity(id: string): Promise<IDeleteCommodityOutput> {
    const existing = await this.commodityRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Commodity not found');
    }

    const isReferenced =
      await this.commodityRepository.isReferencedByFarmsOrBatches(id);

    if (isReferenced) {
      throw new BadRequestError(
        'Cannot delete commodity referenced by farms or batches',
      );
    }

    const deleted = await this.commodityRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Commodity not found');
    }

    if (existing.imageUrl) {
      deleteCommodityImageFile(existing.imageUrl);
    }

    return { success: true, id };
  }
}
