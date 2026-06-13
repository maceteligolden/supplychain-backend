import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { ResponseUtil } from '@/shared/utils';

import { SupplyChainService } from './supply-chain.service';

/**
 * SupplyChainController maps HTTP supply chain read requests.
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
}
