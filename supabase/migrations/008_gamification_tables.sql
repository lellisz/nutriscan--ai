-- ============================================================
-- PRAXIS Nutrition — Tabelas de Gamificacao
-- achievements, user_achievements, quests, user_quests, streak_state
-- Catalogos publicos com SELECT publico; tabelas user_* com RLS por user_id
-- ============================================================

-- ── achievements (catalogo publico) ──────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  icon         TEXT,
  xp_reward    INT DEFAULT 0 NOT NULL
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_public" ON achievements;
CREATE POLICY "achievements_select_public"
  ON achievements FOR SELECT
  USING (true);


-- ── user_achievements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_own"  ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert_own"  ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_update_own"  ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_delete_own"  ON user_achievements;

CREATE POLICY "user_achievements_select_own"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_achievements_insert_own"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements_update_own"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements_delete_own"
  ON user_achievements FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_achievements_user_unlocked_idx
  ON user_achievements (user_id, unlocked_at DESC);


-- ── quests (catalogo publico) ────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  kind           TEXT NOT NULL CHECK (kind IN ('daily','monthly')),
  target_metric  TEXT NOT NULL,
  target_value   NUMERIC NOT NULL,
  xp_reward      INT DEFAULT 0 NOT NULL,
  active         BOOLEAN DEFAULT true NOT NULL
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quests_select_public" ON quests;
CREATE POLICY "quests_select_public"
  ON quests FOR SELECT
  USING (true);


-- ── user_quests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  quest_id      TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at  TIMESTAMPTZ,
  progress      NUMERIC DEFAULT 0 NOT NULL
);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_quests_select_own"  ON user_quests;
DROP POLICY IF EXISTS "user_quests_insert_own"  ON user_quests;
DROP POLICY IF EXISTS "user_quests_update_own"  ON user_quests;
DROP POLICY IF EXISTS "user_quests_delete_own"  ON user_quests;

CREATE POLICY "user_quests_select_own"
  ON user_quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_quests_insert_own"
  ON user_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_quests_update_own"
  ON user_quests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_quests_delete_own"
  ON user_quests FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_quests_user_assigned_idx
  ON user_quests (user_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS user_quests_user_active_idx
  ON user_quests (user_id, quest_id) WHERE completed_at IS NULL;


-- ── streak_state ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streak_state (
  user_id          UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  current_streak   INT DEFAULT 0 NOT NULL,
  longest_streak   INT DEFAULT 0 NOT NULL,
  last_check_in    DATE,
  freeze_count     INT DEFAULT 0 NOT NULL,
  vacation_until   DATE,
  sick_day_until   DATE
);

ALTER TABLE streak_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streak_state_select_own"  ON streak_state;
DROP POLICY IF EXISTS "streak_state_insert_own"  ON streak_state;
DROP POLICY IF EXISTS "streak_state_update_own"  ON streak_state;
DROP POLICY IF EXISTS "streak_state_delete_own"  ON streak_state;

CREATE POLICY "streak_state_select_own"
  ON streak_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streak_state_insert_own"
  ON streak_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streak_state_update_own"
  ON streak_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streak_state_delete_own"
  ON streak_state FOR DELETE
  USING (auth.uid() = user_id);


-- ── SEED: achievements (8) ───────────────────────────────────
INSERT INTO achievements (id, title, description, category, icon, xp_reward) VALUES
  ('first_log',       'Primeiro registro',          'Registrou sua primeira refeicao no PRAXIS.',                'onboarding', 'sparkles',     50),
  ('7day_streak',     'Semana Consistente',         'Manteve check-ins por 7 dias consecutivos.',                'streak',     'flame',       150),
  ('30day_streak',    'Mes de Disciplina',          'Manteve check-ins por 30 dias consecutivos.',               'streak',     'flame',       500),
  ('hydration_hero',  'Heroi da Hidratacao',        'Atingiu a meta de hidratacao por 7 dias consecutivos.',     'nutrition',  'droplet',     200),
  ('protein_pro',     'Pro da Proteina',            'Bateu a meta de proteina por 14 dias.',                     'nutrition',  'beef',        250),
  ('mindful_eater',   'Comer Consciente',           'Registrou humor e energia em 10 refeicoes.',                'behavior',   'brain',       180),
  ('fast_finisher',   'Jejum Concluido',            'Completou seu primeiro protocolo de jejum 16:8.',           'fasting',    'clock',       100),
  ('partner_bond',    'Dupla Imbativel',            'Conectou-se a um parceiro PRAXIS.',                         'social',     'users',        80)
ON CONFLICT (id) DO NOTHING;


-- ── SEED: quests daily (6) ───────────────────────────────────
INSERT INTO quests (id, title, description, kind, target_metric, target_value, xp_reward, active) VALUES
  ('daily_log_meal',     'Registre uma refeicao',           'Logue ao menos 1 refeicao hoje.',              'daily', 'meals_logged',         1,    20, true),
  ('daily_hydration',    'Bata a meta de agua',             'Atinja sua meta diaria de hidratacao.',        'daily', 'hydration_pct',        100,  30, true),
  ('daily_protein',      'Atinja a proteina',               'Bata sua meta de proteina hoje.',              'daily', 'protein_pct',          100,  30, true),
  ('daily_mood_log',     'Registre seu humor',              'Registre humor e energia ao menos uma vez.',   'daily', 'mood_logs',            1,    15, true),
  ('daily_three_meals',  'Tres refeicoes balanceadas',      'Registre cafe, almoco e jantar hoje.',         'daily', 'meal_types_logged',    3,    40, true),
  ('daily_score_70',     'Score acima de 70',               'Termine o dia com Score >= 70.',               'daily', 'daily_score',          70,   50, true)
ON CONFLICT (id) DO NOTHING;


-- ── SEED: quests monthly (2) ─────────────────────────────────
INSERT INTO quests (id, title, description, kind, target_metric, target_value, xp_reward, active) VALUES
  ('monthly_streak_20', 'Vinte dias no mes',     'Faca check-in em 20 dias do mes corrente.',           'monthly', 'monthly_checkins',     20,   500, true),
  ('monthly_avg_75',    'Media mensal 75+',      'Atinja Score medio mensal >= 75.',                    'monthly', 'monthly_avg_score',    75,   600, true)
ON CONFLICT (id) DO NOTHING;
