-- ============================================================
-- PRAXIS Nutrition — Tabelas AI/ML
-- meal_photos, daily_insights, glucose_predictions
-- RLS granular (SELECT/INSERT/UPDATE/DELETE separados)
-- ============================================================

-- ── meal_photos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  meal_id       UUID REFERENCES meals(id) ON DELETE SET NULL,
  storage_path  TEXT NOT NULL,
  analysis_json JSONB,
  confidence    NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE meal_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_photos_select_own"  ON meal_photos;
DROP POLICY IF EXISTS "meal_photos_insert_own"  ON meal_photos;
DROP POLICY IF EXISTS "meal_photos_update_own"  ON meal_photos;
DROP POLICY IF EXISTS "meal_photos_delete_own"  ON meal_photos;

CREATE POLICY "meal_photos_select_own"
  ON meal_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_photos_insert_own"
  ON meal_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_photos_update_own"
  ON meal_photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_photos_delete_own"
  ON meal_photos FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meal_photos_user_created_idx
  ON meal_photos (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS meal_photos_meal_idx
  ON meal_photos (meal_id) WHERE meal_id IS NOT NULL;


-- ── daily_insights ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('nutrition','sleep','activity','glucose','behavior')),
  title       TEXT NOT NULL,
  body        TEXT,
  priority    INT DEFAULT 0,
  dismissed   BOOLEAN DEFAULT false NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_insights_select_own"  ON daily_insights;
DROP POLICY IF EXISTS "daily_insights_insert_own"  ON daily_insights;
DROP POLICY IF EXISTS "daily_insights_update_own"  ON daily_insights;
DROP POLICY IF EXISTS "daily_insights_delete_own"  ON daily_insights;

CREATE POLICY "daily_insights_select_own"
  ON daily_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_insights_insert_own"
  ON daily_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_insights_update_own"
  ON daily_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_insights_delete_own"
  ON daily_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS daily_insights_user_date_idx
  ON daily_insights (user_id, date DESC);

CREATE INDEX IF NOT EXISTS daily_insights_user_priority_idx
  ON daily_insights (user_id, priority DESC, created_at DESC)
  WHERE dismissed = false;


-- ── glucose_predictions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS glucose_predictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  meal_id           UUID REFERENCES meals(id) ON DELETE SET NULL,
  predicted_at      TIMESTAMPTZ NOT NULL,
  peak_mmol         NUMERIC(5,2),
  area_under_curve  NUMERIC(8,2),
  recommendation    TEXT,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE glucose_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glucose_predictions_select_own"  ON glucose_predictions;
DROP POLICY IF EXISTS "glucose_predictions_insert_own"  ON glucose_predictions;
DROP POLICY IF EXISTS "glucose_predictions_update_own"  ON glucose_predictions;
DROP POLICY IF EXISTS "glucose_predictions_delete_own"  ON glucose_predictions;

CREATE POLICY "glucose_predictions_select_own"
  ON glucose_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "glucose_predictions_insert_own"
  ON glucose_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "glucose_predictions_update_own"
  ON glucose_predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "glucose_predictions_delete_own"
  ON glucose_predictions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS glucose_predictions_user_created_idx
  ON glucose_predictions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS glucose_predictions_user_predicted_idx
  ON glucose_predictions (user_id, predicted_at DESC);
