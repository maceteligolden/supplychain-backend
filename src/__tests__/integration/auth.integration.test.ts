import { UserRole } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from 'tsyringe';

import { createApp } from '@/app';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';
import { IUserOutput } from '@/modules/auth/auth.interface';
import { RefreshTokenRepository } from '@/modules/auth/refresh-token.repository';
import { UserRepository } from '@/modules/auth/user.repository';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/shared/constants';
import { setupDependencyContainer } from '@/shared/container';
import { ISuccessResponseOutput } from '@/shared/utils';

const mockUser = {
  id: 'user-1',
  email: 'john@example.com',
  password: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.SUPER_ADMIN,
  createdAt: new Date('2025-01-15T08:00:00.000Z'),
  updatedAt: new Date('2025-01-15T08:00:00.000Z'),
};

describe('Auth API integration', () => {
  beforeEach(() => {
    container.clearInstances();
    setupDependencyContainer();

    const mockUserRepository = {
      findByEmail: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn().mockResolvedValue(mockUser),
    };

    const mockRefreshTokenRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
      }),
      findByHash: vi.fn(),
      findActiveByHash: vi.fn(),
      revokeById: vi.fn().mockResolvedValue(undefined),
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    };

    container.register(UserRepository, {
      useValue: mockUserRepository,
    });
    container.register(RefreshTokenRepository, {
      useValue: mockRefreshTokenRepository,
    });
    container.register(AdminAuthService, { useClass: AdminAuthService });
  });

  it('POST /api/v1/auth/login sets cookies and returns user', async () => {
    const comparePasswordModule = await import('@/shared/utils/password.util');
    vi.spyOn(comparePasswordModule, 'comparePassword').mockResolvedValue(true);

    const app = createApp();
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@example.com', password: 'SuperAdmin123!' });

    const responseBody = response.body as ISuccessResponseOutput<{ user: IUserOutput }>;

    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.user.email).toBe('john@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/v1/auth/me returns profile when access cookie is present', async () => {
    const comparePasswordModule = await import('@/shared/utils/password.util');
    vi.spyOn(comparePasswordModule, 'comparePassword').mockResolvedValue(true);

    const app = createApp();
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@example.com', password: 'SuperAdmin123!' });

    const rawCookies = loginResponse.headers['set-cookie'];
    const cookies = Array.isArray(rawCookies)
      ? rawCookies
      : rawCookies
        ? [rawCookies]
        : [];
    const meResponse = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);
    const meBody = meResponse.body as ISuccessResponseOutput<IUserOutput>;

    expect(meResponse.status).toBe(200);
    expect(meBody.data.email).toBe('john@example.com');
  });

  it('POST /api/v1/auth/logout clears auth cookies', async () => {
    const comparePasswordModule = await import('@/shared/utils/password.util');
    vi.spyOn(comparePasswordModule, 'comparePassword').mockResolvedValue(true);

    const app = createApp();
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@example.com', password: 'SuperAdmin123!' });

    const rawCookies = loginResponse.headers['set-cookie'];
    const cookies = Array.isArray(rawCookies)
      ? rawCookies
      : rawCookies
        ? [rawCookies]
        : [];
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies);
    const logoutBody = logoutResponse.body as ISuccessResponseOutput<{
      success: boolean;
    }>;

    expect(logoutResponse.status).toBe(200);
    expect(logoutBody.data.success).toBe(true);

    const clearedCookies = logoutResponse.headers['set-cookie'] ?? [];
    const clearedCookieHeader = Array.isArray(clearedCookies)
      ? clearedCookies.join(';')
      : clearedCookies;
    expect(clearedCookieHeader).toContain(ACCESS_COOKIE_NAME);
    expect(clearedCookieHeader).toContain(REFRESH_COOKIE_NAME);
  });
});
