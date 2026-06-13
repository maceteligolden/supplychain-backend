import 'reflect-metadata';
import 'dotenv/config';

import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';

import { createHealthRoutes } from '@/modules/health';
import {
  ENV,
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
  requestLoggerMiddleware,
  setupDependencyContainer,
  swaggerSpec,
} from '@/shared';

setupDependencyContainer();

/**
 * Builds and configures the Express application.
 */
export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(mongoSanitize());

  const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(requestLoggerMiddleware);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/health', createHealthRoutes());

  const apiBasePath = `/api/${ENV.API_VERSION}`;
  app.use(`${apiBasePath}/health`, createHealthRoutes());

  app.use(notFoundHandlerMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};
