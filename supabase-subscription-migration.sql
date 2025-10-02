-- Add subscription fields to users table (if using auth.users, create a profiles table instead)
-- This migration adds subscription tracking to your database

-- Option 1: If you want to add to a custom users table
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Option 2: Create a profiles table (RECOMMENDED for Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trialing', 'active', 'canceled', 'past_due')),
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create usage tracking table for free tier limits
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_usage
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for daily_usage
DROP POLICY IF EXISTS "Users can view own usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON daily_usage;

-- Policies for daily_usage
CREATE POLICY "Users can view own usage"
  ON daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON daily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster date queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date);
