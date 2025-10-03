-- Create word_tracking table to track all words heard, typed, and spoken
CREATE TABLE IF NOT EXISTS word_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  word TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('heard', 'typed', 'spoken')),
  sentence_id UUID REFERENCES sentences(id) ON DELETE SET NULL,
  repeat_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_word_tracking_user_id ON word_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_word_tracking_session_id ON word_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_word_tracking_word ON word_tracking(word);
CREATE INDEX IF NOT EXISTS idx_word_tracking_action_type ON word_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_word_tracking_created_at ON word_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_word_tracking_user_word ON word_tracking(user_id, word);

-- Enable Row Level Security
ALTER TABLE word_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own word tracking" ON word_tracking;
DROP POLICY IF EXISTS "Users can insert own word tracking" ON word_tracking;

-- Policies for word_tracking
CREATE POLICY "Users can view own word tracking"
  ON word_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word tracking"
  ON word_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);
