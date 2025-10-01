/**
 * Database Migration Script
 * Links to Supabase and runs migrations
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
config({ path: '.env.local' });

console.log('🗄️  Database Migration Script');
console.log('════════════════════════════════════════════════════════════');
console.log('');

// Extract project ref from SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL is set in .env.local');
  process.exit(1);
}

const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('❌ Error: Invalid SUPABASE_URL format');
  console.error('   Expected: https://your-project.supabase.co');
  process.exit(1);
}

const projectRef = match[1];

console.log('📋 Configuration:');
console.log(`   Project Ref: ${projectRef}`);
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log('');

// Check if already linked
const fs = require('fs');
const isLinked = fs.existsSync('.supabase/config.toml');

if (!isLinked) {
  console.log('🔗 Linking to Supabase project...');
  console.log('');

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    console.log('⚠️  You will be prompted for your database password');
    console.log(`   Get it from: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
    console.log('');
    console.log('   💡 Tip: Add SUPABASE_DB_PASSWORD to .env.local to avoid this prompt');
    console.log('');
  }

  try {
    const linkCommand = dbPassword
      ? `npx supabase link --project-ref ${projectRef} --password ${dbPassword}`
      : `npx supabase link --project-ref ${projectRef}`;

    execSync(linkCommand, { stdio: 'inherit' });
    console.log('');
    console.log('✅ Successfully linked to Supabase project');
  } catch (error) {
    console.error('');
    console.error('❌ Failed to link to Supabase project');
    process.exit(1);
  }
} else {
  console.log('✅ Already linked to Supabase project');
}

console.log('');
console.log('🚀 Pushing migrations to remote database...');
console.log('');

try {
  execSync('npx supabase db push', { stdio: 'inherit' });

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ Database migrations completed successfully!');
  console.log('');
  console.log('📊 View your database:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor`);
  console.log('');
} catch (error) {
  console.error('');
  console.error('❌ Failed to push migrations');
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Check your database password is correct');
  console.error('  2. Verify SUPABASE_URL in .env.local');
  console.error('  3. Check migrations in supabase/migrations/');
  console.error('');
  process.exit(1);
}
