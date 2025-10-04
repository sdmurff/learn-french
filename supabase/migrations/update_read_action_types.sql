-- Update word_tracking table to support separate read_aloud and read_silent action types
-- Drop the existing constraint
ALTER TABLE word_tracking
  DROP CONSTRAINT IF EXISTS word_tracking_action_type_check;

-- Add updated constraint with new action types
ALTER TABLE word_tracking
  ADD CONSTRAINT word_tracking_action_type_check
  CHECK (action_type IN ('heard', 'typed', 'spoken', 'read_aloud', 'read_silent'));
