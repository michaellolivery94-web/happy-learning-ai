/*
  # CBC-Aware Progress Tracking Schema
  
  Creates comprehensive tables for tracking student progress in the Kenyan Competency-Based Curriculum (CBC).
  
  ## New Tables
  
  1. `progress`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `grade` (text) - CBC grade level (Grade 1-9)
    - `subject` (text) - Subject area (Mathematics, Science, etc.)
    - `questions` (int) - Total questions asked
    - `lessons` (int) - Total lessons completed
    - `streak` (int) - Current learning streak in days
    - `last_active` (date) - Last activity date for streak tracking
    - `competencies` (jsonb) - Detailed competency mastery data
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. `chat_history`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `grade` (text) - Grade level for context
    - `subject` (text) - Subject area
    - `messages` (jsonb) - Complete chat conversation
    - `created_at` (timestamptz)
  
  ## Security
  
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
*/

-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade text DEFAULT 'Grade 1',
  subject text DEFAULT 'General Learning',
  questions int DEFAULT 0,
  lessons int DEFAULT 0,
  streak int DEFAULT 0,
  last_active date DEFAULT CURRENT_DATE,
  competencies jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_grade_subject ON progress(grade, subject);

-- Enable RLS
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress table
CREATE POLICY "Users can view own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade text DEFAULT 'Grade 1',
  subject text DEFAULT 'General Learning',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history table
CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat history"
  ON chat_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON chat_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_progress_updated_at ON progress;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();