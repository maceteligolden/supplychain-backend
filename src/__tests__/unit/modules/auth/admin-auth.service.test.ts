/* eslint-disable @typescript-eslint/unbound-method */
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAuthService } from '@/modules/auth/admin-auth.service';
import { RefreshTokenRepository } from '@/modules/auth/refresh-token.repository';
import { UserRepository } from '@/modules/auth/user.repository';

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

describe('AdminAuthService', () => {
  let mockUserRepository: UserRepository;
  let mockRefreshTokenRepository: RefreshTokenRepository;
  let adminAuthService: AdminAuthService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };

    mockRefreshTokenRepository = {
      create: vi.fn(),
      findByHash: vi.fn(),
      findActiveByHash: vi.fn(),
      revokeById: vi.fn(),
      revokeAllForUser: vi.fn(),
    };

    adminAuthService = new AdminAuthService(
      mockUserRepository,
      mockRefreshTokenRepository,
    );
  });

  it('login returns tokens for valid credentials', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(mockRefreshTokenRepository.create).mockResolvedValue({
      id: 'rt-1',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
    });

    const comparePasswordModule = await import('@/shared/utils/password.util');
    vi.spyOn(comparePasswordModule, 'comparePassword').mockResolvedValue(true);

    const authResult = await adminAuthService.login({
      email: 'john@example.com',
      password: 'SuperAdmin123!',
    });

    expect(authResult.user.email).toBe('john@example.com');
    expect(authResult.accessToken).toBeTruthy();
    expect(authResult.refreshToken).toBeTruthy();
    expect(mockRefreshTokenRepository.create).toHaveBeenCalledOnce();
  });

  it('login rejects invalid credentials', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    await expect(
      adminAuthService.login({ email: 'bad@example.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('refreshSession rotates tokens for valid refresh token', async () => {
    vi.mocked(mockRefreshTokenRepository.findByHash).mockResolvedValue({
      id: 'rt-1',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(mockRefreshTokenRepository.create).mockResolvedValue({
      id: 'rt-2',
      userId: mockUser.id,
      tokenHash: 'hash2',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
    });

    const authResult = await adminAuthService.refreshSession('valid-refresh-token');

    expect(authResult.user.id).toBe(mockUser.id);
    expect(mockRefreshTokenRepository.revokeById).toHaveBeenCalledWith('rt-1');
  });

  it('logout revokes all refresh tokens for user', async () => {
    const logoutOutput = await adminAuthService.logout({
      userId: mockUser.id,
      role: UserRole.SUPER_ADMIN,
    });

    expect(logoutOutput.success).toBe(true);
    expect(mockRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
      mockUser.id,
    );
  });
});
