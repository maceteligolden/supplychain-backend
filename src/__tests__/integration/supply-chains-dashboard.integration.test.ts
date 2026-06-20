import request from 'supertest';
import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { createApp } from '@/app';
import { ActorRepository, ActorService, type IActorRecord } from '@/modules/actors';
import type { IActorOutput } from '@/modules/actors';
import { AuthMiddleware } from '@/modules/auth/auth.middleware';
import { BatchAllocationRepository } from '@/modules/batch-allocations/batch-allocation.repository';
import { BatchRepository } from '@/modules/batches/batch.repository';
import { CommodityRepository } from '@/modules/commodities/commodity.repository';
import { FarmRepository } from '@/modules/farms/farm.repository';
import type { IGetDashboardSummaryOutput } from '@/modules/dashboard/dashboard.interface';
import {
  SupplyChainEventRepository,
  SupplyChainEventService,
  type IGetSupplyChainEventsOutput,
  type ISupplyChainEventOutput,
  type ISupplyChainEventRecord,
} from '@/modules/supply-chain-events';
import {
  SupplyChainRepository,
  SupplyChainService,
  type IGetSupplyChainsOutput,
  type ISupplyChainOutput,
  type ISupplyChainRecord,
} from '@/modules/supply-chains';
import { setupDependencyContainer } from '@/shared/container';
import { ISuccessResponseOutput } from '@/shared/utils';

class InMemoryFarmRepository extends FarmRepository {
  override countAll(): Promise<number> {
    return Promise.resolve(0);
  }

  override findAll() {
    return Promise.resolve([]);
  }
}

class InMemoryBatchRepository extends BatchRepository {
  override countAll(): Promise<number> {
    return Promise.resolve(0);
  }

  override findAll() {
    return Promise.resolve([]);
  }
}

class InMemoryBatchAllocationRepository extends BatchAllocationRepository {
  override findAll() {
    return Promise.resolve([]);
  }
}

class InMemoryCommodityRepository extends CommodityRepository {
  override findAll() {
    return Promise.resolve([]);
  }
}

class InMemorySupplyChainRepository extends SupplyChainRepository {
  private store = new Map<string, ISupplyChainRecord>();

  override findAll(): Promise<ISupplyChainRecord[]> {
    return Promise.resolve(
      [...this.store.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }

  override count(): Promise<number> {
    return Promise.resolve(this.store.size);
  }

  override findById(id: string): Promise<ISupplyChainRecord | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  override findByCode(code: string): Promise<ISupplyChainRecord | null> {
    return Promise.resolve(
      [...this.store.values()].find((record) => record.code === code.toUpperCase()) ??
        null,
    );
  }

  override isReferencedByAllocations(_id: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  override create(input: {
    name: string;
    code: string;
    description?: string | null;
    status: ISupplyChainRecord['status'];
    commodityId?: string | null;
  }): Promise<ISupplyChainRecord> {
    const now = new Date();
    const record: ISupplyChainRecord = {
      id: `chain-${this.store.size + 1}`,
      name: input.name.trim(),
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      status: input.status,
      commodityId: input.commodityId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    return Promise.resolve(record);
  }

  override updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      description?: string | null;
      status?: ISupplyChainRecord['status'];
      commodityId?: string | null;
    },
  ): Promise<ISupplyChainRecord | null> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(null);
    }

    const updated: ISupplyChainRecord = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      code: input.code?.toUpperCase() ?? existing.code,
      description:
        input.description !== undefined
          ? (input.description ?? null)
          : existing.description,
      status: input.status ?? existing.status,
      commodityId:
        input.commodityId !== undefined ? input.commodityId : existing.commodityId,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }

  override deleteById(id: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(id));
  }
}

class InMemoryActorRepository extends ActorRepository {
  private store = new Map<string, IActorRecord>();

  override findAll(): Promise<IActorRecord[]> {
    return Promise.resolve([...this.store.values()]);
  }

  override countAll(): Promise<number> {
    return Promise.resolve(this.store.size);
  }

  override findById(id: string): Promise<IActorRecord | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  override findByCode(code: string): Promise<IActorRecord | null> {
    return Promise.resolve(
      [...this.store.values()].find((record) => record.code === code.toUpperCase()) ??
        null,
    );
  }

