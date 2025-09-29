import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../../workflows/activities';
import { env } from '../config/EnvValidator';
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

    console.log('✅ Temporal worker created successfully');
    console.log(`   Task Queue: ${env.TEMPORAL_TASK_QUEUE}`);
    console.log(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);

    return worker;
  } catch (error) {
    console.error('❌ Failed to create Temporal worker:', error);
    throw new Error('Could not create Temporal worker');
  }
}

export async function startWorker(): Promise<void> {
  if (!worker) {
    worker = await createTemporalWorker();
  }

  console.log('🏃 Starting Temporal worker...');
  await worker.run();
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    console.log('🛑 Shutting down Temporal worker...');
    await worker.shutdown();
    worker = null;
    console.log('✅ Temporal worker stopped');
  }
}