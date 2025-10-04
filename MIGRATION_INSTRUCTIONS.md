# Database Migration Required

## Summary
The reading feature has been updated to track two separate metrics:
- **Read Aloud** (with recording)
- **Read Silently** (without recording)

This requires updating the database constraint to accept the new action types.

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Update word_tracking table to support separate read_aloud and read_silent action types
-- Drop the existing constraint
ALTER TABLE word_tracking
  DROP CONSTRAINT IF EXISTS word_tracking_action_type_check;

-- Add updated constraint with new action types
ALTER TABLE word_tracking
  ADD CONSTRAINT word_tracking_action_type_check
  CHECK (action_type IN ('heard', 'typed', 'spoken', 'read_aloud', 'read_silent'));
```

4. Click **Run** to execute the migration

### Option 2: Using SQL File

The migration SQL file is located at:
```
supabase/migrations/update_read_action_types.sql
```

You can run this file directly in the Supabase SQL Editor.

## Verification

After running the migration, the reading tracking features should work correctly:
- Reading aloud with recording will track as `read_aloud`
- Reading silently will track as `read_silent`

Check the word history page to confirm both metrics are being tracked separately.

## Rollback (if needed)

If you need to rollback this change:

```sql
ALTER TABLE word_tracking
  DROP CONSTRAINT IF EXISTS word_tracking_action_type_check;

ALTER TABLE word_tracking
  ADD CONSTRAINT word_tracking_action_type_check
  CHECK (action_type IN ('heard', 'typed', 'spoken', 'read'));
```

Note: This will prevent new tracking with the split read types, but won't affect existing data.
