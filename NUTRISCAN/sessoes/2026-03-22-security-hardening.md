---
tags: [sessao, nutriscan, praxis-nutri, seguranca, red-team, blue-team]
data: 2026-03-22
---

## Feito hoje (auditoria de seguranca massiva — 2 ciclos)

### Ciclo 1 — Triagem inicial (3 agentes paralelos)

Lancados 3 agentes simultaneos para primeira passada de seguranca:

**Backend Security Agent** (correcoes diretas)
- Criou funcao `validateAuth()` em `api/scan.js` e `api/chat.js` — valida JWT via Supabase auth.getUser()
- Removeu CORS wildcard (fallback `*`) — agora exige `ALLOWED_ORIGIN` definida
- Adicionou rate limiter no chat.js (20 msgs/minuto por usuario)
- Criou funcao `sanitizeUserMessage()` no chat.js — strip HTML, bloqueio de prompt injection
- Adicionou instrucao anti-injection no system prompt do coach
- Sanitizou error messages — detalhes internos nao vazam mais para o cliente
- Adicionou `SUPABASE_ANON_KEY` ao `.env.example`

**Arquiteto Security Agent** (frontend + database)
- Adicionou Authorization header automatico no `src/lib/api/client.js` (metodo `_getAccessToken()`)
- Adicionou Authorization header no `CoachChatPage.jsx` (usava fetch direto sem token)
- Adicionou RLS na tabela `rate_limit_hits` (unica sem RLS)
- Criou security headers em `netlify.toml` e `vercel.json` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Documentou bug no Obsidian: `bugs/bug-security-audit-frontend-db.md`

**Red Team Agent** (relatorio de vulnerabilidades)
- Encontrou 16 vulnerabilidades no total
- 2 criticas: credenciais no git history + premium escalation sem pagamento
- 5 altas: rate limiter bypass, IDOR scan_history, CORS dev-server, chat sem auth, chat sem rate limit
- 4 medias: prompt injection, cache, error messages, mediaType

