-- Row Level Security Setup for French Learning App
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own attempts" ON attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON attempts;

-- Enable RLS on attempts table
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own attempts
CREATE POLICY "Users can view own attempts"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own attempts
CREATE POLICY "Users can insert own attempts"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'attempts';
