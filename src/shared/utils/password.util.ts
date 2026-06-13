import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '@/shared/constants';

/**
 * Hashes a plaintext password using bcrypt.
 */
export const hashPassword = async (plainPasswordInput: string): Promise<string> =>
  bcrypt.hash(plainPasswordInput, BCRYPT_SALT_ROUNDS);

/**
 * Compares a plaintext password against a bcrypt hash.
 */
export const comparePassword = async (
  plainPasswordInput: string,
  passwordHashInput: string,
): Promise<boolean> => bcrypt.compare(plainPasswordInput, passwordHashInput);
