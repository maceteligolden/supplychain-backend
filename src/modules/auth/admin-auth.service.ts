import { inject, injectable } from 'tsyringe';

import { UnauthorizedError } from '@/shared/errors';
import { comparePassword } from '@/shared/utils/password.util';
import {
  generateOpaqueRefreshToken,
  getRefreshTokenExpiryDate,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '@/shared/utils/jwt.util';

import {
  IAuthSessionResultOutput,
  IAuthUserOutput,
  ILoginInput,
  ILogoutOutput,
  IUserOutput,
} from './auth.interface';
import { mapUserToOutput } from './auth.mapper';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserRepository } from './user.repository';

/**
 * AdminAuthService handles Super Admin authentication flows.
 */
@injectable()
export class AdminAuthService {
  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository,
    @inject(RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Validates credentials and issues a new access/refresh token pair.
   */
  async login(loginInput: ILoginInput): Promise<IAuthSessionResultOutput> {
    const user = await this.userRepository.findByEmail(loginInput.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(loginInput.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.issueTokenPair(mapUserToOutput(user));
  }

  /**
   * Rotates refresh token and issues a new access/refresh pair.
   */
  async refreshSession(refreshTokenInput: string): Promise<IAuthSessionResultOutput> {
    const tokenHash = hashRefreshToken(refreshTokenInput);
    const storedToken = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      await this.refreshTokenRepository.revokeAllForUser(storedToken.userId);
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.revokeById(storedToken.id);

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      await this.refreshTokenRepository.revokeAllForUser(storedToken.userId);
      throw new UnauthorizedError('Session user not found');
    }

    return this.issueTokenPair(mapUserToOutput(user));
  }

  /**
   * Returns the profile for an authenticated user id.
   */
  async getProfile(userIdInput: string): Promise<IUserOutput> {
    const user = await this.userRepository.findById(userIdInput);
    if (!user) {
      throw new UnauthorizedError('Session user not found');
    }

    return mapUserToOutput(user);
  }

  /**
   * Revokes refresh tokens and completes logout.
   */
  async logout(
    authUserInput: IAuthUserOutput,
    refreshTokenInput?: string,
  ): Promise<ILogoutOutput> {
    if (refreshTokenInput) {
      const tokenHash = hashRefreshToken(refreshTokenInput);
      const storedToken = await this.refreshTokenRepository.findActiveByHash(tokenHash);

      if (storedToken) {
        await this.refreshTokenRepository.revokeById(storedToken.id);
      }
    }

    await this.refreshTokenRepository.revokeAllForUser(authUserInput.userId);
    return { success: true };
  }

  /**
   * Verifies an access token and returns the authenticated user context.
   */
  verifyAccessToken(accessTokenInput: string): IAuthUserOutput {
    try {
      const payload = verifyAccessToken(accessTokenInput);
      return {
        userId: payload.sub,
        role: payload.role as IAuthUserOutput['role'],
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  /**
   * Creates access/refresh tokens and persists the refresh hash.
   */
  private async issueTokenPair(
    userOutput: IUserOutput,
  ): Promise<IAuthSessionResultOutput> {
    const refreshToken = generateOpaqueRefreshToken();
    const accessToken = signAccessToken({
      sub: userOutput.id,
      role: userOutput.role,
    });

    await this.refreshTokenRepository.create({
      userId: userOutput.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return {
      accessToken,
      refreshToken,
      user: userOutput,
    };
  }
}
