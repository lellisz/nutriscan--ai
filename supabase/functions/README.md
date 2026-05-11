# PRAXIS Nutrition — Supabase Edge Functions

Runtime: Deno + TypeScript. Deploy via `supabase functions deploy <nome>`.

## Funções

| # | Nome | Rota | Método | Auth | Propósito |
|---|------|------|--------|------|-----------|
| 1 | `coach` | `/functions/v1/coach` | POST | user JWT | Coach Praxi (Groq llama-3.3-70b) com anti prompt-injection. Usa contexto de `daily_logs` + histórico de `coach_messages`. |
| 2 | `export-data` | `/functions/v1/export-data` | GET/POST | user JWT | Portabilidade LGPD Art. 18 — exporta TODOS dados do user em JSON. |
| 3 | `delete-account` | `/functions/v1/delete-account` | POST | user JWT | Direito ao Esquecimento LGPD — delete cascateado + `auth.admin.deleteUser`. Exige body `{confirm:"DELETE_MY_ACCOUNT"}`. |
| 4 | `voice-transcribe` | `/functions/v1/voice-transcribe` | POST | user JWT | Áudio base64 → transcript (Whisper) → ParsedMeal estruturado (Groq). |
| 5 | `daily-insights` | `/functions/v1/daily-insights` | POST | user JWT ou service_role | 3 insights diários acionáveis. Modo manual (per-user) ou cron (todos users com daily_log de ontem). |
| 6 | `glucose-predict` | `/functions/v1/glucose-predict` | POST | user JWT | Pico/AUC glicêmico via heurística + recomendação Gemini (com fallback). |

## Estrutura

```
supabase/functions/
  _shared/
    auth.ts        # getUserFromAuthHeader, isServiceRoleToken, getServiceClient
    groq.ts        # callGroq, transcribeAudioGroq, extractJson
    gemini.ts      # callGemini, isGeminiAvailable
  coach/           # existente
  export-data/     # existente
  delete-account/  # existente
  voice-transcribe/  # NOVA
  daily-insights/    # NOVA
  glucose-predict/   # NOVA
```

## Variáveis de ambiente

| Var | Onde | Obrigatório | Funções |
|-----|------|-------------|---------|
| `GROQ_API_KEY` | secrets | sim | coach, voice-transcribe, daily-insights |
| `GEMINI_API_KEY` | secrets | opcional (fallback) | glucose-predict |
| `SUPABASE_URL` | auto-injetado | sim | todas |
| `SUPABASE_SERVICE_ROLE_KEY` | auto-injetado | sim | todas |

Configurar segredos:

```bash
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set GEMINI_API_KEY=AIza...     # opcional
```

## Deploy

```bash
# tudo de uma vez
supabase functions deploy coach
supabase functions deploy export-data
supabase functions deploy delete-account
supabase functions deploy voice-transcribe
supabase functions deploy daily-insights
supabase functions deploy glucose-predict

# ou batch
for fn in coach export-data delete-account voice-transcribe daily-insights glucose-predict; do
  supabase functions deploy "$fn"
done
```

## Tabelas dependentes (Agent 1)

As novas functions assumem que existem:

- `daily_insights` — usada por `daily-insights`
- `glucose_predictions` — usada por `glucose-predict`
- `behavior_patterns` — leitura por `daily-insights` (opcional, tolerante se ausente)
- `security_log` — usada por `_shared/auth.ts` para registrar falhas de auth

## CORS

Todas as 3 novas usam `Access-Control-Allow-Origin: *`. As existentes (coach, delete-account)
mantêm origin allowlist mais estrita.

## Smoke test rápido

```bash
# JWT de um user real
USER_JWT="eyJhbGciOi..."
SUPABASE_URL="https://xxxxx.supabase.co"

# 1) glucose-predict
curl -X POST "$SUPABASE_URL/functions/v1/glucose-predict" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"meal":{"calories":600,"carbs_g":75,"protein_g":30,"fat_g":20,"fiber_g":5},"context":{"hours_since_last_meal":4,"exercise_today_min":0,"sleep_hours_last_night":6.5,"stress_level":3}}'

# 2) daily-insights (manual)
curl -X POST "$SUPABASE_URL/functions/v1/daily-insights" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<MEU_USER_ID>"}'

# 3) voice-transcribe — requer áudio real
B64=$(base64 -w0 sample.m4a)
curl -X POST "$SUPABASE_URL/functions/v1/voice-transcribe" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"audioBase64\":\"$B64\",\"mimeType\":\"audio/m4a\"}"
```
