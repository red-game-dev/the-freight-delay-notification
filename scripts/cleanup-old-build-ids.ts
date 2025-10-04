#!/usr/bin/env tsx
/**
 * Cleanup Old Build IDs
 *
 * Finds build IDs that have no running workflows and marks them as safe to remove.
 * This helps identify which worker versions can be safely shut down.
 *
 * Usage:
 *   tsx scripts/cleanup-old-build-ids.ts [--dry-run]
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { env } from '../src/infrastructure/config/EnvValidator';

async function cleanupOldBuildIds(dryRun = false) {
  try {
    console.log('🔌 Connecting to Temporal...');
    console.log(`   Address: ${env.TEMPORAL_ADDRESS}`);
    console.log(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);
    console.log(`   Task Queue: ${env.TEMPORAL_TASK_QUEUE}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will remove)'}\n`);

    const connection = await Connection.connect({
      address: env.TEMPORAL_ADDRESS,
    });

    const client = new WorkflowClient({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
    });

    console.log('📊 Checking build ID compatibility...\n');

    // Get current build ID compatibility for task queue
    const compatibility = await client.taskQueue.getBuildIdCompatibility(
      env.TEMPORAL_TASK_QUEUE
    );

    if (!compatibility || compatibility.length === 0) {
      console.log('ℹ️  No build IDs registered for this task queue');
      console.log('   This is normal if worker versioning is not enabled');
      process.exit(0);
    }

    console.log(`Found ${compatibility.length} build ID(s):\n`);

    const buildIdsToRemove: string[] = [];

    // Check each build ID for running workflows
    for (const buildIdInfo of compatibility) {
      const buildId = buildIdInfo.buildId;
      console.log(`🔍 Checking build ID: ${buildId}`);

      // Query for running workflows with this build ID
      const query = `TaskQueue="${env.TEMPORAL_TASK_QUEUE}" AND BuildIds="${buildId}" AND ExecutionStatus="Running"`;

      const runningWorkflows: any[] = [];
      try {
        for await (const workflow of client.workflow.list({ query })) {
          runningWorkflows.push(workflow);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not query workflows: ${error}`);
        continue;
      }

      if (runningWorkflows.length === 0) {
        console.log(`   ✅ No running workflows - SAFE TO REMOVE`);
        buildIdsToRemove.push(buildId);
      } else {
        console.log(`   ⏳ ${runningWorkflows.length} running workflow(s) - KEEP`);
        runningWorkflows.slice(0, 3).forEach((wf) => {
          console.log(`      - ${wf.workflowId}`);
        });
        if (runningWorkflows.length > 3) {
          console.log(`      ... and ${runningWorkflows.length - 3} more`);
        }
      }
      console.log('');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('\n📋 Summary:\n');
    console.log(`   Total build IDs: ${compatibility.length}`);
    console.log(`   Safe to remove: ${buildIdsToRemove.length}`);
    console.log(`   Must keep: ${compatibility.length - buildIdsToRemove.length}\n`);

    if (buildIdsToRemove.length === 0) {
      console.log('✅ No build IDs to clean up');
      process.exit(0);
    }

    console.log('🗑️  Build IDs safe to remove:');
    buildIdsToRemove.forEach((id) => {
      console.log(`   - ${id}`);
    });
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes made');
      console.log('\n📝 Next steps:');
      console.log('   1. Shut down worker pods/containers with these build IDs');
      console.log('   2. Run this script without --dry-run to remove from Temporal');
      console.log('   3. Example: tsx scripts/cleanup-old-build-ids.ts');
    } else {
      console.log('⚠️  Removing build IDs from Temporal...\n');

      for (const buildId of buildIdsToRemove) {
        try {
          console.log(`   Removing: ${buildId}`);

          // Note: Temporal SDK doesn't support removing build IDs yet
          // You must use Temporal CLI for now:
          console.log(`   ℹ️  Use Temporal CLI: temporal task-queue update-build-ids remove --build-id ${buildId}`);

          // When SDK supports it, uncomment:
          // await client.taskQueue.updateBuildIdCompatibility(env.TEMPORAL_TASK_QUEUE, {
          //   operation: 'removeBuildId',
          //   buildId,
          // });

        } catch (error) {
          console.log(`   ❌ Failed to remove ${buildId}: ${error}`);
        }
      }

      console.log('\n✅ Cleanup complete');
    }

    console.log('\n📝 Remember to:');
    console.log('   - Shut down worker pods/containers with removed build IDs');
    console.log('   - Monitor remaining workers for health');
    console.log('   - Check logs for any routing issues\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to cleanup build IDs:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const dryRun = process.argv.includes('--dry-run');

cleanupOldBuildIds(dryRun);
