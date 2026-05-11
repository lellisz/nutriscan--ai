-- ============================================================
-- PRAXIS Nutrition — weight_logs
-- Registro de peso corporal com RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS weight_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  weight_kg  NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  note       TEXT,
  logged_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS weight_logs_user_date_idx
  ON weight_logs (user_id, logged_at DESC);

-- RLS
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weight logs"
  ON weight_logs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
