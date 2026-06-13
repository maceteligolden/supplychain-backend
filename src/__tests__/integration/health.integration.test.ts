import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';
import { IHealthStatusOutput } from '@/modules/health';
import { ISuccessResponseOutput } from '@/shared/utils';

describe('Health API integration', () => {
  const app = createApp();

  it('GET /health returns service status', async () => {
    const response = await request(app).get('/health');
    const responseBody = response.body as ISuccessResponseOutput<IHealthStatusOutput>;

    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.status).toBe('ok');
  });
});
