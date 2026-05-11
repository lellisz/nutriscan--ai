-- ============================================================
-- PRAXIS Nutrition — Social / Buddy / Receitas / Cohort
-- partner_invites, recipes, recipe_shares, cohort_buckets
-- ============================================================

-- ── partner_invites ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ,
  accepted_by  UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_invites_select_involved" ON partner_invites;
DROP POLICY IF EXISTS "partner_invites_insert_inviter"  ON partner_invites;
DROP POLICY IF EXISTS "partner_invites_update_involved" ON partner_invites;
DROP POLICY IF EXISTS "partner_invites_delete_inviter"  ON partner_invites;

-- SELECT: inviter ou quem aceitou podem ler
CREATE POLICY "partner_invites_select_involved"
  ON partner_invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = accepted_by);

-- INSERT: somente o proprio inviter
CREATE POLICY "partner_invites_insert_inviter"
  ON partner_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- UPDATE: inviter (revogar) ou quem esta aceitando (set accepted_by/at)
CREATE POLICY "partner_invites_update_involved"
  ON partner_invites FOR UPDATE
  USING (auth.uid() = inviter_id OR auth.uid() = accepted_by)
  WITH CHECK (auth.uid() = inviter_id OR auth.uid() = accepted_by);

-- DELETE: somente inviter
CREATE POLICY "partner_invites_delete_inviter"
  ON partner_invites FOR DELETE
  USING (auth.uid() = inviter_id);

CREATE INDEX IF NOT EXISTS partner_invites_code_idx
  ON partner_invites (code);

CREATE INDEX IF NOT EXISTS partner_invites_inviter_created_idx
  ON partner_invites (inviter_id, created_at DESC);


-- ── recipes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  ingredients   JSONB,
  macros        JSONB,
  prep_minutes  INT,
  is_public     BOOLEAN DEFAULT false NOT NULL,
  share_count   INT DEFAULT 0 NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select_public_or_own" ON recipes;
DROP POLICY IF EXISTS "recipes_insert_own"           ON recipes;
DROP POLICY IF EXISTS "recipes_update_own"           ON recipes;
DROP POLICY IF EXISTS "recipes_delete_own"           ON recipes;

-- SELECT: publicas OU minhas
CREATE POLICY "recipes_select_public_or_own"
  ON recipes FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

-- INSERT: somente como autor
CREATE POLICY "recipes_insert_own"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- UPDATE: somente o autor
CREATE POLICY "recipes_update_own"
  ON recipes FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- DELETE: somente o autor
CREATE POLICY "recipes_delete_own"
  ON recipes FOR DELETE
  USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS recipes_author_created_idx
  ON recipes (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recipes_public_created_idx
  ON recipes (created_at DESC) WHERE is_public = true;


-- ── recipe_shares ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_shares (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  shared_by        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  shared_with      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  deep_link_token  TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_shares_select_involved" ON recipe_shares;
DROP POLICY IF EXISTS "recipe_shares_insert_sharer"   ON recipe_shares;
DROP POLICY IF EXISTS "recipe_shares_update_sharer"   ON recipe_shares;
DROP POLICY IF EXISTS "recipe_shares_delete_sharer"   ON recipe_shares;

-- SELECT: quem compartilhou ou quem recebeu
CREATE POLICY "recipe_shares_select_involved"
  ON recipe_shares FOR SELECT
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "recipe_shares_insert_sharer"
  ON recipe_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "recipe_shares_update_sharer"
  ON recipe_shares FOR UPDATE
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "recipe_shares_delete_sharer"
  ON recipe_shares FOR DELETE
  USING (auth.uid() = shared_by);

CREATE INDEX IF NOT EXISTS recipe_shares_recipe_idx
  ON recipe_shares (recipe_id);

CREATE INDEX IF NOT EXISTS recipe_shares_token_idx
  ON recipe_shares (deep_link_token);


-- ── cohort_buckets (analytics agregados, k>=10) ──────────────
CREATE TABLE IF NOT EXISTS cohort_buckets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key      TEXT NOT NULL,
  metric          TEXT NOT NULL,
  percentile_p10  NUMERIC,
  percentile_p50  NUMERIC,
  percentile_p90  NUMERIC,
  sample_size     INT NOT NULL CHECK (sample_size >= 10),
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (bucket_key, metric)
);

ALTER TABLE cohort_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cohort_buckets_select_public" ON cohort_buckets;

-- SELECT publico (dados ja agregados, k-anonimato >= 10)
CREATE POLICY "cohort_buckets_select_public"
  ON cohort_buckets FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: apenas via service_role (sem policies => bloqueado)

CREATE INDEX IF NOT EXISTS cohort_buckets_bucket_metric_idx
  ON cohort_buckets (bucket_key, metric);
