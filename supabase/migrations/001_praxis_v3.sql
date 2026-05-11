-- ============================================================
-- PRAXIS Nutrition v3 — Schema completo
-- Inclui: RLS em todas as tabelas, pgcrypto, LGPD compliance
-- Rodar no SQL Editor do Supabase antes do primeiro deploy
-- ============================================================

-- ── EXTENSÕES ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELAS ──────────────────────────────────────────────────

-- Perfis (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name                TEXT,
  goal                TEXT CHECK (goal IN ('lose_weight','gain_muscle','maintain','health')),
  calories_target     INT DEFAULT 2100,
  protein_target      INT DEFAULT 150,
  hydration_target    INT DEFAULT 2000,
  compassion_mode     BOOLEAN DEFAULT true,
  quiet_intelligence  BOOLEAN DEFAULT true,
  adaptive_goals      BOOLEAN DEFAULT false,
  nutrition_memory    BOOLEAN DEFAULT true,
  privacy_version     TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Logs diários
CREATE TABLE IF NOT EXISTS daily_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date              DATE NOT NULL,
  context           TEXT DEFAULT 'normal'
                    CHECK (context IN ('normal','stress','travel','celebrate','hard')),
  score             INT CHECK (score BETWEEN 12 AND 100),
  calories_consumed INT,
  protein_consumed  NUMERIC(6,1),
  carbs_consumed    NUMERIC(6,1),
  fat_consumed      NUMERIC(6,1),
  hydration_ml      INT,
  sleep_hours       NUMERIC(4,2),
  mood              INT CHECK (mood BETWEEN 1 AND 5),
  energy_level      INT CHECK (energy_level BETWEEN 1 AND 10),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Refeições
CREATE TABLE IF NOT EXISTS meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  meal_type   TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  name        TEXT NOT NULL,
  calories    INT,
  protein     NUMERIC(6,1),
  carbs       NUMERIC(6,1),
  fat         NUMERIC(6,1),
  logged_at   TIMESTAMPTZ DEFAULT now()
);

-- Memória nutricional (refeições frequentes)
CREATE TABLE IF NOT EXISTS frequent_meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  calories    INT,
  protein     NUMERIC(6,1),
  carbs       NUMERIC(6,1),
  fat         NUMERIC(6,1),
  count       INT DEFAULT 1,
  last_used   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Sessões de jejum
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  protocol    TEXT CHECK (protocol IN ('12:12','16:8','18:6','24h')),
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  completed   BOOLEAN DEFAULT false
);

-- Parceiros PRAXIS (compartilham Score — nunca refeições)
CREATE TABLE IF NOT EXISTS partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  partner_id  UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  status      TEXT CHECK (status IN ('pending','active')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Mensagens do Coach
CREATE TABLE IF NOT EXISTS coach_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  role        TEXT CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Padrões comportamentais observados
CREATE TABLE IF NOT EXISTS behavior_patterns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  pattern_key TEXT NOT NULL,
  value       JSONB,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pattern_key)
);

-- Consentimentos LGPD
CREATE TABLE IF NOT EXISTS consents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  consent_type     TEXT NOT NULL CHECK (consent_type IN (
    'health_data_processing',
    'ai_coach_processing',
    'partner_score_sharing',
    'wearable_integration',
    'marketing_communications',
    'analytics_anonymous'
  )),
  granted          BOOLEAN NOT NULL,
  granted_at       TIMESTAMPTZ DEFAULT now(),
  revoked_at       TIMESTAMPTZ,
  consent_version  TEXT NOT NULL DEFAULT 'v1.0',
  app_version      TEXT,
  UNIQUE(user_id, consent_type, consent_version)
);

-- Log de segurança (sem PII — só hashes e eventos)
CREATE TABLE IF NOT EXISTS security_log (
  id         SERIAL PRIMARY KEY,
  user_id    UUID,
  event      TEXT NOT NULL,
  ip_hash    TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auditoria de exclusões (LGPD — sem PII)
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id            SERIAL PRIMARY KEY,
  user_id_hash  BYTEA NOT NULL,
  deleted_at    TIMESTAMPTZ DEFAULT now()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_meals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents          ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuário acessa APENAS seus próprios dados
CREATE POLICY "own_profile"         ON profiles          FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_daily_logs"      ON daily_logs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_meals"           ON meals             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_frequent_meals"  ON frequent_meals    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_fasting"         ON fasting_sessions  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_coach_messages"  ON coach_messages    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_patterns"        ON behavior_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_consents"        ON consents          FOR ALL USING (auth.uid() = user_id);

-- Parceiros: ver relações próprias + score (NUNCA refeições de outros)
CREATE POLICY "own_partner_rows" ON partners FOR ALL USING (
  auth.uid() = user_id OR auth.uid() = partner_id
);

-- ── ÍNDICES DE PERFORMANCE ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date   ON daily_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date        ON meals (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_user           ON fasting_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user    ON coach_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_frequent_meals_user    ON frequent_meals (user_id, count DESC);
CREATE INDEX IF NOT EXISTS idx_consents_active        ON consents (user_id, consent_type)
  WHERE granted = true AND revoked_at IS NULL;

-- ── FUNÇÃO: DIREITO AO ESQUECIMENTO (LGPD Art. 18) ──────────
CREATE OR REPLACE FUNCTION delete_user_all_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM coach_messages     WHERE user_id = target_user_id;
  DELETE FROM behavior_patterns  WHERE user_id = target_user_id;
  DELETE FROM frequent_meals     WHERE user_id = target_user_id;
  DELETE FROM fasting_sessions   WHERE user_id = target_user_id;
  DELETE FROM meals              WHERE user_id = target_user_id;
  DELETE FROM daily_logs         WHERE user_id = target_user_id;
  DELETE FROM partners
    WHERE user_id = target_user_id OR partner_id = target_user_id;
  DELETE FROM consents           WHERE user_id = target_user_id;
  DELETE FROM security_log       WHERE user_id = target_user_id;
  DELETE FROM profiles           WHERE id = target_user_id;
  -- Auditoria sem PII
  INSERT INTO deletion_audit_log (user_id_hash)
  VALUES (digest(target_user_id::text, 'sha256'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── VIEW ANALYTICS ANONIMIZADA ───────────────────────────────
-- Agregações sem identificação individual — fora do escopo LGPD
CREATE OR REPLACE VIEW analytics_anonymous AS
SELECT
  DATE_TRUNC('week', date)                             AS week,
  context,
  COUNT(*)                                             AS users,
  AVG(score)                                           AS avg_score,
  AVG(calories_consumed)                               AS avg_calories,
  AVG(hydration_ml)                                    AS avg_hydration,
  COUNT(*) FILTER (WHERE score >= 80)                  AS high_score_days,
  COUNT(*) FILTER (WHERE score < 50)                   AS low_score_days
FROM daily_logs
GROUP BY DATE_TRUNC('week', date), context
HAVING COUNT(*) >= 10; -- mínimo 10 para evitar re-identificação

-- ── RED TEAM CHECKS (rodar antes de cada deploy) ─────────────
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND qual='true';
-- SELECT id, name, public FROM storage.buckets WHERE public=true;
