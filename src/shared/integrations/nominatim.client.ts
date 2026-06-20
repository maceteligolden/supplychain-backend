import { injectable } from 'tsyringe';

import { ENV } from '@/shared/constants';

export type NominatimGeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

/**
 * NominatimClient geocodes addresses via OpenStreetMap Nominatim (backend-only).
 */
@injectable()
export class NominatimClient {
  /** Forward-geocodes a free-text query. */
  async geocodeQuery(query: string): Promise<NominatimGeocodeResult | null> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': ENV.NOMINATIM_USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const first = results[0];

    if (!first) {
      return null;
    }

    return {
      latitude: Number.parseFloat(first.lat),
      longitude: Number.parseFloat(first.lon),
      displayName: first.display_name,
    };
  }

  /** Geocodes structured farm location fields. */
  async geocodeFarmAddress(input: {
    city: string;
    region: string;
    country: string;
  }): Promise<NominatimGeocodeResult | null> {
    const query = [input.city, input.region, input.country].filter(Boolean).join(', ');
    return this.geocodeQuery(query);
  }
}
