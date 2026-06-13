/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FarmRepository } from '@/modules/farms/farm.repository';
import { FarmService } from '@/modules/farms/farm.service';
import { BadRequestError, NotFoundError } from '@/shared/errors';

vi.mock('@/shared/database', () => ({
  prismaClient: {
    commodity: {
      findMany: vi.fn(),
    },
  },
}));

import { prismaClient } from '@/shared/database';

const mockRecord = {
  id: 'farm-1',
  name: 'Ashanti Cocoa Farm',
  code: 'ASHANTI_COCOA_FARM',
  status: 'DRAFT' as const,
  ownerFirstName: 'Kwame',
  ownerLastName: 'Mensah',
  ownerPhone: '+233201234567',
  ownerEmail: 'kwame@example.com',
  country: 'Ghana',
  region: 'Ashanti',
  city: 'Kumasi',
  latitude: 6.6885,
  longitude: -1.6244,
  annualProductionEstimateKg: 12000,
  areaHectares: 45,
  declarationAccepted: true,
  commodityIds: ['commodity-1'],
  createdAt: new Date('2025-01-10T08:00:00.000Z'),
  updatedAt: new Date('2025-01-10T08:00:00.000Z'),
};

describe('FarmService', () => {
  let mockFarmRepository: FarmRepository;
  let farmService: FarmService;

  beforeEach(() => {
    mockFarmRepository = {
      findAll: vi.fn(),
      countAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      isReferencedByBatches: vi.fn(),
      create: vi.fn(),
      setCommodities: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    farmService = new FarmService(mockFarmRepository);
    vi.mocked(prismaClient.commodity.findMany).mockResolvedValue([
      { id: 'commodity-1' },
    ] as Awaited<ReturnType<typeof prismaClient.commodity.findMany>>);
  });

  it('listFarms returns mapped farms and total', async () => {
    vi.mocked(mockFarmRepository.findAll).mockResolvedValue([mockRecord]);
    vi.mocked(mockFarmRepository.countAll).mockResolvedValue(1);

    const output = await farmService.listFarms();

    expect(output.total).toBe(1);
    expect(output.farms[0]?.code).toBe('ASHANTI_COCOA_FARM');
    expect(output.farms[0]?.owner.firstName).toBe('Kwame');
  });

  it('getFarmById throws when not found', async () => {
    vi.mocked(mockFarmRepository.findById).mockResolvedValue(null);

    await expect(farmService.getFarmById('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('createFarm normalizes code and links commodities', async () => {
    vi.mocked(mockFarmRepository.findByCode).mockResolvedValue(null);
    vi.mocked(mockFarmRepository.create).mockResolvedValue(mockRecord);
    vi.mocked(mockFarmRepository.findById).mockResolvedValue(mockRecord);

    const output = await farmService.createFarm({
      name: 'Ashanti Cocoa Farm',
      code: 'ashanti_cocoa_farm',
      commodityIds: ['commodity-1'],
      owner: {
        firstName: 'Kwame',
        lastName: 'Mensah',
        phone: '+233201234567',
        email: 'kwame@example.com',
      },
      location: {
        country: 'Ghana',
        region: 'Ashanti',
        city: 'Kumasi',
      },
      declarationAccepted: true,
    });

    expect(mockFarmRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ASHANTI_COCOA_FARM' }),
    );
    expect(mockFarmRepository.setCommodities).toHaveBeenCalledWith('farm-1', [
      'commodity-1',
    ]);
    expect(output.code).toBe('ASHANTI_COCOA_FARM');
  });

  it('createFarm rejects duplicate code', async () => {
    vi.mocked(mockFarmRepository.findByCode).mockResolvedValue(mockRecord);

    await expect(
      farmService.createFarm({
        name: 'Duplicate',
        code: 'ASHANTI_COCOA_FARM',
        commodityIds: ['commodity-1'],
        owner: { firstName: 'A', lastName: 'B', phone: '', email: '' },
        location: { country: 'Ghana', region: 'Ashanti', city: 'Kumasi' },
        declarationAccepted: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('deleteFarm blocks when referenced by batches', async () => {
    vi.mocked(mockFarmRepository.findById).mockResolvedValue(mockRecord);
    vi.mocked(mockFarmRepository.isReferencedByBatches).mockResolvedValue(true);

    await expect(farmService.deleteFarm(mockRecord.id)).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
