import { z } from 'zod';

/** Zod schema for farm id route param on nested boundary routes. */
export const farmParentParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

export const upsertFarmBoundaryBodySchema = z.object({
  body: z.object({
    coordinates: z
      .array(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
      )
      .min(3),
  }),
});

export type UpsertFarmBoundaryBody = z.infer<typeof upsertFarmBoundaryBodySchema>;
