import { container } from 'tsyringe';

import {
  AdminAuthService,
  AuthController,
  AuthMiddleware,
  RefreshTokenRepository,
  UserRepository,
} from '@/modules/auth';
import { ActorController, ActorRepository, ActorService } from '@/modules/actors';
import {
  CommodityController,
  CommodityRepository,
  CommodityService,
} from '@/modules/commodities';
import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';

/**
 * Registers application dependencies with tsyringe.
 */
export const setupDependencyContainer = (): void => {
  container.register(HealthService, { useClass: HealthService });
  container.register(HealthController, { useClass: HealthController });

  container.register(UserRepository, { useClass: UserRepository });
  container.register(RefreshTokenRepository, { useClass: RefreshTokenRepository });
  container.register(AdminAuthService, { useClass: AdminAuthService });
  container.register(AuthController, { useClass: AuthController });
  container.register(AuthMiddleware, { useClass: AuthMiddleware });

  container.register(CommodityRepository, { useClass: CommodityRepository });
  container.register(CommodityService, { useClass: CommodityService });
  container.register(CommodityController, { useClass: CommodityController });

  container.register(ActorRepository, { useClass: ActorRepository });
  container.register(ActorService, { useClass: ActorService });
  container.register(ActorController, { useClass: ActorController });
};

export { container };
