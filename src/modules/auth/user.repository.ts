import { User, UserRole } from '@prisma/client';
import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

/** Authenticated user profile without password hash. */
export interface IUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserRepository handles PostgreSQL access for platform users.
 */
@injectable()
export class UserRepository {
  /**
   * Finds a user by email address (case-insensitive).
   */
  async findByEmail(emailInput: string): Promise<User | null> {
    return prismaClient.user.findFirst({
      where: { email: { equals: emailInput, mode: 'insensitive' } },
    });
  }

  /**
   * Finds a user by primary key.
   */
  async findById(userIdInput: string): Promise<User | null> {
    return prismaClient.user.findUnique({ where: { id: userIdInput } });
  }
}
