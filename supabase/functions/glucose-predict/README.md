# glucose-predict

Prediz pico glicêmico pós-refeição via heurística determinística + Gemini para refinar a
recomendação textual. Persiste em `glucose_predictions`.

## Rota

`POST /functions/v1/glucose-predict`

## Auth

Header `Authorization: Bearer <user_jwt>` obrigatório.

## Request

```json
{
  "meal": {
    "calories": 600,
    "carbs_g": 75,
    "protein_g": 30,
    "fat_g": 20,
    "fiber_g": 5
  },
  "context": {
    "hours_since_last_meal": 4,
    "exercise_today_min": 0,
    "sleep_hours_last_night": 6.5,
    "stress_level": 3
  }
}
```

`stress_level` é um inteiro 1-5. Todos os campos são opcionais exceto que `meal` precisa ter
ao menos um macro (`carbs_g`, `calories`, `protein_g` ou `fat_g`).

## Response 200

```json
{
  "peak_mmol": 8.21,
  "auc": 4.07,
  "recommendation": "Pico estimado 8.2 mmol/L. Considere caminhar 15min após a refeição.",
  "predicted_at": "2026-05-06T13:42:11.123Z"
}
```

## Heurística

```
base = 5.5
delta = carbs*0.04 - fiber*0.05 - protein*0.01 - fat*0.005
sleep_penalty = sleep_hours_last_night < 6 ? +0.4 : 0
stress_penalty = stress_level >= 4 ? +0.3 : 0
exercise_bonus = exercise_today_min > 30 ? -0.4 : 0
peak = clamp(base + delta + penalties + bonus, 4.0, 12.0)
auc  = max(0, peak - 5.5) * 1.5  // área triangular acima do baseline
```

## Recomendação

Tenta Gemini (`gemini-2.5-flash-exp`); se `GEMINI_API_KEY` ausente ou Gemini falhar, usa
fallback heurístico:
- `peak >= 9.0` → "Considere caminhar 15min após a refeição"
- `peak >= 7.5` → "Caminhada leve de 10min" ou "Adicione fibras na próxima refeição"
- `peak <= 5.5` → "Bom equilíbrio — mantenha o padrão"
- caso contrário → "Adicione fibras na próxima refeição"

## Errors

| Status | Causa |
|--------|-------|
| 400 | body inválido / nenhum macro fornecido |
| 401 | JWT ausente ou inválido |
| 405 | método ≠ POST |
| 500 | erro interno |

## Tabela esperada (Agent 1)

```sql
create table glucose_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_calories numeric,
  meal_carbs_g numeric,
  meal_protein_g numeric,
  meal_fat_g numeric,
  meal_fiber_g numeric,
  hours_since_last_meal numeric,
  exercise_today_min numeric,
  sleep_hours_last_night numeric,
  stress_level smallint,
  peak_mmol numeric not null,
  auc numeric not null,
  recommendation text,
  predicted_at timestamptz not null default now()
);
```

## curl

```bash
curl -X POST "$SUPABASE_URL/functions/v1/glucose-predict" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "meal": { "calories": 600, "carbs_g": 75, "protein_g": 30, "fat_g": 20, "fiber_g": 5 },
    "context": { "hours_since_last_meal": 4, "exercise_today_min": 0, "sleep_hours_last_night": 6.5, "stress_level": 3 }
  }'
```

## Deploy

```bash
supabase functions deploy glucose-predict
```

## Env vars

- `GEMINI_API_KEY` (opcional — fallback heurístico se ausente)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-injetados)
