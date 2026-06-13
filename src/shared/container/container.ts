import { container } from 'tsyringe';

import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';

/**
 * Registers application dependencies with tsyringe.
 */
export const setupDependencyContainer = (): void => {
  container.register(HealthService, { useClass: HealthService });
  container.register(HealthController, { useClass: HealthController });
};

export { container };
