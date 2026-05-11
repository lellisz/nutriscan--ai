# Migration Notes — PRAXIS Nutrition

Documentação das migrations 006-010 e decisões de schema.

## Decisão canônica de PK em `profiles`

A coluna canônica de chave primária em `profiles` é **`user_id`** (UUID), com FK para `auth.users(id) ON DELETE CASCADE`.

Justificativa:
- 002, 003 e 005 já usam `profiles(user_id)`.
- 001 originalmente declarou `id`, mas em ambientes legados (v1/v2) `profiles` já era `user_id`. 002 ALTERa profiles assumindo `user_id`.
- 004 (food_logs) era a única migration desviante (referenciava `profiles(id)` e usava `"userId"` em camelCase). 006 corrige.

A migration 006 é idempotente: renomeia `id → user_id` em `profiles` e em `food_logs."userId" → user_id` apenas se necessário, e recria a FK apontando para `profiles(user_id)`.

## Cleanup

Apagado: `20260427214932_fix_consents_fkey.sql` (arquivo vazio, 0 bytes).

## Migrations 006–010

### 006 — Unificação de PK de `profiles`
- Garante `profiles.user_id` como PK.
- Renomeia `food_logs."userId"` → `food_logs.user_id`.
- Drop FK antiga (`profiles.id`) e recria com `profiles.user_id`.
- Substitui policy `FOR ALL` em `food_logs` por **4 policies granulares** (SELECT, INSERT, UPDATE, DELETE) com `WITH CHECK`.
- Tabelas novas: 0. Policies novas: 4.

### 007 — Tabelas AI/ML
- `meal_photos` (storage_path, analysis_json, confidence)
- `daily_insights` (kind: nutrition/sleep/activity/glucose/behavior)
- `glucose_predictions` (peak_mmol, area_under_curve, recommendation)
- RLS granular (4 policies por tabela = 12 policies)
- Indexes em `(user_id, created_at DESC)`, `(user_id, date DESC)` e parciais.
- Tabelas novas: 3. Policies novas: 12.

### 008 — Gamificação
- Catálogos públicos: `achievements`, `quests` (RLS habilitada, SELECT público; INSERT/UPDATE/DELETE só via service_role).
- Tabelas user: `user_achievements`, `user_quests`, `streak_state` (4 policies cada).
- **Seeds:** 8 achievements, 6 quests daily, 2 quests monthly.
- Tabelas novas: 5. Policies novas: 14 (2 públicas + 12 user).

### 009 — Social / Buddy
- `partner_invites` (SELECT por inviter ou accepted_by; INSERT só inviter).
- `recipes` (SELECT se `is_public=true OR auth.uid()=author_id`).
- `recipe_shares` (SELECT por shared_by ou shared_with).
- `cohort_buckets` (catálogo público agregado, k-anonimato `sample_size >= 10`; INSERT/UPDATE/DELETE via service_role).
- Tabelas novas: 4. Policies novas: 13 (4+4+4+1).

### 010 — Wearables
- `wearable_metrics` (source: healthkit/health_connect/manual; metric_type controlado por CHECK).
- `sync_log` (status: success/partial/failed).
- ALTER `daily_logs` adicionando `steps`, `resting_hr`, `sleep_quality`, `hrv_score` (`IF NOT EXISTS`).
- Tabelas novas: 2. Policies novas: 8.

## Resumo Quantitativo

| Migration | Tabelas novas | Policies novas |
|-----------|--------------:|---------------:|
| 006       | 0             | 4              |
| 007       | 3             | 12             |
| 008       | 5             | 14             |
| 009       | 4             | 13             |
| 010       | 2             | 8              |
| **Total** | **14**        | **51**         |

## Ordem de Execução Recomendada

```
001_praxis_v3.sql                  (base v3 inicial)
002_praxis_v3_additive.sql         (aditivo, profiles → user_id)
003_weight_logs.sql
004_food_logs.sql
005_reminders.sql
006_unify_profiles_pk.sql          (NORMALIZA food_logs e PK)
007_ai_ml_tables.sql
008_gamification_tables.sql
009_buddy_social_tables.sql
010_wearable_tables.sql
```

## Convenções aplicadas em 006–010

1. **Idempotência total:** `IF EXISTS` / `IF NOT EXISTS` em todas as criações; `DO $$ ... $$` para renomeações condicionais; `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`; `ON CONFLICT DO NOTHING` em seeds.
2. **RLS sempre habilitada** com `ENABLE ROW LEVEL SECURITY` em toda tabela nova (incluindo catálogos públicos).
3. **Policies granulares:** SELECT, INSERT, UPDATE, DELETE separadas; `WITH CHECK` em INSERT/UPDATE.
4. **Catálogos públicos** (`achievements`, `quests`, `cohort_buckets`): só policy de SELECT pública; mutações exigem `service_role` (sem policy).
5. **Indexes:** `(user_id, <timestamp> DESC)` para queries comuns; índices parciais quando há filtro óbvio (ex. `WHERE dismissed = false`).
6. **CHECK constraints** em campos com domínio fechado (kind, source, metric_type, status).
7. **k-anonimato** em `cohort_buckets`: `sample_size >= 10` enforced no schema.

## Red-Team Checks pós-migration

Executar no SQL Editor após aplicar:

```sql
-- Tabelas sem RLS habilitada
SELECT tablename FROM pg_tables
WHERE schemaname='public' AND rowsecurity=false;

-- Policies permissivas (qual='true') fora dos catálogos esperados
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND qual='true'
  AND tablename NOT IN ('achievements','quests','cohort_buckets');

-- Buckets de storage públicos
SELECT id, name, public FROM storage.buckets WHERE public=true;
```
