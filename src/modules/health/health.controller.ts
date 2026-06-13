import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';

import { ResponseUtil } from '@/shared/utils';

import { HealthService } from './health.service';

/**
 * HealthController maps HTTP requests to HealthService and formats responses.
 */
@injectable()
export class HealthController {
  constructor(
    @inject(HealthService) private readonly healthService: HealthService,
  ) {}

  /**
   * Handles GET /health and returns service readiness metadata.
   */
  getHealth = (_request: Request, response: Response): void => {
    const healthStatusOutput = this.healthService.getHealthStatus();
    ResponseUtil.success(response, healthStatusOutput);
  };
}
