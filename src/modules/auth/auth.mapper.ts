import { User } from '@prisma/client';

import { IUserOutput } from './auth.interface';

/**
 * Maps a Prisma User entity to a public IUserOutput DTO.
 */
export const mapUserToOutput = (userInput: User): IUserOutput => ({
  id: userInput.id,
  email: userInput.email,
  firstName: userInput.firstName,
  lastName: userInput.lastName,
  role: userInput.role,
  createdAt: userInput.createdAt.toISOString(),
  updatedAt: userInput.updatedAt.toISOString(),
});