### Correcoes manuais pos-Ciclo 1
- Adicionou policy UPDATE para `scan_history` no `schema.sql`
- Protegeu `is_premium` e `free_scans_limit` na policy `profiles_update_own` com subquery (impede escalacao de privilegio via cliente)
- Adicionou guard de producao no `dev-server.js` (`process.exit(1)` se `NODE_ENV === production`)
- Corrigiu rate limiter bypass: rejeita requests sem userId em vez de permitir
- Adicionou rate limiting por IP como fallback quando sem userId
- Restringiu `mediaType` para whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`
- Adicionou defesa em profundidade no `db.js`: `updateScanHistory` e `deleteScanHistory` aceitam `userId` como filtro adicional
- Bloqueou `handleSubscribe` no `SubscriptionPage.jsx` — removeu chamada direta a `updatePremiumStatus`, mostra mensagem "Pagamento ainda nao integrado"
- Adicionou `Authorization` ao CORS Allow-Headers do `dev-server.js`

### Ciclo 2 — Ataque massivo (3 agentes Opus/Haiku)

**Red Team (Opus 4.6)** — 5 fases de ataque
- Reconhecimento completo: mapeou todos endpoints, tabelas, policies
- Encontrou 11 vulnerabilidades (2 criticas, 5 altas, 4 medias)
- Confirmou que credenciais no git history sao o risco numero 1
- Identificou policies DELETE faltando em `profiles`, `daily_goals`, `hydration_logs`
- Identificou `updateChatConversation` aceita spread sem whitelist
- Documentou em `docs/security/red-team-report.md`

**Blue Team (Opus 4.6)** — 7 blocos de defesa
- Corrigiu 15 de 17 vulnerabilidades encontradas
- Tornou JWT obrigatorio em `api/scan.js` (userId vem do token, nao do body)
- Reduziu limite de imageBase64 de 20MB para 7MB
- Sanitizou prompt injection via `dietary_restrictions` e `full_name`
- Adicionou policies RLS faltantes em `user_insights`, `profiles`, `daily_goals`, `hydration_logs`
- Adicionou HSTS em `vercel.json` e `netlify.toml`
- Reescreveu `.gitignore` com encoding correto
- Build verificado com sucesso
- Documentou em `docs/security/blue-team-report.md`
- 2 itens para fase futura: rate limiter in-memory (precisa Redis) e Gemini API key na URL

**Auditor (Haiku 4.5)** — documentacao completa
- Criou 7 documentos em `docs/security/`:
  - `README.md` — indice central
  - `QUICK-START.md` — TL;DR
  - `security-state.md` — estado vivo do sistema
  - `threat-model.md` — modelo de ameacas
  - `architecture-decisions.md` — 12 decisoes documentadas
  - `incident-log.md` — historico de incidentes
  - `cycle-report-1.md` — relatorio executivo

### Infraestrutura de Claude Code
- Criado skill `/context-load` em `~/.claude/skills/context-load/SKILL.md`
- Configurado hook `Stop` que lembra de rodar `/obsidian` ao final de sessoes
- Adicionada permissao `Skill(context-load)` no `settings.local.json`

## Bugs corrigidos (seguranca)

| Bug | Severidade | Arquivo | Fix |
|-----|-----------|---------|-----|
| APIs sem autenticacao JWT | Critico | `api/scan.js`, `api/chat.js` | `validateAuth()` obrigatorio |
| Frontend sem Authorization header | Critico | `src/lib/api/client.js`, `CoachChatPage.jsx` | Bearer token automatico |
| Premium escalation sem pagamento | Critico | `schema.sql`, `SubscriptionPage.jsx` | RLS protege is_premium + frontend bloqueado |
| CORS wildcard | Alto | `api/scan.js`, `api/chat.js` | ALLOWED_ORIGIN obrigatoria |
| Chat sem rate limiting | Alto | `api/chat.js` | 20 msgs/min por usuario |
| Rate limiter bypass sem userId | Alto | `api/scan.js` | Rejeita + fallback por IP |
| IDOR scan_history (falta UPDATE RLS) | Alto | `schema.sql`, `db.js` | Policy UPDATE + filtro userId |
| dev-server sem guard de producao | Alto | `api/dev-server.js` | `process.exit(1)` em producao |
| Erros internos expostos | Medio | `api/chat.js` | Mensagens genericas |
| Prompt injection no chat | Medio | `api/chat.js` | Sanitizacao + instrucao anti-injection |
| Security headers faltando | Medio | `netlify.toml`, `vercel.json` | CSP, HSTS, X-Frame-Options |
| RLS incompleto | Medio | `schema.sql` | Policies para todas tabelas/operacoes |
| mediaType sem whitelist | Medio | `api/scan.js` | Enum restrito |
| imageBase64 20MB | Medio | `api/scan.js` | Reduzido para 7MB |
| Prompt injection via perfil | Medio | `api/chat.js` | Sanitizacao de full_name e dietary_restrictions |

## Decisoes tomadas
- [[decisao-security-hardening]] — Auditoria de seguranca com modelo Red Team vs Blue Team
- [[decisao-premium-rls-protection]] — Protecao de is_premium via RLS com subquery

## Estado do projeto apos esta sessao
- Seguranca drasticamente melhorada: JWT obrigatorio, RLS completo, rate limiting, CORS blindado
- Build limpo apos todas as correcoes
- Documentacao de seguranca completa em `docs/security/`
- PENDENTE URGENTE: revogar chaves expostas no git history (GROQ, GEMINI, SUPABASE, GITHUB)
- PENDENTE: integrar gateway de pagamento para premium (SubscriptionPage bloqueada)
- PENDENTE: migrar rate limiter para Redis/Upstash
- PENDENTE: ciclos semanais, InsightsPage, testes, CI/CD

## Prompt de continuidade
```
Continuando Praxis Nutri de 2026-03-22.
Auditoria de seguranca completa (2 ciclos, 6 agentes). 15+ vulnerabilidades corrigidas.
JWT obrigatorio, RLS completo, rate limiting, CORS blindado, security headers.
URGENTE: revogar chaves expostas no git (GROQ, GEMINI, SUPABASE, GITHUB).
Pendente: gateway pagamento, Redis rate limiter, ciclos semanais, InsightsPage, testes.
```

## Links
- [[Coach Nutri]]
- [[decisao-security-hardening]]
- [[decisao-premium-rls-protection]]
