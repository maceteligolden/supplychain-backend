import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { ResponseUtil } from '@/shared/utils';

import { DashboardService } from './dashboard.service';

/**
 * DashboardController maps HTTP dashboard requests to DashboardService.
 */
@injectable()
export class DashboardController {
  constructor(
    @inject(DashboardService) private readonly dashboardService: DashboardService,
  ) {}

  /** Handles GET /dashboard — returns aggregated dashboard summary. */
  getSummary = async (_request: Request, response: Response): Promise<void> => {
    const output = await this.dashboardService.getSummary();
    ResponseUtil.success(response, output);
  };
}
