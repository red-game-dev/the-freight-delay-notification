#!/usr/bin/env tsx
/**
 * Set Default Build ID for Temporal Task Queue
 *
 * This script updates the default build ID for a task queue, which tells Temporal
 * to route all NEW workflows to workers with this build ID.
 *
 * Run this during deployment BEFORE starting new workers.
 *
 * Usage:
 *   tsx scripts/set-default-build-id.ts [build-id]
 *
 * If build-id is not provided, it will be auto-detected from git.
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { getBuildIdFromEnv } from '../src/infrastructure/temporal/BuildVersion';
import { env } from '../src/infrastructure/config/EnvValidator';

async function setDefaultBuildId(buildId?: string) {
  try {
    const actualBuildId = buildId || getBuildIdFromEnv();

    console.log('🔌 Connecting to Temporal...');
    console.log(`   Address: ${env.TEMPORAL_ADDRESS}`);
    console.log(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);

    const connection = await Connection.connect({
      address: env.TEMPORAL_ADDRESS,
    });

    const client = new WorkflowClient({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
    });

    console.log('\n🏗️  Setting default build ID:');
    console.log(`   Task Queue: ${env.TEMPORAL_TASK_QUEUE}`);
    console.log(`   Build ID: ${actualBuildId}`);

    // Update the task queue's default build ID
    // This tells Temporal to route NEW workflows to workers with this build ID
    await client.taskQueue.updateBuildIdCompatibility(env.TEMPORAL_TASK_QUEUE, {
      operation: 'addNewDefault',
      buildId: actualBuildId,
    });

    console.log('\n✅ Default build ID updated successfully');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy new worker pods/containers with this build ID');
    console.log('   2. New workflows will automatically route to new workers');
    console.log('   3. Old workflows continue on old workers');
    console.log('   4. Once old workflows complete, cleanup old workers');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to set default build ID:', error);
    console.error('\nTroubleshooting:');
    console.error('   - Ensure Temporal server is running');
    console.error('   - Check TEMPORAL_ADDRESS environment variable');
    console.error('   - Verify network connectivity to Temporal');
    process.exit(1);
  }
}

// Parse command line arguments
const buildIdArg = process.argv[2];

setDefaultBuildId(buildIdArg);
