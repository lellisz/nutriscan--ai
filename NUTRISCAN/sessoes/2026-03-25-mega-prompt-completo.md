---
tags: [sessao, nutriscan, praxis-nutri, mega-prompt, features]
data: 2026-03-25
---

## Implementacao Completa do Mega-Prompt Praxis Nutri (8 Etapas)

Esta sessao executou o mega-prompt definitivo do Praxis Nutri do inicio ao fim.
Todas as 8 etapas foram implementadas e commitadas.

---

### Etapa 1 — Inventario Completo
- Criado `docs/auditoria/inventario-projeto.md` com mapeamento total:
  - Todas as rotas (11 paginas), componentes, tabelas Supabase
  - Provedores IA, variaveis de ambiente, bugs identificados
- Identificados 8 bugs visuais para corrigir na Etapa 2

### Etapa 2 — 8 Bugs Corrigidos (commits ec382bc + 405120d)
- Bug 1/2: Acento em "Inicio" e "Historico" no nav bar (AppShell.jsx)
- Bug 3: Streak contava a partir de hoje; agora conta do ultimo dia ativo (DashboardPage.jsx)
- Bug 4: Timezone bug — `toISOString()` usava UTC, Brasil e UTC-3; fix com `toLocaleDateString('fr-CA')`
- Bug 5: Media da semana sem indicar base de calculo; adicionado "(X de 7 dias)"
- Bug 6: Macro bars com `height: 3` (invisivel); corrigido para `height: 8` em DashboardPage e HistoryPage
- Bug 7: Gotas d'agua sem feedback visual; implementado fill azul + borda tracejada na proxima
- Bug 8: Avatar de letra nas refeicoes substituido por `MealIcon` com SVG por horario (cafe/almoco/lanche/jantar)

### Etapa 3 — Motor de IA (commits ade773e + 405120d)
- **Intent Router**: LLaMA 8B (llama-3.1-8b-instant) classifica mensagem em 7 intents em ~10ms
  - Intents: question, emotional, food_log, recipe_request, progress_report, goal_update, small_talk
  - Roteamento: small_talk → LLaMA 8B (barato/rapido), questoes nutricionais → LLaMA 70B, emotional → Gemini Flash
- **Session Memory**: tabela `conversation_insights` no Supabase
  - Ao final de cada conversa (a cada 5 mensagens): Gemini Flash Lite extrai 1-2 insights especificos
  - Injetados no system prompt da proxima sessao para personalizar o Praxi
  - Categorias: preference, difficulty, progress, restriction, context
- **Fallback automatico**: Groq falha → Gemini assume; Gemini falha → Groq assume
- **Arquivos criados** em `src/lib/ai/`: providers.js, router.js, system-prompt.js, memory.js, fallback.js
- **api/chat.js** refatorado com intent detection inline (nao importa de src/)

### Etapa 4 — Design System v2 + Mascote Praxi (commit 405120d)
- **PraxiAvatar** (`src/components/praxi/PraxiAvatar.jsx`):
  - SVG abacate nutricionista com jaleco e oculos (mascote oficial)
  - 8 estados emocionais: happy, thinking, celebrating, cooking, sleeping, waving, worried, proud
  - Props: `state` e `size` (sm/md/lg)
- **CSS v2** (`src/styles/index.css`):
  - Google Fonts @import (Inter + DM Serif Display)
  - Variaveis v2: --praxis-green, --praxis-coral, --bg-warm, --macro-protein, --macro-carbs, --macro-fat
  - Classes utilitarias de fonte e novos keyframes
- **CoachChatPage**: Praxi integrado no header (state="happy"), typing indicator (state="thinking"), empty state (state="waving")

### Etapa 5 — Features P1 (commit fa5bd7a)
- **5.1 Quick Actions**: Row de chips horizontalmente scrollavel no chat
  - Aparece quando tem mensagens e o input esta vazio
  - 8 opcoes: "Analisar meu dia", "Receita proteica facil", etc.
- **5.2 Categorizacao de refeicoes**: Auto-detect por horario no ScanPage
  - `detectMealType()`: 5-10h=breakfast, 11-14h=lunch, 15-18h=snack, resto=dinner
  - Seletor de chips no resultado do scan (persiste via `db.updateScanHistory`)
- **5.3 Onboarding 3 telas**: Novo fluxo de boas-vindas antes do formulario detalhado
  - Tela 0: Praxi waving + "Ola! Sou o Praxi" + botao Comecar
  - Tela 1: "Qual e o seu objetivo?" — cards de cutting/maintain/bulking pre-preenchem o formulario
  - Tela 2: Praxi celebrating + CTA "Escanear primeiro alimento" ou "Completar perfil detalhado"
  - Paginacao visual com indicadores de passo
