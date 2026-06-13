/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommodityRepository } from '@/modules/commodities/commodity.repository';
import { CommodityService } from '@/modules/commodities/commodity.service';
import { BadRequestError, NotFoundError } from '@/shared/errors';

const mockDocument = {
  id: 'commodity-1',
  name: 'Cocoa',
  code: 'COCOA',
  imageUrl: '',
  unit: 'KG' as const,
  createdAt: new Date('2025-01-10T08:00:00.000Z'),
  updatedAt: new Date('2025-01-10T08:00:00.000Z'),
};

describe('CommodityService', () => {
  let mockCommodityRepository: CommodityRepository;
  let commodityService: CommodityService;

  beforeEach(() => {
    mockCommodityRepository = {
      findAll: vi.fn(),
      countAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    commodityService = new CommodityService(mockCommodityRepository);
  });

  it('listCommodities returns mapped commodities and total', async () => {
    vi.mocked(mockCommodityRepository.findAll).mockResolvedValue([mockDocument]);
    vi.mocked(mockCommodityRepository.countAll).mockResolvedValue(1);

    const output = await commodityService.listCommodities();

    expect(output.total).toBe(1);
    expect(output.commodities).toHaveLength(1);
    expect(output.commodities[0]?.code).toBe('COCOA');
  });

  it('getCommodityById returns commodity when found', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(mockDocument);

    const output = await commodityService.getCommodityById(mockDocument.id);

    expect(output.id).toBe(mockDocument.id);
    expect(output.name).toBe('Cocoa');
  });

  it('getCommodityById throws when not found', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(null);

    await expect(commodityService.getCommodityById('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('createCommodity creates with normalized code and image URL', async () => {
    vi.mocked(mockCommodityRepository.findByCode).mockResolvedValue(null);
    vi.mocked(mockCommodityRepository.create).mockResolvedValue(mockDocument);

    const output = await commodityService.createCommodity({
      name: 'Cocoa',
      code: 'cocoa',
      unit: 'KG',
    });

    expect(mockCommodityRepository.create).toHaveBeenCalledWith({
      name: 'Cocoa',
      code: 'COCOA',
      unit: 'KG',
      imageUrl: '',
    });
    expect(output.code).toBe('COCOA');
  });

  it('createCommodity rejects duplicate code', async () => {
    vi.mocked(mockCommodityRepository.findByCode).mockResolvedValue(mockDocument);

    await expect(
      commodityService.createCommodity({
        name: 'Duplicate',
        code: 'COCOA',
        unit: 'KG',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('updateCommodity updates fields when commodity exists', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(mockDocument);
    vi.mocked(mockCommodityRepository.findByCode).mockResolvedValue(null);
    vi.mocked(mockCommodityRepository.updateById).mockResolvedValue({
      ...mockDocument,
      name: 'Premium Cocoa',
    });

    const output = await commodityService.updateCommodity(mockDocument.id, {
      name: 'Premium Cocoa',
    });

    expect(output.name).toBe('Premium Cocoa');
    expect(mockCommodityRepository.updateById).toHaveBeenCalledWith(mockDocument.id, {
      name: 'Premium Cocoa',
      code: undefined,
      unit: undefined,
      imageUrl: undefined,
    });
  });

  it('deleteCommodity returns success payload', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(mockDocument);
    vi.mocked(mockCommodityRepository.deleteById).mockResolvedValue(true);

    const output = await commodityService.deleteCommodity(mockDocument.id);

    expect(output).toEqual({ success: true, id: mockDocument.id });
  });

  it('deleteCommodity throws when not found', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(null);

    await expect(commodityService.deleteCommodity('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
