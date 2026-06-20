import { z } from 'zod';

import { SUPPLY_CHAIN_CODE_PATTERN, SUPPLY_CHAIN_STATUSES } from '@/shared/constants';

const supplyChainStatusSchema = z.enum(SUPPLY_CHAIN_STATUSES);

const supplyChainCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2)
  .max(50)
  .regex(SUPPLY_CHAIN_CODE_PATTERN, {
    message: 'Code must contain only uppercase letters, numbers, and underscores',
  });

const allocationItemSchema = z.object({
  batchId: z.string().trim().min(1),
  quantity: z.number().positive(),
});

/** Zod schema for create supply chain request body. */
export const createSupplyChainBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    code: supplyChainCodeSchema,
    description: z.string().trim().max(500).optional(),
    status: supplyChainStatusSchema,
    commodityId: z.string().trim().min(1).optional(),
    allocations: z.array(allocationItemSchema).optional(),
  }),
});

/** Zod schema for update supply chain request body. */
export const updateSupplyChainBodySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      code: supplyChainCodeSchema.optional(),
      description: z.string().trim().max(500).optional(),
      status: supplyChainStatusSchema.optional(),
      commodityId: z.string().trim().min(1).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for supply chain id route param. */
export const supplyChainIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

/** Zod schema for sync supply chain allocations request body. */
export const syncSupplyChainAllocationsBodySchema = z.object({
  body: z.object({
    allocations: z.array(allocationItemSchema),
  }),
});
