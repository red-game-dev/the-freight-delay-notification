import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../../workflows/activities';
import { env } from '../config/EnvValidator';
import { logger } from '../../core/base/utils/Logger';
import { InfrastructureError } from '../../core/base/errors/BaseError';
import path from 'path';

let worker: Worker | null = null;

export async function createTemporalWorker(): Promise<Worker> {
  try {
    // Create connection to Temporal server
    const connection = await NativeConnection.connect({
      address: env.TEMPORAL_ADDRESS,
    });

    // Create worker with workflow and activity registrations
    worker = await Worker.create({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowsPath: path.resolve(__dirname, '../../workflows/workflows'),
      activities,
      // Worker configuration
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 5,
    });

    logger.info('✅ Temporal worker created successfully');
    logger.info(`   Task Queue: ${env.TEMPORAL_TASK_QUEUE}`);
    logger.info(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);

    return worker;
  } catch (error) {
    logger.error('❌ Failed to create Temporal worker:', error);
    throw new InfrastructureError('Could not create Temporal worker', { cause: error });
  }
}

export async function startWorker(): Promise<void> {
  if (!worker) {
    worker = await createTemporalWorker();
  }

  logger.info('🏃 Starting Temporal worker...');
  await worker.run();
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    logger.info('🛑 Shutting down Temporal worker...');
    await worker.shutdown();
    worker = null;
    logger.info('✅ Temporal worker stopped');
  }
}