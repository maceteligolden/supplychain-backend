import { z } from 'zod';

/** Zod schema for farm id route param on nested assessment routes. */
export const farmParentParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

/** Zod schema for farm and assessment id route params. */
export const farmAssessmentIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
    assessmentId: z.string().trim().min(1),
  }),
});
