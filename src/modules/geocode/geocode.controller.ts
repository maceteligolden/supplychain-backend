import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { NominatimClient } from '@/shared/integrations/nominatim.client';
import { BadRequestError, NotFoundError } from '@/shared/errors';
import { ResponseUtil } from '@/shared/utils';

/**
 * GeocodeController handles free-text address lookup for map centering.
 */
@injectable()
export class GeocodeController {
  constructor(
    @inject(NominatimClient) private readonly nominatimClient: NominatimClient,
  ) {}

  /** Handles GET /geocode?q=… — Nigeria-biased autocomplete suggestions. */
  geocode = async (request: Request, response: Response): Promise<void> => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';

    if (!query) {
      throw new BadRequestError('Query parameter "q" is required');
    }

    const limitRaw =
      typeof request.query.limit === 'string'
        ? Number.parseInt(request.query.limit, 10)
        : 5;
    const limit = Number.isFinite(limitRaw) ? limitRaw : 5;

    const results = await this.nominatimClient.searchQuery(query, {
      countrycodes: 'ng',
      limit,
    });

    if (results.length === 0) {
      throw new NotFoundError('Could not geocode address');
    }

    const first = results[0];

    ResponseUtil.success(response, {
      latitude: first?.latitude,
      longitude: first?.longitude,
      displayName: first?.displayName,
      results,
    });
  };
}
