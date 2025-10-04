#!/usr/bin/env ts-node
/**
 * Run database migration to update word_tracking action types
 *
 * This script updates the CHECK constraint on word_tracking table to support
 * 'read_aloud' and 'read_silent' instead of 'read'
 *
 * Usage: npx ts-node scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running migration: update_read_action_types.sql\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'update_read_action_types.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📝 Migration SQL:');
  console.log(migrationSQL);
  console.log('\n');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql RPC not found, trying direct query...\n');

      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const result = await supabase.from('_migrations').select('*').limit(0);

        // Since Supabase client doesn't support DDL directly, we need to use the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey!,
            'Authorization': `Bearer ${supabaseServiceKey!}`,
          },
          body: JSON.stringify({ sql: statement }),
        });

        if (!response.ok) {
          throw new Error(`Failed to execute statement: ${await response.text()}`);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nThe word_tracking table now accepts these action types:');
    console.log('  - heard');
    console.log('  - typed');
    console.log('  - spoken');
    console.log('  - read_aloud (new)');
    console.log('  - read_silent (new)\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    console.log('\n📋 Manual Instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the migration SQL above');
    console.log('4. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();
