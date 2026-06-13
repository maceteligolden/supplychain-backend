import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Keep in sync with `src/shared/constants/auth.constants.ts`. */
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_SUPER_ADMIN_EMAIL = 'john@example.com';
const DEFAULT_SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';
const DEFAULT_SUPER_ADMIN_FIRST_NAME = 'John';
const DEFAULT_SUPER_ADMIN_LAST_NAME = 'Doe';

/**
 * Idempotently seeds the default Super Admin user for development and testing.
 * Reads env vars directly so the script works in Docker (no `src/` in the image).
 */
async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL ?? DEFAULT_SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD ?? DEFAULT_SUPER_ADMIN_PASSWORD;
  const firstName =
    process.env.SUPER_ADMIN_FIRST_NAME ?? DEFAULT_SUPER_ADMIN_FIRST_NAME;
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? DEFAULT_SUPER_ADMIN_LAST_NAME;

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
    },
  });
}

seedSuperAdmin()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed: default superadmin ready');
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
