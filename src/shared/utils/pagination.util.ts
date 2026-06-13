import { z } from 'zod';

import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@/shared/constants';

/** Query string pagination input from list endpoints. */
export interface IPaginationQueryInput {
  page?: string;
  limit?: string;
}

/** Parsed and validated pagination parameters. */
export interface IPaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Metadata returned alongside paginated collections. */
export interface IPaginationMetadataOutput {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Paginated collection result wrapper. */
export interface IPaginatedResultOutput<T> {
  data: T[];
  pagination: IPaginationMetadataOutput;
}

/** Zod schema for validating pagination query parameters on routes. */
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : DEFAULT_PAGE)),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : DEFAULT_PAGE_LIMIT)),
  }),
});

/**
 * Parses and validates pagination query parameters with safe defaults and caps.
 */
export const parsePaginationParams = (
  queryInput: IPaginationQueryInput = {},
): IPaginationParams => {
  const parsedPage = queryInput.page
    ? Number.parseInt(queryInput.page, 10)
    : DEFAULT_PAGE;
  const parsedLimit = queryInput.limit
    ? Number.parseInt(queryInput.limit, 10)
    : DEFAULT_PAGE_LIMIT;

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const rawLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_PAGE_LIMIT;
  const limit = Math.min(rawLimit, MAX_PAGE_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds pagination metadata from a total count and parsed params.
 */
export const createPaginationMetadata = (
  total: number,
  params: IPaginationParams,
): IPaginationMetadataOutput => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
};

/**
 * Wraps a data slice with pagination metadata for list responses.
 */
export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  params: IPaginationParams,
): IPaginatedResultOutput<T> => ({
  data,
  pagination: createPaginationMetadata(total, params),
});
