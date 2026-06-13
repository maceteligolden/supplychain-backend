import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import { ICreateCommodityInput, IUpdateCommodityInput } from './commodity.interface';
import { CommodityService } from './commodity.service';

/**
 * CommodityController maps HTTP commodity requests to CommodityService.
 */
@injectable()
export class CommodityController {
  constructor(
    @inject(CommodityService) private readonly commodityService: CommodityService,
  ) {}

  /** Handles GET /commodities — returns all commodities. */
  list = async (_request: Request, response: Response): Promise<void> => {
    const output = await this.commodityService.listCommodities();
    ResponseUtil.success(response, output);
  };

  /** Handles GET /commodities/:id — returns one commodity. */
  getById = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.commodityService.getCommodityById(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /commodities — creates a commodity. */
  create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as ICreateCommodityInput;
    const output = await this.commodityService.createCommodity({
      name: body.name,
      code: body.code,
      unit: body.unit,
      storedImageFilename: request.file?.filename,
    });
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /commodities/:id — updates a commodity. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = request.body as IUpdateCommodityInput;
    const output = await this.commodityService.updateCommodity(id, {
      name: body.name,
      code: body.code,
      unit: body.unit,
      storedImageFilename: request.file?.filename,
    });
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /commodities/:id — removes a commodity. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.commodityService.deleteCommodity(id);
    ResponseUtil.success(response, output);
  };
}
