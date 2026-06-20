import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import {
  ICreateSupplyChainInput,
  ISyncSupplyChainAllocationsInput,
  IUpdateSupplyChainInput,
} from './supply-chain.interface';
import { SupplyChainService } from './supply-chain.service';

/**
 * SupplyChainController maps HTTP supply chain requests to SupplyChainService.
 */
@injectable()
export class SupplyChainController {
  constructor(
    @inject(SupplyChainService) private readonly supplyChainService: SupplyChainService,
  ) {}

  /** Handles GET /supply-chains — returns all supply chains. */
  list = async (_request: Request, response: Response): Promise<void> => {
    const output = await this.supplyChainService.listSupplyChains();
    ResponseUtil.success(response, output);
  };

  /** Handles GET /supply-chains/:id/risk-summary — returns deforestation risk summary. */
  getRiskSummary = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.supplyChainService.getRiskSummary(id);
    ResponseUtil.success(response, output);
  };

  /** Handles GET /supply-chains/:id/report — returns traceability report. */
  getReport = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.supplyChainService.getReport(id);
    ResponseUtil.success(response, output);
  };

  /** Handles GET /supply-chains/:id — returns one supply chain. */
  getById = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.supplyChainService.getSupplyChainById(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /supply-chains — creates a supply chain. */
  create = async (request: Request, response: Response): Promise<void> => {
    const input = request.body as ICreateSupplyChainInput;
    const output = await this.supplyChainService.createSupplyChain(input);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /supply-chains/:id — updates a supply chain. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as IUpdateSupplyChainInput;
    const output = await this.supplyChainService.updateSupplyChain(id, input);
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /supply-chains/:id — removes a supply chain. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.supplyChainService.deleteSupplyChain(id);
    ResponseUtil.success(response, output);
  };

  /** Handles PUT /supply-chains/:id/allocations — syncs batch allocations. */
  syncAllocations = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as ISyncSupplyChainAllocationsInput;
    const output = await this.supplyChainService.syncSupplyChainAllocations(id, input);
    ResponseUtil.success(response, output);
  };
}
