import { z } from 'zod';

/** Zod schema for login request body validation. */
export const loginBodySchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

/** Zod schema for refresh request (cookie-based, no body required). */
export const refreshBodySchema = z.object({
  body: z.object({}).optional(),
});
