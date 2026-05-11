-- ============================================================
-- PRAXIS Nutrition — Wearables / Sync
-- wearable_metrics, sync_log + colunas adicionais em daily_logs
-- ============================================================

-- ── wearable_metrics ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wearable_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('healthkit','health_connect','manual')),
  metric_type  TEXT NOT NULL CHECK (metric_type IN (
    'steps',
    'heart_rate',
    'sleep_duration',
    'sleep_quality',
    'weight',
    'body_fat',
    'blood_pressure_systolic',
    'blood_pressure_diastolic'
  )),
  value        NUMERIC NOT NULL,
  unit         TEXT,
  recorded_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE wearable_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wearable_metrics_select_own"  ON wearable_metrics;
DROP POLICY IF EXISTS "wearable_metrics_insert_own"  ON wearable_metrics;
DROP POLICY IF EXISTS "wearable_metrics_update_own"  ON wearable_metrics;
DROP POLICY IF EXISTS "wearable_metrics_delete_own"  ON wearable_metrics;

CREATE POLICY "wearable_metrics_select_own"
  ON wearable_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wearable_metrics_insert_own"
  ON wearable_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wearable_metrics_update_own"
  ON wearable_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wearable_metrics_delete_own"
  ON wearable_metrics FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wearable_metrics_user_recorded_idx
  ON wearable_metrics (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS wearable_metrics_user_type_recorded_idx
  ON wearable_metrics (user_id, metric_type, recorded_at DESC);


-- ── sync_log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('success','partial','failed')),
  records_synced  INT DEFAULT 0 NOT NULL,
  error_message   TEXT,
  synced_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_log_select_own"  ON sync_log;
DROP POLICY IF EXISTS "sync_log_insert_own"  ON sync_log;
DROP POLICY IF EXISTS "sync_log_update_own"  ON sync_log;
DROP POLICY IF EXISTS "sync_log_delete_own"  ON sync_log;

CREATE POLICY "sync_log_select_own"
  ON sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sync_log_insert_own"
  ON sync_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_log_update_own"
  ON sync_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_log_delete_own"
  ON sync_log FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sync_log_user_synced_idx
  ON sync_log (user_id, synced_at DESC);


-- ── daily_logs: colunas adicionais (apenas se nao existirem) ──
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS steps          INT,
  ADD COLUMN IF NOT EXISTS resting_hr     INT,
  ADD COLUMN IF NOT EXISTS sleep_quality  NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS hrv_score      NUMERIC(5,2);
