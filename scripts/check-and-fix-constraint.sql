-- Check and Fix word_tracking Constraint
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'word_tracking'::regclass
AND conname = 'word_tracking_action_type_check';

-- Step 2: Drop the old constraint
ALTER TABLE word_tracking
  DROP CONSTRAINT IF EXISTS word_tracking_action_type_check;

-- Step 3: Add the new constraint with updated action types
ALTER TABLE word_tracking
  ADD CONSTRAINT word_tracking_action_type_check
  CHECK (action_type IN ('heard', 'typed', 'spoken', 'read_aloud', 'read_silent'));

-- Step 4: Verify the new constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'word_tracking'::regclass
AND conname = 'word_tracking_action_type_check';
