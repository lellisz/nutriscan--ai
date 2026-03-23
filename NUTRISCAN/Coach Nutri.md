# Praxis Nutri (antigo NutriScan)

> App de nutricao com IA de precisao. Escaneia alimentos, recebe veredicto contextual, acompanha progresso em ciclos semanais. Portugues (pt-BR), expansao global planejada.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18.3 + Vite 5.3 + React Router 7 |
| Backend | Vercel serverless functions (`api/`) |
| Database | Supabase (PostgreSQL + RLS) |
| IA (scan) | Groq (llama-3.2-90b-vision) → Anthropic (Claude) → Gemini → Ollama |
| IA (coach) | Groq (llama-3.1-8b) → Anthropic → Gemini (flash-lite) → Ollama |
| Validacao | Zod |
| Charts | Recharts |
| Monitoring | Sentry |
| Styling | CSS custom design system (sem Tailwind) |
| Deploy | Netlify (frontend) + Vercel (API) |

---

## Status Atual

**Fase:** 2 de 3 — Reliability & Features
**Bloqueador:** Nenhum

### Fase 1 — COMPLETA
Auth, onboarding, scan IA, dashboard, historico, router, design system.

### Fase 2 — EM ANDAMENTO
- [x] Coach IA conversacional ("Coach Praxis")
- [x] Sentry frontend
- [x] Rate limiting + Zod validation
- [x] Migration Coach no Supabase
- [x] Rebrand Praxis Nutri (paleta verde petroleo, identidade propria)
- [x] Dashboard conectado a dados reais
- [x] ProfilePage com menu funcional (dados pessoais, metas, logout)
- [x] Veredicto contextual no scan (verdict + next_action)
- [x] Precisao IA (TACO/USDA, regras de arredondamento)
- [x] Acessibilidade (aria-labels, htmlFor, role=dialog)
- [x] Emojis removidos → SVGs
- [x] MCP Servers configurados (Supabase read-only, Context7, GitHub)
- [x] GitHub CLI autenticado (usuario lellisz)
- [x] Auditoria de seguranca completa (2 ciclos Red Team vs Blue Team)
- [x] JWT obrigatorio em todas as APIs (scan + chat)
- [x] RLS completo com policies para todas tabelas/operacoes
- [x] Rate limiting (scan + chat) com fallback por IP
- [x] CORS blindado (sem wildcard, ALLOWED_ORIGIN obrigatoria)
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] Premium escalation bloqueado via RLS subquery
- [x] Documentacao de seguranca completa (docs/security/)
- [x] Chaves Groq e Gemini rotacionadas (2026-03-22)
- [x] Gemini adicionado como fallback no Coach IA (4 providers)
- [x] Frontend do chat melhorado (auto-scroll, textarea, timeout, erros amigaveis)
- [x] InsightsPage conectada a dados reais (confirmado 2026-03-22)
- [x] Fix retry 401 no Anthropic (nao retenta em auth error)
- [x] Fix `system_instruction` camelCase no Gemini scan (causava 502)
- [x] Fix Zod v4 `err.errors` → `err.issues` no chat
- [x] Fix retry auth engolido no scan (3 providers)
- [x] Fix botao onboarding sobre navbar
- [x] Login social (Google + Apple) nas telas de signin/signup
- [x] Dev account (role dev/admin bypassa paywall + rate limit)
- [ ] Rotacionar Supabase service_role_key (exposta no git history)
- [ ] Adicionar creditos na conta Anthropic (saldo zerado)
- [ ] Integrar gateway de pagamento (SubscriptionPage bloqueada)
- [ ] Migrar rate limiter para Redis/Upstash
- [ ] Ciclos semanais de 7 dias
- [ ] Testes + CI/CD

### Fase 3 — FUTURA
Insights semanais, recommendation engine, premium features.

---

## Decisoes Arquiteturais

