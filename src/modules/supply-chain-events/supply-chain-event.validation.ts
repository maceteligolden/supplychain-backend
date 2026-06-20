import { z } from 'zod';

import { SUPPLY_CHAIN_EVENT_TYPES } from '@/shared/constants';

const supplyChainEventTypeSchema = z.enum(SUPPLY_CHAIN_EVENT_TYPES);

/** Zod schema for supply chain id route param on nested event routes. */
export const supplyChainEventParentParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

/** Zod schema for create supply chain event request body. */
export const createSupplyChainEventBodySchema = z.object({
  body: z.object({
    type: supplyChainEventTypeSchema,
    occurredAt: z.string().trim().datetime(),
    actorId: z.string().trim().min(1),
    notes: z.string().trim().max(2000).optional(),
  }),
});

/** Zod schema for update supply chain event request body. */
export const updateSupplyChainEventBodySchema = z.object({
  body: z
    .object({
      notes: z.string().trim().max(2000).optional(),
      actorId: z.string().trim().min(1).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for event id route param. */
export const supplyChainEventIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
    eventId: z.string().trim().min(1),
  }),
});
