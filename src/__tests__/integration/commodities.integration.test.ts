import request from 'supertest';
import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { createApp } from '@/app';
import { AuthMiddleware } from '@/modules/auth/auth.middleware';
import {
  CommodityRepository,
  CommodityService,
  type ICommodityRecord,
} from '@/modules/commodities';
import { InventoryCodeRepository } from '@/modules/inventory-codes';
import { InMemoryInventoryCodeRepository } from '@/__tests__/helpers/in-memory-inventory-code.repository';
import { setupDependencyContainer } from '@/shared/container';
import { ISuccessResponseOutput } from '@/shared/utils';
import type { ICommodityOutput, IGetCommoditiesOutput } from '@/modules/commodities';

class InMemoryCommodityRepository extends CommodityRepository {
  private store = new Map<string, ICommodityRecord>();
  private referencedIds = new Set<string>();

  override findAll(): Promise<ICommodityRecord[]> {
    return Promise.resolve(
      [...this.store.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }

  override countAll(): Promise<number> {
    return Promise.resolve(this.store.size);
  }

  override findById(id: string): Promise<ICommodityRecord | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  override findByCode(code: string): Promise<ICommodityRecord | null> {
    return Promise.resolve(
      [...this.store.values()].find((record) => record.code === code.toUpperCase()) ??
        null,
    );
  }

  override create(input: {
    name: string;
    code: string;
    unit: ICommodityRecord['unit'];
    imageUrl: string;
  }): Promise<ICommodityRecord> {
    const now = new Date();
    const record: ICommodityRecord = {
      id: `commodity-${this.store.size + 1}`,
      name: input.name.trim(),
      code: input.code.toUpperCase(),
      unit: input.unit,
      imageUrl: input.imageUrl,
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
      unit?: ICommodityRecord['unit'];
      imageUrl?: string;
    },
  ): Promise<ICommodityRecord | null> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(null);
    }

    const updated: ICommodityRecord = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      code: input.code?.toUpperCase() ?? existing.code,
      unit: input.unit ?? existing.unit,
      imageUrl: input.imageUrl ?? existing.imageUrl,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }

  override isReferencedByFarmsOrBatches(id: string): Promise<boolean> {
    return Promise.resolve(this.referencedIds.has(id));
  }

  override deleteById(id: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(id));
  }

  markReferenced(id: string): void {
    this.referencedIds.add(id);
  }

  clear(): void {
    this.store.clear();
    this.referencedIds.clear();
  }
}

describe('Commodities API integration', () => {
  let inMemoryCommodityRepository: InMemoryCommodityRepository;

  beforeEach(() => {
    container.clearInstances();
    setupDependencyContainer();
    inMemoryCommodityRepository = new InMemoryCommodityRepository();

    container.register(CommodityRepository, {
      useValue: inMemoryCommodityRepository,
    });
    container.register(InventoryCodeRepository, {
      useValue: new InMemoryInventoryCodeRepository(),
    });
    container.register(CommodityService, { useClass: CommodityService });

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

  it('GET /api/v1/commodities returns empty list initially', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/commodities');
    const body = response.body as ISuccessResponseOutput<IGetCommoditiesOutput>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.commodities).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it('POST /api/v1/commodities creates a commodity', async () => {
    const app = createApp();
    const response = await request(app).post('/api/v1/commodities').send({
      name: 'Cocoa',
      unit: 'KG',
    });
    const body = response.body as ISuccessResponseOutput<ICommodityOutput>;

    expect(response.status).toBe(201);
    expect(body.data.code).toMatch(/^COM-\d{4}-\d{4}$/);
    expect(body.data.imageUrl).toBe('');
  });

  it('POST /api/v1/commodities stores uploaded image locally', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/commodities')
      .field('name', 'Coffee')
      .field('unit', 'KG')
      .attach('image', Buffer.from('fake-image-bytes'), {
        filename: 'coffee.png',
        contentType: 'image/png',
      });
    const body = response.body as ISuccessResponseOutput<ICommodityOutput>;

    expect(response.status).toBe(201);
    expect(body.data.imageUrl).toMatch(/^\/uploads\/commodities\/[a-f0-9-]+\.png$/);
  });

  it('POST /api/v1/commodities allocates unique inventory codes', async () => {
    const app = createApp();

    const first = await request(app).post('/api/v1/commodities').send({
      name: 'Cocoa',
      unit: 'KG',
    });
    const second = await request(app).post('/api/v1/commodities').send({
      name: 'Another Cocoa',
      unit: 'TON',
    });

    const firstBody = first.body as ISuccessResponseOutput<ICommodityOutput>;
    const secondBody = second.body as ISuccessResponseOutput<ICommodityOutput>;

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(firstBody.data.code).not.toBe(secondBody.data.code);
  });

  it('GET /api/v1/commodities/:id returns commodity', async () => {
    const app = createApp();
    const createResponse = await request(app).post('/api/v1/commodities').send({
      name: 'Gum Arabic',
      unit: 'KG',
    });
    const created = createResponse.body as ISuccessResponseOutput<ICommodityOutput>;

    const getResponse = await request(app).get(
      `/api/v1/commodities/${created.data.id}`,
    );
    const body = getResponse.body as ISuccessResponseOutput<ICommodityOutput>;

    expect(getResponse.status).toBe(200);
    expect(body.data.code).toBe(created.data.code);
  });

  it('PATCH /api/v1/commodities/:id updates commodity', async () => {
    const app = createApp();
    const createResponse = await request(app).post('/api/v1/commodities').send({
      name: 'Cocoa',
      unit: 'KG',
    });
    const created = createResponse.body as ISuccessResponseOutput<ICommodityOutput>;

    const patchResponse = await request(app)
      .patch(`/api/v1/commodities/${created.data.id}`)
      .send({ name: 'Premium Cocoa' });
    const body = patchResponse.body as ISuccessResponseOutput<ICommodityOutput>;

    expect(patchResponse.status).toBe(200);
    expect(body.data.name).toBe('Premium Cocoa');
  });

  it('DELETE /api/v1/commodities/:id removes commodity', async () => {
    const app = createApp();
    const createResponse = await request(app).post('/api/v1/commodities').send({
      name: 'Cocoa',
      unit: 'KG',
    });
    const created = createResponse.body as ISuccessResponseOutput<ICommodityOutput>;

    const deleteResponse = await request(app).delete(
      `/api/v1/commodities/${created.data.id}`,
    );
    const body = deleteResponse.body as ISuccessResponseOutput<{
      success: boolean;
      id: string;
    }>;

    expect(deleteResponse.status).toBe(200);
    expect(body.data.success).toBe(true);

    const getResponse = await request(app).get(
      `/api/v1/commodities/${created.data.id}`,
    );
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /api/v1/commodities/:id rejects referenced commodity with 400', async () => {
    const app = createApp();
    const createResponse = await request(app).post('/api/v1/commodities').send({
      name: 'Cocoa',
      unit: 'KG',
    });
    const created = createResponse.body as ISuccessResponseOutput<ICommodityOutput>;
    inMemoryCommodityRepository.markReferenced(created.data.id);

    const deleteResponse = await request(app).delete(
      `/api/v1/commodities/${created.data.id}`,
    );
    const body = deleteResponse.body as { success: boolean; message: string };

    expect(deleteResponse.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Cannot delete commodity referenced by farms or batches');

    const getResponse = await request(app).get(
      `/api/v1/commodities/${created.data.id}`,
    );
    expect(getResponse.status).toBe(200);
  });
});