| Decisao | Link |
|---------|------|
| Gemini no Coach IA (chat fallback) | [[decisao-gemini-chat-fallback]] |
| Modelo de IA com fallback | [[decisao-modelo-ia-fallback]] |
| Supabase + RLS | [[decisao-supabase-schema]] |
| Validacao com Zod | [[decisao-zod-validacao]] |
| CSS design system | [[decisao-css-design-system]] |
| Deploy Netlify + Vercel | [[decisao-netlify-deploy]] |
| ES Modules | [[decisao-es-modules]] |
| Convencao de nomenclatura | [[decisao-convencao-nomenclatura]] |
| Variaveis de ambiente | [[decisao-variaveis-ambiente]] |
| Modelo freemium | [[decisao-modelo-freemium]] |
| Redesign Apple iOS | [[decisao-apple-ios-redesign]] |
| Rebrand Praxis Nutri | [[decisao-rebrand-praxis-nutri]] |
| MCP Servers (Supabase, Context7, GitHub) | [[decisao-mcp-servers]] |
| Auditoria Red Team vs Blue Team | [[decisao-security-hardening]] |
| Premium protegido via RLS subquery | [[decisao-premium-rls-protection]] |

---

## Bugs Resolvidos

### Build & Deploy
| Bug | Severidade | Link |
|-----|-----------|------|
| Aspas curvas nos imports | Critico | [[bug-aspas-curvas-imports]] |
| Case sensitivity App.jsx | Critico | [[bug-case-sensitivity-app-jsx]] |
| Git ignora rename case (Win) | Medio | [[bug-capitalizacao-app-jsx]] |
| ES module require() | Alto | [[bug-es-module-build]] |
| Build script Netlify | Medio | [[bug-netlify-build-command]] |
| npm ci compatibility | Medio | [[bug-npm-ci-compatibility]] |
| node_modules/.env commitados | Critico | [[bug-node-modules-env-commitados]] |
| React import faltando | Medio | [[bug-react-import-faltando]] |

### API & IA
| Bug | Severidade | Link |
|-----|-----------|------|
| Provider unico = ponto de falha | Alto | [[bug-api-provider-unico-falha]] |
| Spam de scans sem rate limit | Medio | [[bug-rate-limiting-spam]] |
| Resposta IA invalida (crash) | Alto | [[bug-resposta-ia-invalida]] |
| DB save falha = perde analise | Medio | [[bug-db-save-nao-fatal]] |
| Free tier sem enforcement | Medio | [[bug-scan-free-tier]] |
| Base64 com prefixo data URL | Baixo | [[bug-image-base64-prefix]] |

### Database
| Bug | Severidade | Link |
|-----|-----------|------|
| Logs duplicados (insert vs upsert) | Medio | [[bug-upsert-logs-duplicados]] |
| Profile duplicado | Medio | [[bug-profile-duplicado]] |
| single() em query vazia | Baixo | [[bug-maybe-single-query]] |

### Auth & Frontend
| Bug | Severidade | Link |
|-----|-----------|------|
| Token expirado sem refresh | Alto | [[bug-token-expirado-401]] |
| Auth state desincronizado | Medio | [[bug-auth-state-listener]] |
| Profile load bloqueia app | Medio | [[bug-profile-load-resiliente]] |
| Request sem timeout | Medio | [[bug-request-timeout-infinito]] |

### Frontend & CSS
| Bug | Severidade | Link |
|-----|-----------|------|
| Animacoes CSS inexistentes no ScanPage | Baixo | [[bug-animacoes-scan-inexistentes]] |
| Imports quebrados no AppRouter | Alto | [[bug-approuter-imports-quebrados]] |
| Import CSS inexistente no main.jsx | Alto | [[bug-main-jsx-import-errado]] |
| Tokens CSS sem prefixo ns- | Medio | [[bug-tokens-css-sem-prefixo]] |
| .single() em checkScanPermission | Alto | [[bug-scan-permission-single]] |
| ensureChatTablesExist codigo errado | Medio | [[bug-chat-table-check-wrong-code]] |

