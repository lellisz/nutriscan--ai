# daily-insights

Gera 3 insights acionáveis para o usuário, baseados em `daily_logs` (7d), `meals` (3d) e
`behavior_patterns` (30d). Persiste em `daily_insights`.

## Rota

`POST /functions/v1/daily-insights`

## Modos

### Modo 1 — Manual (per-user)

Auth: JWT do próprio user OU `service_role`.

Body:
```json
{ "user_id": "uuid", "date": "2026-05-06" }
```

- `date` opcional (default = hoje, formato `YYYY-MM-DD`)
- Se autenticado como user, `user_id` no body deve coincidir com o user do JWT (senão 403)
- Service role pode gerar para qualquer user

Response:
```json
{
  "count": 3,
  "date": "2026-05-06",
  "insights": [
    { "kind": "nutrition", "title": "Aumente proteína no almoço", "body": "Adicione 30g de frango ou ovo. Você ficou 25g abaixo da meta ontem.", "priority": 2 },
    { "kind": "sleep", "title": "Durma 30min mais cedo", "body": "Sono médio 5.8h nos últimos 3 dias. Alvo: 7h.", "priority": 1 },
    { "kind": "activity", "title": "Caminhada de 15min", "body": "Após o jantar, ajuda no controle glicêmico.", "priority": 0 }
  ]
}
```

### Modo 2 — Cron (batch)

Auth: `service_role` obrigatório.

Body: vazio ou `{}`. Processa TODOS users com `daily_logs` para ontem (UTC).

Response:
```json
{
  "mode": "cron",
  "date": "2026-05-06",
  "total_users": 42,
  "success": 41,
  "failed": 1,
  "results": [{ "user_id": "...", "ok": true, "count": 3 }]
}
```

## Errors

| Status | Causa |
|--------|-------|
| 400 | body JSON inválido |
| 401 | sem Authorization |
| 403 | user JWT pedindo insights de outro user, ou cron sem service_role |
| 405 | método ≠ POST |
| 500 | erro interno |

## Tabela esperada (Agent 1)

```sql
create table daily_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('nutrition','sleep','activity','glucose','behavior')),
  title text not null,
  body text not null,
  priority smallint not null default 1,
  created_at timestamptz default now()
);
```

## curl — manual

```bash
curl -X POST "$SUPABASE_URL/functions/v1/daily-insights" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$MY_USER_ID\",\"date\":\"2026-05-06\"}"
```

## curl — cron

```bash
curl -X POST "$SUPABASE_URL/functions/v1/daily-insights" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Schedule sugerido (UTC): `0 9 * * *` (06:00 BRT) via cron externo (GitHub Actions, pg_cron, etc).

## Deploy

```bash
supabase functions deploy daily-insights
```

## Env vars

- `GROQ_API_KEY` (obrigatório)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-injetados)
