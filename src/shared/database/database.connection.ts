import mongoose, { ConnectionStates } from 'mongoose';
import { PrismaClient } from '@prisma/client';

import { DATABASE_CONNECTION_TIMEOUT_MS, ENV, isDevelopment } from '@/shared/constants';
import { createChildLogger } from '@/shared/utils';

const databaseLogger = createChildLogger('database');

/** Singleton Prisma client for PostgreSQL access. */
export const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: ENV.DATABASE_URL,
    },
  },
});

/**
 * Connects to MongoDB with a timeout guard.
 */
export const connectMongoDatabase = async (): Promise<void> => {
  await Promise.race([
    mongoose.connect(ENV.MONGODB_URI),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('MongoDB connection timeout'));
      }, DATABASE_CONNECTION_TIMEOUT_MS);
    }),
  ]);

  databaseLogger.info('MongoDB connected');
};

/**
 * Connects to PostgreSQL via Prisma.
 */
export const connectPostgresDatabase = async (): Promise<void> => {
  await Promise.race([
    prismaClient.$connect(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('PostgreSQL connection timeout'));
      }, DATABASE_CONNECTION_TIMEOUT_MS);
    }),
  ]);

  databaseLogger.info('PostgreSQL connected');
};

/**
 * Connects all configured databases.
 */
export const connectDatabases = async (): Promise<void> => {
  await Promise.all([connectMongoDatabase(), connectPostgresDatabase()]);
};

/**
 * Gracefully closes database connections on shutdown.
 */
export const disconnectDatabases = async (): Promise<void> => {
  await Promise.all([
    mongoose.connection.readyState === ConnectionStates.connected
      ? mongoose.disconnect()
      : Promise.resolve(),
    prismaClient.$disconnect(),
  ]);
  databaseLogger.info('Database connections closed');
};

/**
 * Boots the API server after optional database connections.
 */
export const bootstrapServer = async (listen: () => void): Promise<void> => {
  try {
    await connectDatabases();
  } catch (error) {
    if (isDevelopment()) {
      databaseLogger.warn(
        { err: error },
        'Database connection failed; continuing in development mode',
      );
    } else {
      throw error;
    }
  }

  listen();
};

/**
 * Registers process signal handlers for graceful shutdown.
 */
export const registerShutdownHandlers = (
  shutdownCallback: () => Promise<void>,
): void => {
  const handleShutdown = (signal: string): void => {
    databaseLogger.info({ signal }, 'Shutdown signal received');
    shutdownCallback()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        databaseLogger.error({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};
