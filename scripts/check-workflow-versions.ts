#!/usr/bin/env tsx
/**
 * Check which workflow versions can be safely cleaned up
 * Queries Temporal to see if old workflows are still running
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { WORKFLOW_VERSIONS, type WorkflowVersion } from '../src/workflows/versions';

async function checkVersionCleanup() {
  try {
    console.log('🔌 Connecting to Temporal at localhost:7233...\n');
    const connection = await Connection.connect({
      address: 'localhost:7233',
    });

    const client = new WorkflowClient({ connection });

    console.log('📊 Workflow Version Cleanup Status\n');
    console.log('='.repeat(80));

    for (const [key, version] of Object.entries(WORKFLOW_VERSIONS)) {
      if (version.status !== 'active') {
        console.log(`\n⏭️  SKIPPED: ${version.patchId} (status: ${version.status})`);
        continue;
      }

      console.log(`\n🔍 Checking: ${version.patchId}`);
      console.log(`   Added: ${version.addedDate}`);
      console.log(`   Can remove after: ${version.canRemoveAfter}`);
      console.log(`   Affects: ${version.workflows.join(', ')}`);
      console.log(`   Description: ${version.description}`);

      // Check for each affected workflow
      for (const workflowType of version.workflows) {
        console.log(`\n   Checking ${workflowType}...`);

        // Find workflows of this type that started BEFORE the version was added
        const query = `WorkflowType="${workflowType}" AND StartTime < "${version.addedDate}T00:00:00Z" AND ExecutionStatus="Running"`;

        try {
          const oldWorkflows: any[] = [];
          for await (const workflow of client.workflow.list({ query })) {
            oldWorkflows.push(workflow);
          }

          if (oldWorkflows.length === 0) {
            console.log(`   ✅ No old workflows running (safe to clean up!)`);
          } else {
            console.log(`   ⚠️  Found ${oldWorkflows.length} old workflows still running:`);
            oldWorkflows.slice(0, 5).forEach((wf) => {
              console.log(`      - ${wf.workflowId} (started ${wf.startTime})`);
            });
            if (oldWorkflows.length > 5) {
              console.log(`      ... and ${oldWorkflows.length - 5} more`);
            }
          }
        } catch (error) {
          console.log(`   ⚠️  Could not query: ${error}`);
        }
      }

      // Check if cleanup date has passed
      const canRemoveDate = new Date(version.canRemoveAfter);
      const now = new Date();

      console.log(`\n   Status:`);
      if (now >= canRemoveDate) {
        console.log(`   🟢 Cleanup date passed (${version.canRemoveAfter})`);
        console.log(`   📝 Action: Check for old workflows above. If none, remove old code path.`);
      } else {
        const daysLeft = Math.ceil((canRemoveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   🟡 Cleanup date not reached yet (${daysLeft} days remaining)`);
      }

      console.log('   ' + '-'.repeat(76));
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Summary:\n');

    const active = Object.values(WORKFLOW_VERSIONS).filter((v) => v.status === 'active');
    const canRemove = active.filter((v) => new Date(v.canRemoveAfter) <= new Date());

    console.log(`   Active versions: ${active.length}`);
    console.log(`   Ready for cleanup: ${canRemove.length}`);

    if (canRemove.length > 0) {
      console.log('\n✅ Versions ready for cleanup:');
      canRemove.forEach((v) => {
        console.log(`   - ${v.patchId}`);
      });
      console.log('\n📝 Next steps:');
      console.log('   1. Verify no old workflows running (see above)');
      console.log('   2. Remove old code path from workflow file');
      console.log('   3. Update status to "removed" in src/workflows/versions.ts');
    } else {
      console.log('\n⏳ No versions ready for cleanup yet');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to check versions:', error);
    process.exit(1);
  }
}

checkVersionCleanup();
