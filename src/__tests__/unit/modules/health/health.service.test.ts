import { describe, expect, it } from 'vitest';

import { HealthService } from '@/modules/health/health.service';

describe('HealthService', () => {
  it('returns ok status with timestamp', () => {
    const healthService = new HealthService();
    const healthStatusOutput = healthService.getHealthStatus();

    expect(healthStatusOutput.status).toBe('ok');
    expect(healthStatusOutput.message).toBe('Supply chain API is running');
    expect(() => new Date(healthStatusOutput.timestamp)).not.toThrow();
  });
});
