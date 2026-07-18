import { injectable } from 'tsyringe';

import { ENV } from '@/shared/constants';

export type NominatimGeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export type NominatimSearchOptions = {
  /** ISO 3166-1 alpha-2 country codes, comma-separated (e.g. "ng"). */
  countrycodes?: string;
  /** Max results (1–10). */
  limit?: number;
};

/**
 * NominatimClient geocodes addresses via OpenStreetMap Nominatim (backend-only).
 */
@injectable()
export class NominatimClient {
  /** Forward-geocodes a free-text query; returns multiple suggestions. */
  async searchQuery(
    query: string,
    options: NominatimSearchOptions = {},
  ): Promise<NominatimGeocodeResult[]> {
    const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('addressdetails', '0');

    if (options.countrycodes) {
      url.searchParams.set('countrycodes', options.countrycodes);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': ENV.NOMINATIM_USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    return results.map((item) => ({
      latitude: Number.parseFloat(item.lat),
      longitude: Number.parseFloat(item.lon),
      displayName: item.display_name,
    }));
  }

  /** Forward-geocodes a free-text query (best match). */
  async geocodeQuery(
    query: string,
    options: NominatimSearchOptions = {},
  ): Promise<NominatimGeocodeResult | null> {
    const results = await this.searchQuery(query, {
      ...options,
      limit: options.limit ?? 1,
    });
    return results[0] ?? null;
  }

  /** Geocodes structured farm location fields (Nigeria-biased). */
  async geocodeFarmAddress(input: {
    city: string;
    region: string;
    country: string;
  }): Promise<NominatimGeocodeResult | null> {
    const country = input.country?.trim() || 'Nigeria';
    const query = [input.city, input.region, country].filter(Boolean).join(', ');
    const countrycodes =
      country.toLowerCase().includes('nigeria') || country.toLowerCase() === 'ng'
        ? 'ng'
        : undefined;
    return this.geocodeQuery(query, { countrycodes });
  }
}
