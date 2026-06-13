import 'reflect-metadata';
import 'dotenv/config';

import { createApp } from './app';
import {
  bootstrapServer,
  disconnectDatabases,
  ENV,
  logger,
  registerShutdownHandlers,
} from './shared';

const app = createApp();

bootstrapServer(() => {
  app.listen(ENV.PORT, () => {
    logger.info(
      {
        port: ENV.PORT,
        environment: ENV.NODE_ENV,
        docsUrl: `http://localhost:${ENV.PORT}/api-docs`,
      },
      'Server started',
    );
  });
}).catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

registerShutdownHandlers(async () => {
  await disconnectDatabases();
});
