import 'reflect-metadata';
import 'dotenv/config';

import { container } from 'tsyringe';

import { FarmAssessmentService } from '@/modules/farm-assessments/farm-assessment.service';
import { ENV } from '@/shared/constants';
import { connectDatabases, disconnectDatabases } from '@/shared/database';
import { setupDependencyContainer } from '@/shared/container';
import { createChildLogger } from '@/shared/utils';

const workerLogger = createChildLogger('assessment-worker');

async function runWorkerLoop(): Promise<void> {
  setupDependencyContainer();
  await connectDatabases();

  const farmAssessmentService = container.resolve(FarmAssessmentService);

  workerLogger.info('Assessment worker started');

  const interval = setInterval(() => {
    farmAssessmentService
      .processPendingAssessments()
      .then((count) => {
        if (count > 0) {
          workerLogger.info({ count }, 'Processed pending assessments');
        }
      })
      .catch((error: unknown) => {
        workerLogger.error({ err: error }, 'Assessment worker tick failed');
      });
  }, ENV.ASSESSMENT_WORKER_POLL_MS);

  const shutdown = async (): Promise<void> => {
    clearInterval(interval);
    await disconnectDatabases();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

if (ENV.ASSESSMENT_WORKER_ENABLED) {
  runWorkerLoop().catch((error: unknown) => {
    workerLogger.error({ err: error }, 'Assessment worker failed to start');
    process.exit(1);
  });
} else {
  workerLogger.warn('ASSESSMENT_WORKER_ENABLED is false — exiting');
  process.exit(0);
}
