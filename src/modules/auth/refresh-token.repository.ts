import { RefreshToken } from '@prisma/client';
import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

/** Input for creating a persisted refresh token row. */
export interface ICreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * RefreshTokenRepository manages hashed refresh tokens in PostgreSQL.
 */
@injectable()
export class RefreshTokenRepository {
  /**
   * Persists a new refresh token hash for a user.
   */
  async create(createInput: ICreateRefreshTokenInput): Promise<RefreshToken> {
    return prismaClient.refreshToken.create({
      data: {
        userId: createInput.userId,
        tokenHash: createInput.tokenHash,
        expiresAt: createInput.expiresAt,
      },
    });
  }

  /**
   * Finds a refresh token by hash regardless of revocation state.
   */
  async findByHash(tokenHashInput: string): Promise<RefreshToken | null> {
    return prismaClient.refreshToken.findUnique({
      where: { tokenHash: tokenHashInput },
    });
  }

  /**
   * Finds an active refresh token by its hash.
   */
  async findActiveByHash(tokenHashInput: string): Promise<RefreshToken | null> {
    return prismaClient.refreshToken.findFirst({
      where: {
        tokenHash: tokenHashInput,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Marks a refresh token as revoked.
   */
  async revokeById(refreshTokenIdInput: string): Promise<void> {
    await prismaClient.refreshToken.update({
      where: { id: refreshTokenIdInput },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all refresh tokens for a user (reuse detection).
   */
  async revokeAllForUser(userIdInput: string): Promise<void> {
    await prismaClient.refreshToken.updateMany({
      where: { userId: userIdInput, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
