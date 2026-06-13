/** Default HTTP port when PORT env var is not set. */
export const DEFAULT_PORT = 5009;

/** Default API version prefix segment. */
export const DEFAULT_API_VERSION = 'v1';

/** Default page number for paginated list endpoints. */
export const DEFAULT_PAGE = 1;

/** Default page size for paginated list endpoints. */
export const DEFAULT_PAGE_LIMIT = 10;

/** Maximum allowed page size for paginated list endpoints. */
export const MAX_PAGE_LIMIT = 100;

/** Database connection timeout in milliseconds. */
export const DATABASE_CONNECTION_TIMEOUT_MS = 5000;

/** Graceful shutdown signal names handled by the server bootstrap. */
export const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'] as const;
