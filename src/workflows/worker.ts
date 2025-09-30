/**
 * Temporal Worker Entry Point
 * This runs the worker process that executes workflows and activities
 */

import { config } from 'dotenv';
import { startWorker } from '../infrastructure/temporal/TemporalWorker';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function main() {
  console.log('========================================');
  console.log('  Freight Delay Notification Worker');
  console.log('========================================');
  console.log('');

  // Debug: Check if API keys are loaded
  console.log('🔑 API Keys Status:');
  console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Google Maps: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Mapbox: ${process.env.MAPBOX_ACCESS_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
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