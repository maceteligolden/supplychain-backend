import { inject, injectable } from 'tsyringe';

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

  /** Creates a commodity with a unique code. */
  async createCommodity(input: ICreateCommodityInput): Promise<ICommodityOutput> {
    const code = input.code.toUpperCase();
    await this.assertCodeAvailable(code);

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

  /** Updates an existing commodity. */
  async updateCommodity(
    id: string,
    input: IUpdateCommodityInput,
  ): Promise<ICommodityOutput> {
    const existing = await this.commodityRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Commodity not found');
    }

    const hasFieldUpdate =
      input.name !== undefined || input.code !== undefined || input.unit !== undefined;
    const hasImageUpdate = Boolean(input.storedImageFilename);

    if (!hasFieldUpdate && !hasImageUpdate) {
      throw new BadRequestError('At least one field is required');
    }

    const nextCode = input.code ? input.code.toUpperCase() : existing.code;

    if (nextCode !== existing.code) {
      await this.assertCodeAvailable(nextCode, id);
    }

    if (input.storedImageFilename && existing.imageUrl) {
      deleteCommodityImageFile(existing.imageUrl);
    }

    const nextImageUrl = input.storedImageFilename
      ? buildCommodityImageUrl(input.storedImageFilename)
      : undefined;

    const updated = await this.commodityRepository.updateById(id, {
      name: input.name,
      code: input.code ? nextCode : undefined,
      unit: input.unit,
      imageUrl: nextImageUrl,
    });

    if (!updated) {
      throw new NotFoundError('Commodity not found');
    }

    return mapCommodityToOutput(updated);
  }

  /** Deletes a commodity by id. */
  async deleteCommodity(id: string): Promise<IDeleteCommodityOutput> {
    const existing = await this.commodityRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Commodity not found');
    }

    if (existing.imageUrl) {
      deleteCommodityImageFile(existing.imageUrl);
    }

    const deleted = await this.commodityRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Commodity not found');
    }

    return { success: true, id };
  }

  private async assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.commodityRepository.findByCode(code);

    if (existing && existing.id !== excludeId) {
      throw new BadRequestError('Commodity code already exists', {
        issues: [{ path: 'code', message: 'Code must be unique' }],
      });
    }
  }
}