- **5.4 Modo Respira**: Deteccao de ansiedade/culpa alimentar no chat
  - 15 palavras-chave: ansioso, culpa, errei, exagerei, vergonha, etc.
  - Injeta card "Modo Respira" com Praxi worried + 3 passos de respiracao (4s/4s/6s)

### Etapa 6 — Auditoria de Seguranca (commit e50c25a)
- **Estado pre-auditoria**: JWT, CORS, RLS, rate limiting, sanitizacao — tudo ja estava correto
- **Correcoes de hardening**:
  - `vercel.json`: adicionados X-XSS-Protection, CSP e Permissions-Policy
  - `netlify.toml`: removido `unsafe-eval` do CSP (desnecessario em producao)
  - `schemas.js`: ScanRequestSchema com limite 7MB e enum de MIME types (image/jpeg, image/png, image/webp, image/heic)
- Nenhuma vulnerabilidade critica encontrada — aplicacao ja estava bem protegida

### Etapa 7 — Features P2 (commit b006f62)
- **7.1 Recap Semanal**: Card com highlights da semana (aparece com >= 3 dias de dados)
  - Dias ativos, media de kcal/dia, melhor dia da semana, streak atual
  - Visual com gradient accent-bg
- **7.2 Nutri Score**: Score 0-100 calculado com 4 fatores:
  - Dias registrados na semana (40%), aderencia calorica (30%), proteina hoje (20%), streak (10%)
  - Gauge circular animado + label: Excelente/Bom/Melhorando
- **7.3 Desafios Semanais**: 3 desafios rotativos com checkboxes
  - Pool de 5 desafios, rotacao por semana do mes
  - Progresso persistido em localStorage por mes

### Etapa 8 — Esta nota + atualizacao do Coach Nutri.md

---

## Bugs Corrigidos
- Bug: Timezone UTC vs UTC-3 fazia hoje mostrar dados do dia errado — fix: `toLocaleDateString('fr-CA')` (arquivo: DashboardPage.jsx)
- Bug: Streak zerava quando hoje nao tinha dados — fix: contar do ultimo dia ativo para tras (DashboardPage.jsx)
- Bug: Macro bars invisiveis (height: 3) — fix: height: 8 (DashboardPage.jsx + HistoryPage.jsx)
- Bug: Avatar de letras no historico sem contexto — fix: MealIcon com SVG por horario (HistoryPage.jsx)

## Decisoes Tomadas
- **NUNCA usar Anthropic/Claude no chat** — apenas Groq + Gemini (restricao do mega-prompt)
- **Intent router no backend** (api/chat.js inline) — o servidor nao pode importar de src/
- **Onboarding em 2 fases** — welcome flow (3 telas rapidas) + form detalhado (3 passos) — usuario pode pular para o scan
- **Nutri Score calculado client-side** — sem nova API call, usa dados ja carregados
- **Desafios em localStorage** — sem tabela nova, simplicidade maxima para MVP

## Estado do Projeto Apos Esta Sessao
**Funcionando:**
- Engine IA com intent router + fallback automatico Groq/Gemini
- Session memory (conversation_insights) — Praxi lembra do usuario entre sessoes
- Mascote Praxi SVG com 8 estados emocionais
- Quick Actions chips no chat
- Auto-detect de tipo de refeicao por horario no scan
- Onboarding com 3 telas de boas-vindas
- Modo Respira ao detectar ansiedade no chat
- Nutri Score semanal no dashboard
- Recap semanal no dashboard
- Desafios semanais com checkboxes
- Security headers completos (CSP, X-Frame-Options, etc.)

**Ainda pendente:**
- Rotacionar Supabase service_role_key (exposta em git history)
- Adicionar creditos na conta Anthropic (saldo zerado — nao bloqueia pois usamos Groq)
- Integrar gateway de pagamento (RevenueCat ou Stripe)
- Migrar rate limiter para Redis/Upstash (atual e in-memory, nao persiste entre cold starts)
- Testes automatizados + CI/CD
- Ciclos semanais de 7 dias com reset de metas
- Push notifications para lembrar de registrar refeicoes

## Prompt de Continuidade
```
Continuando Praxis Nutri de 2026-03-25.
Mega-prompt de 8 etapas completo. App com engine IA (Groq+Gemini), Praxi mascote SVG,
features P1 (Quick Actions, meal type, onboarding 3 telas, Modo Respira),
features P2 (Nutri Score, Recap, Desafios), security hardening.
Proxima prioridade: gateway de pagamento OU rotacao da service_role_key do Supabase.
```

## Links
- [[Coach Nutri]]
- [[2026-03-23-documentacao-readme]]
- [[decisao-motor-ia-praxis]]
- [[decisao-praxi-mascote]]
