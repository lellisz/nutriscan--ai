-- Migration: 004_food_logs
-- Tabela food_logs para registro manual de refeições com RLS

CREATE TABLE IF NOT EXISTS food_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_name   TEXT NOT NULL,
  calories    INT,
  protein     FLOAT,
  carbs       FLOAT,
  fat         FLOAT,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_food_logs" ON food_logs
  FOR ALL
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE INDEX IF NOT EXISTS food_logs_user_logged_at
  ON food_logs ("userId", logged_at DESC);