### Seguranca (resolvidos em 2026-03-22)
| Bug | Severidade | Fix |
|-----|-----------|-----|
| APIs sem autenticacao JWT | Critico | validateAuth() obrigatorio |
| Frontend sem Authorization header | Critico | Bearer token automatico |
| Premium escalation sem pagamento | Critico | RLS subquery + frontend bloqueado |
| CORS wildcard | Alto | ALLOWED_ORIGIN obrigatoria |
| Chat sem rate limiting | Alto | 20 msgs/min por usuario |
| Rate limiter bypass sem userId | Alto | Rejeita + fallback IP |
| IDOR scan_history | Alto | Policy UPDATE + filtro userId |
| dev-server sem guard producao | Alto | process.exit(1) |
| Prompt injection no chat | Medio | Sanitizacao + anti-injection |
| Security headers faltando | Medio | CSP, HSTS, X-Frame-Options |
| RLS incompleto | Medio | Policies completas |

### Infraestrutura & Coach IA (resolvidos em 2026-03-22)
| Bug | Severidade | Link |
|-----|-----------|------|
| Dev-server porta ocupada com chaves velhas | Alto | [[bug-dev-server-porta-ocupada]] |
| Retry desnecessario em 401 no Anthropic | Medio | [[bug-retry-desnecessario-401]] |
| Chat sem Gemini como fallback | Alto | [[bug-chat-sem-gemini-fallback]] |

### IA & Scan (resolvidos em 2026-03-22 sessao 2)
| Bug | Severidade | Link |
|-----|-----------|------|
| Gemini system_instruction camelCase (scan 502) | Critico | [[bug-gemini-system-instruction-camelcase]] |
| Zod v4 err.errors no chat | Alto | [[bug-zod-v4-err-errors-chat]] |
| Retry auth engolido no scan (3 providers) | Alto | [[bug-retry-auth-scan-engolido]] |
| Botao onboarding sobre navbar | Medio | [[bug-onboarding-botao-sobre-navbar]] |

### Resolvidos (anteriormente pendentes)
| Bug | Severidade | Link |
|-----|-----------|------|
| Migration Coach IA | RESOLVIDO | [[bug-coach-migration-pendente]] |

---

## Sessoes

| Data | Resumo | Link |
|------|--------|------|
| 2026-03-23 | Documentacao — README Praxis Nutri com stack, IA, seguranca | [[2026-03-23-documentacao-readme]] |
| 2026-03-22 | Debug IA (3 bugs) + login social + dev account + mega-prompt | [[2026-03-22-bugs-ia-login-social]] |
| 2026-03-22 | Evolucao Coach IA — Gemini fallback, frontend UX, rotacao de chaves | [[2026-03-22-coach-ia-evolution]] |
| 2026-03-22 | Auditoria de seguranca massiva — 2 ciclos, 6 agentes, 15+ vulns corrigidas | [[2026-03-22-security-hardening]] |
| 2026-03-22 | Documentacao + config MCP servers (Supabase, Context7, GitHub) | [[2026-03-22-revisao-documentacao]] |
| 2026-03-21 | Scan + Profile split + headers + QA final | [[2026-03-21-scan-profile-headers]] |
| 2026-03-21 | Debug final + limpeza + 14 bugs corrigidos | [[2026-03-21-debug-final]] |
| 2026-03-21 | Rebrand Praxis Nutri — nome, paleta, identidade | [[2026-03-21-praxis-nutri]] |
| 2026-03-21 | Redesign Apple iOS — paleta, tokens, acessibilidade | [[2026-03-21-apple-ios-redesign]] |
| 2026-03-21 | 3 agentes paralelos — backend, UI, frontend | [[2026-03-21-agentes]] |
| 2026-03-21 | Setup Obsidian + 20 bugs + 9 decisoes | [[2026-03-21]] |

---

## Estrutura de Arquivos Chave

```
api/scan.js          → Endpoint principal de scan (IA + fallback + rate limit)
api/chat.js          → Coach IA (chat conversacional)
src/lib/db.js        → Todas as operacoes de banco
src/app/router.jsx   → Rotas (lazy-loaded)
src/app/AppShell.jsx → Bottom nav + layout
src/styles/index.css → Design system completo
supabase/schema.sql  → Schema + RLS policies
```

---

## Links Rapidos
- **Bugs:** `bugs/`
- **Decisoes:** `decisoes/`
- **Sessoes:** `sessoes/`
- **Estudo:** `estudo/` — Caderno de aprendizado (skill /study)
- **Prompts:** `prompts/`
- **Referencias:** `referencias/`
- **Templates:** `Templates/`
