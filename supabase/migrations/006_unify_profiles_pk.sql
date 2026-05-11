-- ============================================================
-- PRAXIS Nutrition — Unificacao da PK canonica de profiles
-- Decisao: profiles.user_id e a chave canonica
-- (alinha com auth.users via FK -> auth.users.id)
-- ============================================================
-- Objetivo:
--   Garantir consistencia das FKs entre 001/002/003/004.
--   Migration 004 referencia profiles(id) com coluna "userId".
--   Esta migration normaliza para profiles(user_id) e snake_case.
-- Idempotente: pode ser aplicada multiplas vezes sem efeito colateral.
-- ============================================================

-- ── Garantia: profiles deve ter coluna user_id ───────────────
-- (Em 001 a coluna se chamava 'id'. Caso o ambiente legado
--  ainda use 'id', renomeamos. Nada acontece se 'user_id' ja existir.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles RENAME COLUMN id TO user_id';
  END IF;
END $$;

-- Garantia adicional: PK em user_id
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO pk_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_schema = 'public'
    AND tc.table_name   = 'profiles'
    AND tc.constraint_type = 'PRIMARY KEY'
  LIMIT 1;

  IF pk_name IS NULL THEN
    EXECUTE 'ALTER TABLE public.profiles ADD PRIMARY KEY (user_id)';
  END IF;
END $$;

-- ── food_logs: normalizar coluna "userId" -> user_id ─────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'food_logs'
      AND column_name  = 'userId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'food_logs'
      AND column_name  = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.food_logs RENAME COLUMN "userId" TO user_id';
  END IF;
END $$;

-- ── food_logs: drop FK antiga (-> profiles.id) e recriar ─────
DO $$
DECLARE
  fk_rec RECORD;
BEGIN
  FOR fk_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    WHERE tc.table_schema   = 'public'
      AND tc.table_name     = 'food_logs'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name   = 'user_id'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS %I',
      fk_rec.constraint_name
    );
  END LOOP;
END $$;

-- Recriar FK -> profiles(user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'food_logs'
  ) THEN
    BEGIN
      ALTER TABLE public.food_logs
        ADD CONSTRAINT food_logs_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ── Recriar policy do food_logs com nome de coluna correto ───
DROP POLICY IF EXISTS "user_own_food_logs" ON public.food_logs;

CREATE POLICY "food_logs_select_own"
  ON public.food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "food_logs_insert_own"
  ON public.food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "food_logs_update_own"
  ON public.food_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "food_logs_delete_own"
  ON public.food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── Indice atualizado para snake_case ────────────────────────
DROP INDEX IF EXISTS public.food_logs_user_logged_at;
CREATE INDEX IF NOT EXISTS food_logs_user_logged_at_idx
  ON public.food_logs (user_id, logged_at DESC);
