import { z } from 'zod';

/** Zod schema for create batch allocation request body. */
export const createAllocationBodySchema = z.object({
  body: z.object({
    batchId: z.string().trim().min(1),
    supplyChainId: z.string().trim().min(1),
    quantity: z.number().positive(),
    allocatedAt: z.string().trim().datetime().optional(),
  }),
});

/** Zod schema for update batch allocation request body. */
export const updateAllocationBodySchema = z.object({
  body: z
    .object({
      quantity: z.number().positive().optional(),
      allocatedAt: z.string().trim().datetime().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for batch allocation id route param. */
export const allocationIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

/** Zod schema for list batch allocations query — exactly one of farmId or supplyChainId. */
export const listAllocationsQuerySchema = z.object({
  query: z
    .object({
      farmId: z.string().trim().min(1).optional(),
      supplyChainId: z.string().trim().min(1).optional(),
    })
    .refine((query) => Boolean(query.farmId) !== Boolean(query.supplyChainId), {
      message: 'Provide either farmId or supplyChainId, not both or neither',
    }),
});

export type ListAllocationsQuery = z.infer<typeof listAllocationsQuerySchema>['query'];
