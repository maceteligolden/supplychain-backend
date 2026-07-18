/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommodityRepository } from '@/modules/commodities/commodity.repository';
import { CommodityService } from '@/modules/commodities/commodity.service';
import { InventoryCodeRepository } from '@/modules/inventory-codes';
import { BadRequestError, NotFoundError } from '@/shared/errors';

const mockDocument = {
  id: 'commodity-1',
  name: 'Cocoa',
  code: 'COM-2026-0001',
  imageUrl: '',
  unit: 'KG' as const,
  createdAt: new Date('2025-01-10T08:00:00.000Z'),
  updatedAt: new Date('2025-01-10T08:00:00.000Z'),
};

describe('CommodityService', () => {
  let mockCommodityRepository: CommodityRepository;
  let mockInventoryCodeRepository: InventoryCodeRepository;
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

    mockInventoryCodeRepository = {
      allocateNextCode: vi.fn(),
    };

    commodityService = new CommodityService(
      mockCommodityRepository,
      mockInventoryCodeRepository,
    );
  });

  it('listCommodities returns mapped commodities and total', async () => {
    vi.mocked(mockCommodityRepository.findAll).mockResolvedValue([mockDocument]);
    vi.mocked(mockCommodityRepository.countAll).mockResolvedValue(1);

    const output = await commodityService.listCommodities();

    expect(output.total).toBe(1);
    expect(output.commodities).toHaveLength(1);
    expect(output.commodities[0]?.code).toBe('COM-2026-0001');
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

  it('createCommodity allocates a server inventory code', async () => {
    vi.mocked(mockInventoryCodeRepository.allocateNextCode).mockResolvedValue(
      'COM-2026-0001',
    );
    vi.mocked(mockCommodityRepository.create).mockResolvedValue(mockDocument);

    const output = await commodityService.createCommodity({
      name: 'Cocoa',
      unit: 'KG',
    });

    expect(mockInventoryCodeRepository.allocateNextCode).toHaveBeenCalledWith('COM');
    expect(mockCommodityRepository.create).toHaveBeenCalledWith({
      name: 'Cocoa',
      code: 'COM-2026-0001',
      unit: 'KG',
      imageUrl: '',
    });
    expect(output.code).toBe('COM-2026-0001');
  });

  it('updateCommodity updates fields when commodity exists', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(mockDocument);
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
      unit: undefined,
      imageUrl: undefined,
    });
  });

  it('updateCommodity rejects empty payloads', async () => {
    vi.mocked(mockCommodityRepository.findById).mockResolvedValue(mockDocument);

    await expect(
      commodityService.updateCommodity(mockDocument.id, {}),
    ).rejects.toBeInstanceOf(BadRequestError);
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
