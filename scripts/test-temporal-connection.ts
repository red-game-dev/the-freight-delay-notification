/**
 * Test Temporal Connection Script
 * Verifies that the Temporal server is running and accessible
 */

import { Client, Connection } from '@temporalio/client';

async function testTemporalConnection() {
  try {
    console.log('🔍 Testing Temporal connection...');
    console.log('');

    // Connect to Temporal server
    const connection = await Connection.connect({
      address: 'localhost:7233',
    });

    const client = new Client({
      connection,
      namespace: 'default',
    });

    console.log('✅ Temporal connection successful!');
    console.log('   - Address: localhost:7233');
    console.log('   - Namespace: default');
    console.log('');

    // Try to list workflows (this will work even if none exist)
    console.log('📋 Checking workflow list...');
    const workflows = client.workflow.list({
      query: 'WorkflowType="DelayNotificationWorkflow"',
    });

    let count = 0;
    for await (const workflow of workflows) {
      count++;
      if (count >= 5) break; // Just check first 5
    }

    console.log(`   Found ${count} DelayNotificationWorkflow(s) in namespace`);
    console.log('');

    // Check server health
    console.log('🏥 Server Health Check:');
    console.log('   ✅ gRPC connection: OK');
    console.log('   ✅ Namespace access: OK');
    console.log('   ✅ Query capability: OK');
    console.log('');

    console.log('========================================');
    console.log('✅ Temporal server is ready for use!');
    console.log('========================================');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start the worker: npm run temporal:worker');
    console.log('   2. Run workflows from your application');
    console.log('   3. View workflows at: http://localhost:8233');
    console.log('');

    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Temporal connection failed!');
    console.error('');

    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }

    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('');
    console.error('1. Make sure Temporal server is running:');
    console.error('   npm run temporal:start');
    console.error('');
    console.error('2. Or run directly with Docker:');
    console.error('   docker run --rm -d \\');
    console.error('     --name temporal-dev-server \\');
    console.error('     -p 7233:7233 -p 8233:8233 \\');
    console.error('     temporalio/cli:latest \\');
    console.error('     server start-dev');
    console.error('');
    console.error('3. Check if Docker is running:');
    console.error('   docker ps');
    console.error('');
    console.error('4. Check server logs:');
    console.error('   npm run temporal:logs');
    console.error('');
    process.exit(1);
  }
}

// Run the test
testTemporalConnection();