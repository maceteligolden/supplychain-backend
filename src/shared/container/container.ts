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
  BatchAllocationController,
  BatchAllocationRepository,
  BatchAllocationService,
} from '@/modules/batch-allocations';
import { BatchController, BatchRepository, BatchService } from '@/modules/batches';
import {
  CommodityController,
  CommodityRepository,
  CommodityService,
} from '@/modules/commodities';
import { FarmController, FarmRepository, FarmService } from '@/modules/farms';
import {
  SupplyChainController,
  SupplyChainRepository,
  SupplyChainService,
} from '@/modules/supply-chains';
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

  container.register(FarmRepository, { useClass: FarmRepository });
  container.register(FarmService, { useClass: FarmService });
  container.register(FarmController, { useClass: FarmController });

  container.register(SupplyChainRepository, { useClass: SupplyChainRepository });
  container.register(SupplyChainService, { useClass: SupplyChainService });
  container.register(SupplyChainController, { useClass: SupplyChainController });

  container.register(BatchRepository, { useClass: BatchRepository });
  container.register(BatchService, { useClass: BatchService });
  container.register(BatchController, { useClass: BatchController });

  container.register(BatchAllocationRepository, {
    useClass: BatchAllocationRepository,
  });
  container.register(BatchAllocationService, { useClass: BatchAllocationService });
  container.register(BatchAllocationController, {
    useClass: BatchAllocationController,
  });
};

export { container };
