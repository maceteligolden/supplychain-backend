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
import {
  DashboardController,
  DashboardService,
} from '@/modules/dashboard/dashboard.index';
import { FarmController, FarmRepository, FarmService } from '@/modules/farms';
import { FarmBoundaryController } from '@/modules/farm-boundaries/farm-boundary.controller';
import { FarmBoundaryRepository } from '@/modules/farm-boundaries/farm-boundary.repository';
import { FarmBoundaryService } from '@/modules/farm-boundaries/farm-boundary.service';
import { AssessmentEngineService } from '@/modules/farm-assessments/assessment-engine.service';
import { FarmAssessmentController } from '@/modules/farm-assessments/farm-assessment.controller';
import { FarmAssessmentRepository } from '@/modules/farm-assessments/farm-assessment.repository';
import { FarmAssessmentService } from '@/modules/farm-assessments/farm-assessment.service';
import { GfwClient } from '@/shared/integrations/gfw.client';
import { NominatimClient } from '@/shared/integrations/nominatim.client';
import { WhispClient } from '@/shared/integrations/whisp.client';
import { WdpaClient } from '@/shared/integrations/wdpa.client';
import { SupplyChainEventController } from '@/modules/supply-chain-events/supply-chain-event.controller';
import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { SupplyChainEventService } from '@/modules/supply-chain-events/supply-chain-event.service';
import { SupplyChainController } from '@/modules/supply-chains/supply-chain.controller';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';
import { SupplyChainService } from '@/modules/supply-chains/supply-chain.service';
import { GeocodeController } from '@/modules/geocode';
import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';
import { InventoryCodeRepository } from '@/modules/inventory-codes';

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

  container.register(InventoryCodeRepository, { useClass: InventoryCodeRepository });

  container.register(CommodityRepository, { useClass: CommodityRepository });
  container.register(CommodityService, { useClass: CommodityService });
  container.register(CommodityController, { useClass: CommodityController });

  container.register(ActorRepository, { useClass: ActorRepository });
  container.register(ActorService, { useClass: ActorService });
  container.register(ActorController, { useClass: ActorController });

  container.register(FarmRepository, { useClass: FarmRepository });
  container.register(FarmService, { useClass: FarmService });
  container.register(FarmController, { useClass: FarmController });

  container.register(NominatimClient, { useClass: NominatimClient });
  container.register(GeocodeController, { useClass: GeocodeController });
  container.register(GfwClient, { useClass: GfwClient });
  container.register(WhispClient, { useClass: WhispClient });
  container.register(WdpaClient, { useClass: WdpaClient });
  container.register(FarmBoundaryRepository, { useClass: FarmBoundaryRepository });
  container.register(FarmBoundaryService, { useClass: FarmBoundaryService });
  container.register(FarmBoundaryController, { useClass: FarmBoundaryController });
  container.register(FarmAssessmentRepository, { useClass: FarmAssessmentRepository });
  container.register(AssessmentEngineService, { useClass: AssessmentEngineService });
  container.register(FarmAssessmentService, { useClass: FarmAssessmentService });
  container.register(FarmAssessmentController, { useClass: FarmAssessmentController });

  container.register(SupplyChainEventRepository, {
    useClass: SupplyChainEventRepository,
  });
  container.register(SupplyChainEventService, { useClass: SupplyChainEventService });
  container.register(SupplyChainEventController, {
    useClass: SupplyChainEventController,
  });

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

  container.register(DashboardService, { useClass: DashboardService });
  container.register(DashboardController, { useClass: DashboardController });
};

export { container };
