import { z } from 'zod';

import { FARM_STATUSES } from '@/shared/constants';

const farmStatusSchema = z.enum(FARM_STATUSES);

const farmOwnerBodySchema = z.object({
  firstName: z.string().trim().max(100).default(''),
  lastName: z.string().trim().max(100).default(''),
  phone: z.string().trim().max(30).default(''),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Invalid email address',
    })
    .default(''),
});

const updateFarmOwnerBodySchema = z.object({
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Invalid email address',
    })
    .optional(),
});

const farmLocationBodySchema = z.object({
  country: z.string().trim().max(100).default(''),
  region: z.string().trim().max(100).default(''),
  city: z.string().trim().max(100).default(''),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateFarmLocationBodySchema = z.object({
  country: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/** Zod schema for create farm request body. */
export const createFarmBodySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    status: farmStatusSchema.optional(),
    owner: farmOwnerBodySchema.default({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    }),
    commodityIds: z.array(z.string().trim().min(1)).min(1),
    location: farmLocationBodySchema.default({
      country: '',
      region: '',
      city: '',
    }),
    annualProductionEstimateKg: z.number().positive().optional(),
    areaHectares: z.number().positive().optional(),
    declarationAccepted: z.boolean().default(false),
  }),
});

/** Zod schema for update farm request body. */
export const updateFarmBodySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      status: farmStatusSchema.optional(),
      owner: updateFarmOwnerBodySchema.optional(),
      commodityIds: z.array(z.string().trim().min(1)).min(1).optional(),
      location: updateFarmLocationBodySchema.optional(),
      annualProductionEstimateKg: z.number().positive().nullable().optional(),
      areaHectares: z.number().positive().nullable().optional(),
      declarationAccepted: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

/** Zod schema for farm id route param. */
export const farmIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
