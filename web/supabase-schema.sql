-- Supabase Database Schema for Break & Run
-- Run this SQL in your Supabase SQL Editor

-- Users table (custom authentication with Argon2)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Games table (completed games)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_one_name TEXT NOT NULL,
  player_two_name TEXT NOT NULL,
  player_one_score INTEGER NOT NULL,
  player_two_score INTEGER NOT NULL,
  target_score INTEGER NOT NULL,
  game_mode TEXT NOT NULL,
  winner TEXT,
  date BIGINT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  frame_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  player_one_sets_won INTEGER NOT NULL DEFAULT 0,
  player_two_sets_won INTEGER NOT NULL DEFAULT 0,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  break_player TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active games table (games in progress)
CREATE TABLE IF NOT EXISTS active_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  player_one_name TEXT NOT NULL,
  player_two_name TEXT NOT NULL,
  player_one_score INTEGER NOT NULL DEFAULT 0,
  player_two_score INTEGER NOT NULL DEFAULT 0,
  player_one_games_won INTEGER NOT NULL DEFAULT 0,
  player_two_games_won INTEGER NOT NULL DEFAULT 0,
  target_score INTEGER NOT NULL,
  game_mode TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  frame_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  player_one_sets_won INTEGER NOT NULL DEFAULT 0,
  player_two_sets_won INTEGER NOT NULL DEFAULT 0,
  completed_sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  break_player TEXT,
  player_one_color TEXT,
  player_two_color TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to extract user_id from JWT claims
-- This function reads the user_id from the JWT token claims
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS UUID AS $$
BEGIN
  -- Extract user_id from JWT claims
  -- The JWT is automatically decoded by Supabase and available in request.jwt.claims
  RETURN (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if JWT is missing or invalid
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games table
CREATE POLICY "Users can view their own games"
  ON games FOR SELECT
  USING (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can insert their own games"
  ON games FOR INSERT
  WITH CHECK (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can update their own games"
  ON games FOR UPDATE
  USING (user_id = get_user_id_from_jwt())
  WITH CHECK (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can delete their own games"
  ON games FOR DELETE
  USING (user_id = get_user_id_from_jwt());

-- RLS Policies for active_games table
CREATE POLICY "Users can view their own active games"
  ON active_games FOR SELECT
  USING (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can insert their own active games"
  ON active_games FOR INSERT
  WITH CHECK (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can update their own active games"
  ON active_games FOR UPDATE
  USING (user_id = get_user_id_from_jwt())
  WITH CHECK (user_id = get_user_id_from_jwt());

CREATE POLICY "Users can delete their own active games"
  ON active_games FOR DELETE
  USING (user_id = get_user_id_from_jwt());

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date DESC);
CREATE INDEX IF NOT EXISTS idx_active_games_user_id ON active_games(user_id);