  override isReferencedByEvents(_id: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  override create(input: {
    name: string;
    code: string;
    type: IActorRecord['type'];
    status: IActorRecord['status'];
    address: {
      addressLine1?: string | null;
      addressCity: string;
      addressRegion: string;
      addressCountry: string;
    };
  }): Promise<IActorRecord> {
    const now = new Date();
    const record: IActorRecord = {
      id: `actor-${this.store.size + 1}`,
      name: input.name.trim(),
      code: input.code.toUpperCase(),
      type: input.type,
      status: input.status,
      addressLine1: input.address.addressLine1 ?? null,
      addressCity: input.address.addressCity,
      addressRegion: input.address.addressRegion,
      addressCountry: input.address.addressCountry,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    return Promise.resolve(record);
  }

  override updateById(): Promise<IActorRecord | null> {
    return Promise.resolve(null);
  }

  override deleteById(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

class InMemorySupplyChainEventRepository extends SupplyChainEventRepository {
  private store = new Map<string, ISupplyChainEventRecord>();

  override findAll(): Promise<ISupplyChainEventRecord[]> {
    return Promise.resolve([...this.store.values()]);
  }

  override findBySupplyChainId(
    supplyChainId: string,
  ): Promise<ISupplyChainEventRecord[]> {
    return Promise.resolve(
      [...this.store.values()]
        .filter((record) => record.supplyChainId === supplyChainId)
        .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
    );
  }

  override findByActorId(actorId: string): Promise<ISupplyChainEventRecord[]> {
    return Promise.resolve(
      [...this.store.values()].filter((record) => record.actorId === actorId),
    );
  }

  override findByIdForSupplyChain(
    supplyChainId: string,
    eventId: string,
  ): Promise<ISupplyChainEventRecord | null> {
    const record = this.store.get(eventId);
    if (!record || record.supplyChainId !== supplyChainId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(record);
  }

  override create(input: {
    supplyChainId: string;
    type: ISupplyChainEventRecord['type'];
    occurredAt: Date;
    actorId: string;
    notes?: string | null;
  }): Promise<ISupplyChainEventRecord> {
    const now = new Date();
    const record: ISupplyChainEventRecord = {
      id: `event-${this.store.size + 1}`,
      supplyChainId: input.supplyChainId,
      type: input.type,
      occurredAt: input.occurredAt,
      actorId: input.actorId,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    return Promise.resolve(record);
  }

  override updateById(
    id: string,
    input: { notes?: string | null; actorId?: string },
  ): Promise<ISupplyChainEventRecord | null> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(null);
    }

    const updated: ISupplyChainEventRecord = {
      ...existing,
      notes: input.notes !== undefined ? (input.notes ?? null) : existing.notes,
      actorId: input.actorId ?? existing.actorId,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }
}

describe('Supply chains, events & dashboard API integration', () => {
  let inMemorySupplyChainRepository: InMemorySupplyChainRepository;
  let inMemoryActorRepository: InMemoryActorRepository;
  let inMemorySupplyChainEventRepository: InMemorySupplyChainEventRepository;

  beforeEach(() => {
    container.clearInstances();
    setupDependencyContainer();

    inMemorySupplyChainRepository = new InMemorySupplyChainRepository();
    inMemoryActorRepository = new InMemoryActorRepository();
    inMemorySupplyChainEventRepository = new InMemorySupplyChainEventRepository();

    container.register(SupplyChainRepository, {
      useValue: inMemorySupplyChainRepository,
    });
    container.register(SupplyChainService, { useClass: SupplyChainService });
    container.register(ActorRepository, { useValue: inMemoryActorRepository });
    container.register(ActorService, { useClass: ActorService });
    container.register(SupplyChainEventRepository, {
      useValue: inMemorySupplyChainEventRepository,
    });
    container.register(SupplyChainEventService, { useClass: SupplyChainEventService });
    container.register(FarmRepository, { useClass: InMemoryFarmRepository });
    container.register(BatchRepository, { useClass: InMemoryBatchRepository });
    container.register(BatchAllocationRepository, {
      useClass: InMemoryBatchAllocationRepository,
    });
    container.register(CommodityRepository, { useClass: InMemoryCommodityRepository });

    container.register(AuthMiddleware, {
      useValue: {
        requireAuth: (request: Request, _response: Response, next: NextFunction) => {
          request.authUser = {
            userId: 'user-1',
            role: 'SUPER_ADMIN',
          };
          next();
        },
      } as unknown as AuthMiddleware,
    });
  });

  it('POST /api/v1/supply-chains creates a supply chain', async () => {
    const app = createApp();
    const response = await request(app).post('/api/v1/supply-chains').send({
      name: 'Ghana Cocoa Export',
      code: 'gh_cocoa_export',
      status: 'ACTIVE',
    });
    const body = response.body as ISuccessResponseOutput<ISupplyChainOutput>;

    expect(response.status).toBe(201);
    expect(body.data.code).toBe('GH_COCOA_EXPORT');
  });

  it('POST /api/v1/supply-chains/:id/events creates a lifecycle event', async () => {
    const app = createApp();

    const chainResponse = await request(app).post('/api/v1/supply-chains').send({
      name: 'Ghana Cocoa Export',
      code: 'GH_COCOA_EXPORT',
      status: 'ACTIVE',
    });
    const chain = chainResponse.body as ISuccessResponseOutput<ISupplyChainOutput>;

    const actorResponse = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Kumasi Collection Centre',
        code: 'KUMASI_COLLECTION_CENTRE',
        type: 'COLLECTION_CENTRE',
        address: { city: 'Kumasi', region: 'Ashanti', country: 'Ghana' },
        status: 'ACTIVE',
      });

    const actorBody = actorResponse.body as ISuccessResponseOutput<IActorOutput>;

    const eventResponse = await request(app)
      .post(`/api/v1/supply-chains/${chain.data.id}/events`)
      .send({
        type: 'HARVEST',
        occurredAt: '2025-06-01T08:00:00.000Z',
        actorId: actorBody.data.id,
      });
    const eventBody =
      eventResponse.body as ISuccessResponseOutput<ISupplyChainEventOutput>;

    expect(eventResponse.status).toBe(201);
    expect(eventBody.data.type).toBe('HARVEST');

    const listResponse = await request(app).get(
      `/api/v1/supply-chains/${chain.data.id}/events`,
    );
    const listBody =
      listResponse.body as ISuccessResponseOutput<IGetSupplyChainEventsOutput>;

    expect(listBody.data.total).toBe(1);
  });

  it('GET /api/v1/dashboard returns dashboard summary', async () => {
    const app = createApp();

    await request(app).post('/api/v1/supply-chains').send({
      name: 'Ghana Cocoa Export',
      code: 'GH_COCOA_EXPORT',
      status: 'ACTIVE',
    });

    const actorResponse = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Kumasi Collection Centre',
        code: 'KUMASI_COLLECTION_CENTRE',
        type: 'COLLECTION_CENTRE',
        address: { city: 'Kumasi', region: 'Ashanti', country: 'Ghana' },
        status: 'ACTIVE',
      });

    const chainList = await request(app).get('/api/v1/supply-chains');
    const chains = chainList.body as ISuccessResponseOutput<IGetSupplyChainsOutput>;

    const actorBody = actorResponse.body as ISuccessResponseOutput<IActorOutput>;

    await request(app)
      .post(`/api/v1/supply-chains/${chains.data.supplyChains[0]?.id}/events`)
      .send({
        type: 'HARVEST',
        occurredAt: '2025-06-01T08:00:00.000Z',
        actorId: actorBody.data.id,
      });

    const dashboardResponse = await request(app).get('/api/v1/dashboard');
    const dashboardBody =
      dashboardResponse.body as ISuccessResponseOutput<IGetDashboardSummaryOutput>;

    expect(dashboardResponse.status).toBe(200);
    expect(
      dashboardBody.data.kpis.some((kpi) => kpi.id === 'kpi-events' && kpi.value === 1),
    ).toBe(true);
    expect(dashboardBody.data.recentActivity.length).toBeGreaterThan(0);
  });
});
