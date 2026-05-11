-- ============================================================
-- Migration 011: Tabelas v2 — hydration_logs, meal_plans, subscriptions
-- PRAXIS Nutrition v2 Features
-- Idempotente: IF NOT EXISTS em todas as operações
-- ============================================================

-- ── hydration_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ml INTEGER NOT NULL CHECK (ml > 0 AND ml <= 5000),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date
  ON hydration_logs(user_id, logged_at DESC);

ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hydration_logs' AND policyname = 'hydration_logs_select_own'
  ) THEN
    CREATE POLICY "hydration_logs_select_own" ON hydration_logs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hydration_logs' AND policyname = 'hydration_logs_insert_own'
  ) THEN
    CREATE POLICY "hydration_logs_insert_own" ON hydration_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hydration_logs' AND policyname = 'hydration_logs_update_own'
  ) THEN
    CREATE POLICY "hydration_logs_update_own" ON hydration_logs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hydration_logs' AND policyname = 'hydration_logs_delete_own'
  ) THEN
    CREATE POLICY "hydration_logs_delete_own" ON hydration_logs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── meal_plans ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_days INTEGER NOT NULL DEFAULT 3,
  meals_json JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calories_target INTEGER,
  protein_target INTEGER,
  context TEXT CHECK (context IS NULL OR context IN ('normal','viagem','estresse','academia','restricao'))
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user
  ON meal_plans(user_id, generated_at DESC);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'meal_plans_select_own'
  ) THEN
    CREATE POLICY "meal_plans_select_own" ON meal_plans
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'meal_plans_insert_own'
  ) THEN
    CREATE POLICY "meal_plans_insert_own" ON meal_plans
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'meal_plans_update_own'
  ) THEN
    CREATE POLICY "meal_plans_update_own" ON meal_plans
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'meal_plans_delete_own'
  ) THEN
    CREATE POLICY "meal_plans_delete_own" ON meal_plans
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  rc_customer_id TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  product_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_select_own'
  ) THEN
    CREATE POLICY "subscriptions_select_own" ON subscriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_insert_own'
  ) THEN
    CREATE POLICY "subscriptions_insert_own" ON subscriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_update_own'
  ) THEN
    CREATE POLICY "subscriptions_update_own" ON subscriptions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_delete_own'
  ) THEN
    CREATE POLICY "subscriptions_delete_own" ON subscriptions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
