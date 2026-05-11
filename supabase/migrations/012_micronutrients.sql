-- ============================================================
-- Migration 012: Micronutrientes em food_logs
-- Adiciona colunas para dados da tabela TACO (UNICAMP)
-- Idempotente: ADD COLUMN IF NOT EXISTS
-- ============================================================

-- Verifica se a tabela food_logs existe antes de alterar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_logs') THEN
    -- Sódio (mg)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'food_logs' AND column_name = 'sodio_mg'
    ) THEN
      ALTER TABLE food_logs ADD COLUMN sodio_mg REAL CHECK (sodio_mg IS NULL OR sodio_mg >= 0);
    END IF;

    -- Cálcio (mg)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'food_logs' AND column_name = 'calcio_mg'
    ) THEN
      ALTER TABLE food_logs ADD COLUMN calcio_mg REAL CHECK (calcio_mg IS NULL OR calcio_mg >= 0);
    END IF;

    -- Ferro (mg)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'food_logs' AND column_name = 'ferro_mg'
    ) THEN
      ALTER TABLE food_logs ADD COLUMN ferro_mg REAL CHECK (ferro_mg IS NULL OR ferro_mg >= 0);
    END IF;

    -- Vitamina C (mg)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'food_logs' AND column_name = 'vitc_mg'
    ) THEN
      ALTER TABLE food_logs ADD COLUMN vitc_mg REAL CHECK (vitc_mg IS NULL OR vitc_mg >= 0);
    END IF;

    -- Vitamina A (mcg)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'food_logs' AND column_name = 'vita_mcg'
    ) THEN
      ALTER TABLE food_logs ADD COLUMN vita_mcg REAL CHECK (vita_mcg IS NULL OR vita_mcg >= 0);
    END IF;
  END IF;
END $$;

-- Índice para queries por usuário e data (se não existir)
-- Nota: food_logs usa "userId" (camelCase) como FK, não user_id
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON food_logs("userId", logged_at DESC);
