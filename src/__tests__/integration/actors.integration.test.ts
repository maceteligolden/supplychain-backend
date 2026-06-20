import request from 'supertest';
import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { createApp } from '@/app';
import { AuthMiddleware } from '@/modules/auth/auth.middleware';
import { ActorRepository, ActorService, type IActorRecord } from '@/modules/actors';
import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';
import { setupDependencyContainer } from '@/shared/container';
import { ISuccessResponseOutput, IErrorResponseOutput } from '@/shared/utils';
import type {
  IActorInvolvementOutput,
  IActorOutput,
  IGetActorsOutput,
} from '@/modules/actors';

class InMemoryActorRepository extends ActorRepository {
  private store = new Map<string, IActorRecord>();

  override findAll(): Promise<IActorRecord[]> {
    return Promise.resolve(
      [...this.store.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
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

  override updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      type?: IActorRecord['type'];
      status?: IActorRecord['status'];
      address?: {
        addressLine1?: string | null;
        addressCity?: string;
        addressRegion?: string;
        addressCountry?: string;
      };
    },
  ): Promise<IActorRecord | null> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(null);
    }

    const updated: IActorRecord = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      code: input.code?.toUpperCase() ?? existing.code,
      type: input.type ?? existing.type,
      status: input.status ?? existing.status,
      addressLine1: input.address?.addressLine1 ?? existing.addressLine1,
      addressCity: input.address?.addressCity ?? existing.addressCity,
      addressRegion: input.address?.addressRegion ?? existing.addressRegion,
      addressCountry: input.address?.addressCountry ?? existing.addressCountry,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }

  override deleteById(id: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(id));
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Actors API integration', () => {
  let inMemoryActorRepository: InMemoryActorRepository;

  beforeEach(() => {
    container.clearInstances();
    setupDependencyContainer();
    inMemoryActorRepository = new InMemoryActorRepository();

    container.register(ActorRepository, {
      useValue: inMemoryActorRepository,
    });
    container.register(SupplyChainEventRepository, {
      useValue: {
        findByActorId: () => Promise.resolve([]),
      } as unknown as SupplyChainEventRepository,
    });
    container.register(SupplyChainRepository, {
      useValue: {
        findById: () => Promise.resolve(null),
      } as unknown as SupplyChainRepository,
    });
    container.register(ActorService, { useClass: ActorService });

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

  it('GET /api/v1/actors returns empty list initially', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/actors');
    const body = response.body as ISuccessResponseOutput<IGetActorsOutput>;

    expect(response.status).toBe(200);
    expect(body.data.actors).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it('POST /api/v1/actors creates an actor', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Kumasi Collection Centre',
        code: 'kumasi_collection_centre',
        type: 'COLLECTION_CENTRE',
        address: {
          city: 'Kumasi',
          region: 'Ashanti',
          country: 'Ghana',
        },
        status: 'ACTIVE',
      });
    const body = response.body as ISuccessResponseOutput<IActorOutput>;

    expect(response.status).toBe(201);
    expect(body.data.code).toBe('KUMASI_COLLECTION_CENTRE');
    expect(body.data.address.city).toBe('Kumasi');
  });

  it('POST /api/v1/actors rejects duplicate code', async () => {
    const app = createApp();

    await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Kumasi Collection Centre',
        code: 'KUMASI_COLLECTION_CENTRE',
        type: 'COLLECTION_CENTRE',
        address: { city: 'Kumasi', region: 'Ashanti', country: 'Ghana' },
        status: 'ACTIVE',
      });

    const duplicateResponse = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Another Centre',
        code: 'KUMASI_COLLECTION_CENTRE',
        type: 'PROCESSOR',
        address: { city: 'Accra', region: 'Greater Accra', country: 'Ghana' },
        status: 'ACTIVE',
      });

    expect(duplicateResponse.status).toBe(400);
    const duplicateBody = duplicateResponse.body as IErrorResponseOutput;
    expect(duplicateBody.message).toBe('Actor code already exists');
  });

  it('GET /api/v1/actors/:id/involvement returns empty involvement', async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Tema Export Terminal',
        code: 'TEMA_EXPORT_TERMINAL',
        type: 'EXPORTER',
        address: { city: 'Tema', region: 'Greater Accra', country: 'Ghana' },
        status: 'ACTIVE',
      });
    const created = createResponse.body as ISuccessResponseOutput<IActorOutput>;

    const involvementResponse = await request(app).get(
      `/api/v1/actors/${created.data.id}/involvement`,
    );
    const body =
      involvementResponse.body as ISuccessResponseOutput<IActorInvolvementOutput>;

    expect(involvementResponse.status).toBe(200);
    expect(body.data.actor.code).toBe('TEMA_EXPORT_TERMINAL');
    expect(body.data.events).toEqual([]);
    expect(body.data.stats.eventCount).toBe(0);
  });

  it('DELETE /api/v1/actors/:id removes actor', async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post('/api/v1/actors')
      .send({
        name: 'Accra Cocoa Processing Ltd',
        code: 'ACCRA_COCOA_PROCESSING_LTD',
        type: 'PROCESSOR',
        address: { city: 'Accra', region: 'Greater Accra', country: 'Ghana' },
        status: 'ACTIVE',
      });
    const created = createResponse.body as ISuccessResponseOutput<IActorOutput>;

    const deleteResponse = await request(app).delete(
      `/api/v1/actors/${created.data.id}`,
    );

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app).get(`/api/v1/actors/${created.data.id}`);
    expect(getResponse.status).toBe(404);
  });
});
