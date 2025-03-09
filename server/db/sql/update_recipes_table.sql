-- Add cultural_note column to recipes table if it doesn't exist
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cultural_note TEXT; 