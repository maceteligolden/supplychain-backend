/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActorRepository } from '@/modules/actors/actor.repository';
import { ActorService } from '@/modules/actors/actor.service';
import { BadRequestError, NotFoundError } from '@/shared/errors';

const mockRecord = {
  id: 'actor-1',
  name: 'Kumasi Collection Centre',
  code: 'KUMASI_COLLECTION_CENTRE',
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

    actorService = new ActorService(mockActorRepository);
  });

  it('listActors returns mapped actors and total', async () => {
    vi.mocked(mockActorRepository.findAll).mockResolvedValue([mockRecord]);
    vi.mocked(mockActorRepository.countAll).mockResolvedValue(1);

    const output = await actorService.listActors();

    expect(output.total).toBe(1);
    expect(output.actors).toHaveLength(1);
    expect(output.actors[0]?.code).toBe('KUMASI_COLLECTION_CENTRE');
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

  it('createActor creates with normalized code', async () => {
    vi.mocked(mockActorRepository.findByCode).mockResolvedValue(null);
    vi.mocked(mockActorRepository.create).mockResolvedValue(mockRecord);

    const output = await actorService.createActor({
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

    expect(mockActorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'KUMASI_COLLECTION_CENTRE' }),
    );
    expect(output.code).toBe('KUMASI_COLLECTION_CENTRE');
  });

  it('createActor rejects duplicate code', async () => {
    vi.mocked(mockActorRepository.findByCode).mockResolvedValue(mockRecord);

    await expect(
      actorService.createActor({
        name: 'Duplicate',
        code: 'KUMASI_COLLECTION_CENTRE',
        type: 'PROCESSOR',
        address: {
          city: 'Accra',
          region: 'Greater Accra',
          country: 'Ghana',
        },
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
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
