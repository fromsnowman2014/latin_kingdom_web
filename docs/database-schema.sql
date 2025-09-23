-- Latin Kingdom Web App Database Schema
-- Based on PRD requirements for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (inherits from auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (vocabulary sets/lessons)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, -- "6th Grade Defender's Week 3"
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  total_words INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabularies table (Latin words and meanings)
CREATE TABLE public.vocabularies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  english_meaning TEXT NOT NULL,
  latin_word TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  word_length INTEGER NOT NULL,
  hints JSONB -- Step-by-step hints: ["a", "aq", "aqu", ...]
);

-- Game sessions table (track individual game plays)
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('playing', 'completed', 'failed')) DEFAULT 'playing',
  final_score INTEGER,
  words_learned INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2)
);

-- Learning progress table (track individual word mastery)
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  last_answered TIMESTAMPTZ,
  mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100) DEFAULT 0,

  -- Ensure one progress record per user-vocabulary pair
  UNIQUE(user_id, vocabulary_id)
);

-- Indexes for performance
CREATE INDEX idx_vocabularies_assignment_id ON vocabularies(assignment_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_assignment_id ON game_sessions(assignment_id);
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_vocabulary_id ON learning_progress(vocabulary_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Assignments and vocabularies are public for reading
CREATE POLICY "Anyone can view assignments" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view vocabularies" ON vocabularies
  FOR SELECT USING (true);

-- Game sessions - users can only see their own
CREATE POLICY "Users can view own game sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions" ON game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning progress - users can only see their own
CREATE POLICY "Users can view own learning progress" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Sample data for testing
INSERT INTO assignments (title, description, difficulty_level, total_words) VALUES
  ('6th Grade Defender Week 1', 'Basic Latin vocabulary for beginners', 1, 10),
  ('6th Grade Defender Week 2', 'Intermediate Latin words', 2, 15),
  ('Advanced Latin Warriors', 'Challenging Latin vocabulary', 4, 20);

-- Sample vocabularies for Week 1
INSERT INTO vocabularies (assignment_id, english_meaning, latin_word, difficulty, word_length, hints) VALUES
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'water', 'aqua', 1, 4, '["a", "aq", "aqu"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'fire', 'ignis', 2, 5, '["i", "ig", "ign", "igni"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'earth', 'terra', 1, 5, '["t", "te", "ter", "terr"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'air', 'aer', 1, 3, '["a", "ae"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'light', 'lux', 1, 3, '["l", "lu"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'life', 'vita', 1, 4, '["v", "vi", "vit"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'love', 'amor', 2, 4, '["a", "am", "amo"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'war', 'bellum', 2, 6, '["b", "be", "bel", "bell", "bellu"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'peace', 'pax', 1, 3, '["p", "pa"]'),
  ((SELECT id FROM assignments WHERE title = '6th Grade Defender Week 1' LIMIT 1), 'time', 'tempus', 3, 6, '["t", "te", "tem", "temp", "tempu"]');

-- Functions for game logic
CREATE OR REPLACE FUNCTION validate_latin_word(
  p_english_meaning TEXT,
  p_user_input TEXT,
  p_assignment_id UUID
)
RETURNS TABLE (
  is_correct BOOLEAN,
  correct_word TEXT,
  hint_level INTEGER,
  gold_reward INTEGER
) AS $$
DECLARE
  vocab_record RECORD;
  input_length INTEGER;
  max_hints INTEGER;
BEGIN
  -- Find the vocabulary record
  SELECT v.latin_word, v.hints, v.difficulty
  INTO vocab_record
  FROM vocabularies v
  WHERE v.assignment_id = p_assignment_id
    AND LOWER(v.english_meaning) = LOWER(p_english_meaning)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ''::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Check if answer is correct
  IF LOWER(TRIM(p_user_input)) = LOWER(vocab_record.latin_word) THEN
    RETURN QUERY SELECT true, vocab_record.latin_word, 0, (vocab_record.difficulty * 10);
    RETURN;
  END IF;

  -- Calculate hint level based on input length
  input_length := LENGTH(TRIM(p_user_input));
  max_hints := jsonb_array_length(vocab_record.hints);

  -- Return hint information
  RETURN QUERY SELECT
    false,
    vocab_record.latin_word,
    LEAST(input_length + 1, max_hints),
    GREATEST(1, (vocab_record.difficulty * 10) - (input_length * 2));
END;
$$ LANGUAGE plpgsql;

-- Function to update learning progress
CREATE OR REPLACE FUNCTION update_learning_progress(
  p_user_id UUID,
  p_vocabulary_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO learning_progress (user_id, vocabulary_id, attempts, correct_answers, last_answered, mastery_level)
  VALUES (
    p_user_id,
    p_vocabulary_id,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW(),
    CASE WHEN p_is_correct THEN 10 ELSE 0 END
  )
  ON CONFLICT (user_id, vocabulary_id)
  DO UPDATE SET
    attempts = learning_progress.attempts + 1,
    correct_answers = learning_progress.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_answered = NOW(),
    mastery_level = LEAST(100,
      learning_progress.mastery_level +
      CASE WHEN p_is_correct THEN 10 ELSE -5 END
    );
END;
$$ LANGUAGE plpgsql;