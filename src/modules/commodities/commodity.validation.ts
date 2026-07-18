import { z } from 'zod';

import { COMMODITY_UNITS } from '@/shared/constants';

const commodityUnitSchema = z.enum(COMMODITY_UNITS);

/** Zod schema for create commodity request body. */
export const createCommodityBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    unit: commodityUnitSchema,
  }),
});

/** Zod schema for update commodity request body. */
export const updateCommodityBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    unit: commodityUnitSchema.optional(),
  }),
});

/** Zod schema for commodity id route param. */
export const commodityIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
