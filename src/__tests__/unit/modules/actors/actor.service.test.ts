/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActorRepository } from '@/modules/actors/actor.repository';
import { ActorService } from '@/modules/actors/actor.service';
import { InventoryCodeRepository } from '@/modules/inventory-codes';
import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';
import { BadRequestError, NotFoundError } from '@/shared/errors';

const mockRecord = {
  id: 'actor-1',
  name: 'Kumasi Collection Centre',
  code: 'ACT-2026-0001',
  type: 'COLLECTION_CENTRE' as const,
  addressLine1: 'Plot 12, Industrial Area',
  addressCity: 'Kumasi',
  addressRegion: 'Ashanti',
  addressCountry: 'Ghana',
  status: 'ACTIVE' as const,
  createdAt: new Date('2025-01-10T08:00:00.000Z'),
  updatedAt: new Date('2025-01-10T08:00:00.000Z'),
};

describe('ActorService', () => {
  let mockActorRepository: ActorRepository;
  let mockSupplyChainEventRepository: SupplyChainEventRepository;
  let mockSupplyChainRepository: SupplyChainRepository;
  let mockInventoryCodeRepository: InventoryCodeRepository;
  let actorService: ActorService;

  beforeEach(() => {
    mockActorRepository = {
      findAll: vi.fn(),
      countAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      isReferencedByEvents: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    mockSupplyChainEventRepository = {
      findByActorId: vi.fn().mockResolvedValue([]),
    } as unknown as SupplyChainEventRepository;

    mockSupplyChainRepository = {
      findById: vi.fn(),
    } as unknown as SupplyChainRepository;

    mockInventoryCodeRepository = {
      allocateNextCode: vi.fn().mockResolvedValue('ACT-2026-0001'),
    };

    actorService = new ActorService(
      mockActorRepository,
      mockSupplyChainEventRepository,
      mockSupplyChainRepository,
      mockInventoryCodeRepository,
    );
  });

  it('listActors returns mapped actors and total', async () => {
    vi.mocked(mockActorRepository.findAll).mockResolvedValue([mockRecord]);
    vi.mocked(mockActorRepository.countAll).mockResolvedValue(1);

    const output = await actorService.listActors();

    expect(output.total).toBe(1);
    expect(output.actors).toHaveLength(1);
    expect(output.actors[0]?.code).toBe('ACT-2026-0001');
  });

  it('getActorById returns actor when found', async () => {
    vi.mocked(mockActorRepository.findById).mockResolvedValue(mockRecord);

    const output = await actorService.getActorById(mockRecord.id);

    expect(output.id).toBe('actor-1');
    expect(output.address.city).toBe('Kumasi');
  });

  it('getActorById throws when not found', async () => {
    vi.mocked(mockActorRepository.findById).mockResolvedValue(null);

    await expect(actorService.getActorById('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('getActorInvolvement returns empty events until supply chain module exists', async () => {
    vi.mocked(mockActorRepository.findById).mockResolvedValue(mockRecord);

    const output = await actorService.getActorInvolvement(mockRecord.id);

    expect(output.actor.id).toBe(mockRecord.id);
    expect(output.events).toEqual([]);
    expect(output.stats.eventCount).toBe(0);
  });

  it('createActor allocates a server inventory code', async () => {
    vi.mocked(mockActorRepository.create).mockResolvedValue(mockRecord);

    const output = await actorService.createActor({
      name: 'Kumasi Collection Centre',
      type: 'COLLECTION_CENTRE',
      address: {
        city: 'Kumasi',
        region: 'Ashanti',
        country: 'Ghana',
      },
      status: 'ACTIVE',
    });

    expect(mockInventoryCodeRepository.allocateNextCode).toHaveBeenCalledWith('ACT');
    expect(mockActorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ACT-2026-0001' }),
    );
    expect(output.code).toBe('ACT-2026-0001');
  });

  it('deleteActor blocks when referenced by events', async () => {
    vi.mocked(mockActorRepository.findById).mockResolvedValue(mockRecord);
    vi.mocked(mockActorRepository.isReferencedByEvents).mockResolvedValue(true);

    await expect(actorService.deleteActor(mockRecord.id)).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('deleteActor returns success payload', async () => {
    vi.mocked(mockActorRepository.findById).mockResolvedValue(mockRecord);
    vi.mocked(mockActorRepository.isReferencedByEvents).mockResolvedValue(false);
    vi.mocked(mockActorRepository.deleteById).mockResolvedValue(true);

    const output = await actorService.deleteActor(mockRecord.id);

    expect(output).toEqual({ success: true, id: mockRecord.id });
  });
});
