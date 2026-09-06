-- Objectle D1 Database Schema

-- Daily challenges: stores the daily object and metadata
CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD format
  object_key TEXT NOT NULL, -- opaque key like "daily/2026-09-06.glb" or "obj_abc123"
  object_name TEXT NOT NULL, -- actual answer (bicycle, chair, etc)
  category TEXT NOT NULL, -- furniture, vehicle, tool, etc
  material TEXT NOT NULL, -- wood, metal, plastic, etc
  scale TEXT NOT NULL, -- small, medium, large
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Guess history: tracks all player guesses
CREATE TABLE IF NOT EXISTS guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL, -- agent identifier or session ID
  date TEXT NOT NULL, -- challenge date
  guess_number INTEGER NOT NULL, -- 1-6
  guess_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0, -- 0 or 1
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (date) REFERENCES daily_challenges(date)
);

-- Player scores: tracks streaks and stats
CREATE TABLE IF NOT EXISTS player_scores (
  player_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  last_played_date TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Accepted synonyms: allows variations of answers
CREATE TABLE IF NOT EXISTS synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical TEXT NOT NULL, -- the official answer
  synonym TEXT NOT NULL, -- accepted variation
  UNIQUE(canonical, synonym)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guesses_player_date ON guesses(player_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_synonyms_lookup ON synonyms(synonym);

-- Insert initial synonyms
INSERT OR IGNORE INTO synonyms (canonical, synonym) VALUES
  ('bicycle', 'bike'),
  ('bicycle', 'cycle'),
  ('chair', 'seat'),
  ('lamp', 'light'),
  ('mug', 'cup'),
  ('mug', 'coffee cup'),
  ('table', 'desk');

-- Insert initial daily challenges (3 objects for MVP)
INSERT OR IGNORE INTO daily_challenges (date, object_key, object_name, category, material, scale) VALUES
  ('2026-09-06', 'daily/obj_chair_001', 'chair', 'furniture', 'wood', 'medium'),
  ('2026-09-07', 'daily/obj_bicycle_001', 'bicycle', 'vehicle', 'metal', 'large'),
  ('2026-09-08', 'daily/obj_mug_001', 'mug', 'kitchenware', 'ceramic', 'small');
