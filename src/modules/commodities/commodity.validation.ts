import { z } from 'zod';

import { COMMODITY_CODE_PATTERN, COMMODITY_UNITS } from '@/shared/constants';

const commodityUnitSchema = z.enum(COMMODITY_UNITS);

const commodityCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2)
  .max(50)
  .regex(COMMODITY_CODE_PATTERN, {
    message: 'Code must contain only uppercase letters, numbers, and underscores',
  });

/** Zod schema for create commodity request body. */
export const createCommodityBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    code: commodityCodeSchema,
    unit: commodityUnitSchema,
  }),
});

/** Zod schema for update commodity request body. */
export const updateCommodityBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: commodityCodeSchema.optional(),
    unit: commodityUnitSchema.optional(),
  }),
});

/** Zod schema for commodity id route param. */
export const commodityIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
