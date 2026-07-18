import { z } from 'zod';

import { ISO_DATE_PATTERN } from '@/shared/constants';

const harvestDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_PATTERN, { message: 'Harvest date must be YYYY-MM-DD' });

/** Zod schema for list batches query — farmId is required. */
export const listBatchesQuerySchema = z.object({
  query: z.object({
    farmId: z.string().trim().min(1),
  }),
});

/** Zod schema for create batch request body. */
export const createBatchBodySchema = z.object({
  body: z.object({
    farmId: z.string().trim().min(1),
    harvestDate: harvestDateSchema,
    quantity: z.number().positive(),
    commodityId: z.string().trim().min(1).optional(),
  }),
});

/** Zod schema for update batch request body. */
export const updateBatchBodySchema = z.object({
  body: z
    .object({
      harvestDate: harvestDateSchema.optional(),
      quantity: z.number().positive().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for batch id route param. */
export const batchIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
