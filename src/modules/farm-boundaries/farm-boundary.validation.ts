import { z } from 'zod';

import {
  MAX_BOUNDARY_PLOTS,
  MAX_RING_VERTICES,
  MIN_RING_VERTICES,
} from '@/shared/utils/polygon.util';

/** Zod schema for farm id route param on nested boundary routes. */
export const farmParentParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const ringSchema = z
  .array(coordinateSchema)
  .min(MIN_RING_VERTICES, `Each plot needs at least ${MIN_RING_VERTICES} vertices`)
  .max(MAX_RING_VERTICES, `Each plot allows at most ${MAX_RING_VERTICES} vertices`);

export const upsertFarmBoundaryBodySchema = z.object({
  body: z
    .object({
      coordinates: ringSchema.optional(),
      plots: z
        .array(ringSchema)
        .min(1)
        .max(MAX_BOUNDARY_PLOTS, `At most ${MAX_BOUNDARY_PLOTS} plots allowed`)
        .optional(),
    })
    .refine(
      (body) =>
        (body.plots !== undefined && body.plots.length > 0) ||
        (body.coordinates !== undefined &&
          body.coordinates.length >= MIN_RING_VERTICES),
      {
        message: 'Provide coordinates or plots for the farm boundary',
        path: ['coordinates'],
      },
    ),
});

export type UpsertFarmBoundaryBody = z.infer<typeof upsertFarmBoundaryBodySchema>;
