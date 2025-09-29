/**
 * Temporal Worker Entry Point
 * This runs the worker process that executes workflows and activities
 */

import { startWorker } from '../infrastructure/temporal/TemporalWorker';

async function main() {
  console.log('========================================');
  console.log('  Freight Delay Notification Worker');
  console.log('========================================');
  console.log('');

  try {
    // Start the worker
    await startWorker();
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Received shutdown signal...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Received shutdown signal...');
  process.exit(0);
});

// Start the worker
main().catch((err) => {
  console.error('Unhandled error in worker:', err);
  process.exit(1);
});