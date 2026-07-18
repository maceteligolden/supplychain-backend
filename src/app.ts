import 'reflect-metadata';
import 'dotenv/config';

import path from 'path';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { createActorRoutes } from '@/modules/actors';
import { createAuthRoutes } from '@/modules/auth';
import { createBatchAllocationRoutes } from '@/modules/batch-allocations';
import { createBatchRoutes } from '@/modules/batches';
import { createDashboardRoutes } from '@/modules/dashboard/dashboard.index';
import { createCommodityRoutes } from '@/modules/commodities';
import { createFarmRoutes } from '@/modules/farms';
import { createGeocodeRoutes } from '@/modules/geocode';
import { createSupplyChainRoutes } from '@/modules/supply-chains';
import { createHealthRoutes } from '@/modules/health';
import {
  ENV,
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
  requestLoggerMiddleware,
  setupDependencyContainer,
  swaggerSpec,
} from '@/shared';
import { ensureCommodityUploadDirectory } from '@/modules/commodities/commodity.storage';

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
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  ensureCommodityUploadDirectory();
  app.use('/uploads', express.static(path.resolve(ENV.UPLOAD_DIR)));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/health', createHealthRoutes());

  const apiBasePath = `/api/${ENV.API_VERSION}`;
  app.use(`${apiBasePath}/health`, createHealthRoutes());
  app.use(`${apiBasePath}/auth`, createAuthRoutes());
  app.use(`${apiBasePath}/commodities`, createCommodityRoutes());
  app.use(`${apiBasePath}/actors`, createActorRoutes());
  app.use(`${apiBasePath}/farms`, createFarmRoutes());
  app.use(`${apiBasePath}/batches`, createBatchRoutes());
  app.use(`${apiBasePath}/batch-allocations`, createBatchAllocationRoutes());
  app.use(`${apiBasePath}/supply-chains`, createSupplyChainRoutes());
  app.use(`${apiBasePath}/dashboard`, createDashboardRoutes());
  app.use(`${apiBasePath}/geocode`, createGeocodeRoutes());

  app.use(notFoundHandlerMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};
