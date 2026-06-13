/** httpOnly cookie name for the short-lived access JWT. */
export const ACCESS_COOKIE_NAME = 'sc_access';

/** httpOnly cookie name for the long-lived refresh token. */
export const REFRESH_COOKIE_NAME = 'sc_refresh';

/** bcrypt cost factor for password hashing. */
export const BCRYPT_SALT_ROUNDS = 12;

/** Default superadmin email seeded on setup. */
export const DEFAULT_SUPER_ADMIN_EMAIL = 'john@example.com';

/** Default superadmin password seeded on setup (development only). */
export const DEFAULT_SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';

/** Default superadmin first name for seed data. */
export const DEFAULT_SUPER_ADMIN_FIRST_NAME = 'John';

/** Default superadmin last name for seed data. */
export const DEFAULT_SUPER_ADMIN_LAST_NAME = 'Doe';

/** Refresh token TTL in days when env is not set. */
export const DEFAULT_REFRESH_TOKEN_DAYS = 7;
