-- Add translation column to sentences table
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS translation TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sentences_translation ON sentences(translation);
