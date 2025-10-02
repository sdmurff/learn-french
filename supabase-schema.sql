-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sentences table
CREATE TABLE IF NOT EXISTS sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  theme TEXT DEFAULT 'General',
  source TEXT DEFAULT 'generated',
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NULL,
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  attempt_text TEXT,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  diff_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_sentence_id ON attempts(sentence_id);
CREATE INDEX IF NOT EXISTS idx_sentences_difficulty ON sentences(difficulty);
CREATE INDEX IF NOT EXISTS idx_sentences_theme ON sentences(theme);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for v1)
-- Note: When you add authentication later, you should update these policies

-- Sentences policies (allow public read, service role can insert/update)
CREATE POLICY "Public can read sentences" ON sentences
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert sentences" ON sentences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update sentences" ON sentences
  FOR UPDATE USING (true);

-- Attempts policies (allow public read for now, service role can insert)
CREATE POLICY "Public can read attempts" ON attempts
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert attempts" ON attempts
  FOR INSERT WITH CHECK (true);

-- Users policies (for future auth implementation)
CREATE POLICY "Public can read users" ON users
  FOR SELECT USING (true);
