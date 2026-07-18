import { z } from 'zod';

import { ACTOR_STATUSES, ACTOR_TYPES } from '@/shared/constants';

const actorTypeSchema = z.enum(ACTOR_TYPES);
const actorStatusSchema = z.enum(ACTOR_STATUSES);

const actorAddressBodySchema = z.object({
  line1: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
});

const updateActorAddressBodySchema = z.object({
  line1: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  region: z.string().trim().min(1).max(100).optional(),
  country: z.string().trim().min(1).max(100).optional(),
});

/** Zod schema for create actor request body. */
export const createActorBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    type: actorTypeSchema,
    address: actorAddressBodySchema,
    status: actorStatusSchema,
  }),
});

/** Zod schema for update actor request body. */
export const updateActorBodySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      type: actorTypeSchema.optional(),
      address: updateActorAddressBodySchema.optional(),
      status: actorStatusSchema.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for actor id route param. */
export const actorIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
