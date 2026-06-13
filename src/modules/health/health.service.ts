import { injectable } from 'tsyringe';

import { IHealthStatusOutput } from './health.interface';

/**
 * HealthService exposes operational readiness information for load balancers and monitors.
 */
@injectable()
export class HealthService {
  /**
   * Returns the current service health snapshot.
   */
  getHealthStatus(): IHealthStatusOutput {
    return {
      status: 'ok',
      message: 'Supply chain API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
