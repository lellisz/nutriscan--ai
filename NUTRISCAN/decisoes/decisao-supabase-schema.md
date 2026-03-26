---
tags: [decisao, nutriscan, database, supabase, arquitetura]
data: 2026-03-13
---

## Contexto
Precisamos de banco de dados para auth, perfis, scans, logs e chat. Opcoes: Firebase, Supabase, Planetscale, banco proprio.

## Decisao
**Supabase** (PostgreSQL gerenciado) com Row Level Security (RLS).

### Tabelas
| Tabela | Chave | Uso |
|---|---|---|
| `profiles` | `user_id` (PK, FK auth.users) | Perfil do usuario |
| `daily_goals` | `user_id` (PK) | Metas nutricionais |
| `scan_history` | `id` (UUID) | Historico de scans |
| `weight_logs` | `id` + unique(user_id, logged_at) | Registro de peso |
| `workout_logs` | `id` | Registro de treinos |
| `hydration_logs` | `id` + unique(user_id, logged_at) | Registro de hidratacao |
| `user_insights` | `id` | Insights gerados |
| `chat_conversations` | `id` | Conversas do Coach |
| `chat_messages` | `id` | Mensagens do Coach |

### RLS (Row Level Security)
**Todas as tabelas** tem RLS ativado com politicas `auth.uid() = user_id`:
- `_select_own` → usuario so le seus proprios dados
- `_insert_own` → usuario so insere com seu ID
- `_update_own` → usuario so atualiza seus dados
- `_delete_own` → usuario so deleta seus dados

**Nenhuma tabela e publica.** Sem acesso administrativo via client.

## Motivo
- PostgreSQL e robusto e familiar
- RLS elimina necessidade de middleware de autorizacao
- Auth integrado (JWT, OAuth, email)
- Tier gratuito generoso para MVP
- SDK JavaScript nativo

## Quando revisar
- Se precisar de queries complexas que RLS torna lentas
- Se tier gratuito nao for suficiente (upgrade ou migrar)

## Referencias
- [[bug-upsert-logs-duplicados]] — pattern de upsert
- [[bug-maybe-single-query]] — pattern de query
- [[bug-profile-duplicado]] — constraint handling
- [[Coach Nutri]]
