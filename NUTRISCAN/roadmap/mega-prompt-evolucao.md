---
tags: [roadmap, nutriscan, praxis-nutri, mega-prompt]
data: 2026-03-22
status: pendente
---

# MEGA-PROMPT — Praxis Nutri: Auditoria Completa + Evolucao + Documentacao

> Plano completo de evolucao do Praxis Nutri. Executar fase por fase, uma por sessao.
> **REGRA**: A IA do chatbot usa Groq + Gemini — NAO usar Claude API.

---

## SISTEMA DE AGENTES

| Agente | Responsabilidade |
|--------|-----------------|
| Engenheiro de IA | Logica do chatbot Coach Praxi — prompts, roteamento, memoria, insights |
| Designer Frontend | Visual — componentes, cores, tipografia, animacoes, mascote Praxi |
| Analista de Bugs | Identificar, reproduzir, corrigir e documentar bugs |
| Seguranca | RLS, auth, sanitizacao, rate limiting, pentesting |
| Arquiteto | Estrutura de pastas, decisoes tecnicas, schema, migracoes |
| Product Builder | Features de produto — onboarding, gamificacao, tiers, recaps |
| Auditor | Documentar TUDO no Obsidian ao final de cada fase |

---

## FASE 0 — LEITURA E INVENTARIO (Arquiteto + Auditor)

**Status:** PENDENTE
**Branch:** nenhum (somente leitura)
**Estimativa:** ~1 sessao curta

Tarefas:
1. Listar todas as paginas/rotas
2. Listar todos os componentes
3. Listar todas as tabelas do Supabase (schema)
4. Listar todas as API routes / Edge Functions
5. Identificar como o chatbot esta conectado (Groq? Gemini? Qual endpoint?)
6. Identificar o design system atual (cores, fontes, componentes base)
7. Identificar arquivos de configuracao (.env, next.config, tailwind.config)

**Saida:** `docs/inventario-projeto.md`

---

## FASE 1 — CORRECAO DE BUGS CRITICOS (Bug Analyst)

**Status:** PENDENTE
**Branch:** `fix/audit-bugs`
**Estimativa:** ~1 sessao

### Bug 1: Acentuacao ausente
Grep em todo o projeto por strings em PT-BR. Corrigir: "Historico" -> "Historico", "Sequencia" -> "Sequencia", "Inicio" -> "Inicio", etc.

### Bug 2: Chat renderiza markdown bruto
Instalar `react-markdown`. No componente de mensagem do assistant, renderizar com ReactMarkdown. NAO aplicar em mensagens do usuario.

### Bug 3: Sequencia/streak mostra "0d" com dias ativos
Corrigir logica: contar dias consecutivos com registro. Escrever testes unitarios.

### Bug 4: Cards "kcal hoje/ontem" zerados
Verificar timezone (America/Sao_Paulo, UTC-3). Se nao ha dados, adicionar contexto: "ultima refeicao: X dias atras".

### Bug 5: Media 7 dias errada
Mostrar media apenas sobre dias COM registro. Formato: "1.100 kcal/dia (1 de 7 dias)".

**Saida:** `docs/bugs-corrigidos.md`

---

## FASE 2 — MOTOR DE IA COM GROQ E GEMINI (Engenheiro de IA)

**Status:** PENDENTE
**Branch:** `feat/ai-engine-groq-gemini`
**Estimativa:** ~2 sessoes

### 2.1 Providers (`lib/ai/providers.ts`)
- Groq: llama-3.3-70b-versatile, llama-3.1-8b-instant, llama-3.2-90b-vision-preview
- Gemini: gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro

### 2.2 Roteamento Inteligente (`lib/ai/router.ts`)
- Passo 1: LLaMA 8B detecta intencao (ultra barato)
- Passo 2: Router seleciona provider + modelo baseado na intencao
- Intencoes: question, progress_report, emotional, food_log, goal_update, recipe_request, small_talk

### 2.3 System Prompt Coach Praxi (`lib/ai/system-prompt.ts`)
- Filosofia: nutricao gentil, anti-culpa, brasileiro
- Personalidade: amigo nutricionista, tom caloroso, humor leve
- NUNCA: "voce excedeu", "calorias a mais", "voce falhou"
- SEMPRE: "dia generoso", "amanha a gente equilibra", "progresso, nao perfeicao"
- Conhecer comida brasileira: PF, marmitex, coxinha, acai, tapioca, pao de queijo

### 2.4 Tabela de Insights (memoria entre sessoes)
- Tabela `conversation_insights` com RLS
- Categorias: preference, difficulty, progress, restriction, context

### 2.5 Geracao de insights pos-sessao
- Gemini Flash analisa conversa e extrai insights
- Salva automaticamente no Supabase

### 2.6 Fallback entre providers
- Groq falha -> Gemini automaticamente
- Gemini falha -> Groq automaticamente

**Saida:** `docs/ai-engine.md`

---

## FASE 3 — DESIGN E IDENTIDADE VISUAL (Designer Frontend)

**Status:** PENDENTE
**Branch:** `feat/design-system-v2`
**Estimativa:** ~2 sessoes

### 3.1 Paleta de cores
- Verde marca: #1A7F56 (principal), #E8F5EC (light), #0F5A3A (dark)
- Coral accent: #FF8A65 (CTAs, destaques)
- Macros: proteina=#3B82F6, carb=#F59E0B, gordura=#8B5CF6
- Background: #FAF8F5 (off-white quente)
- Atencao gentil: #E5A44D (ambar em vez de vermelho)

### 3.2 Tipografia
- Headings: Nunito (700)
- Body: DM Sans (400/500)
- Numeros grandes: Space Grotesk (700)
- Unidades: 70% do tamanho, opacidade 60%

### 3.3 Correcoes visuais (16 itens)
1. Trocar fonte para Nunito + DM Sans
2. Paleta com coral accent
3. Background off-white quente
4. Cards com padding 16-20px, border-radius 16px
5. Barras de macros: altura minima 8px
6. Circulo de calorias: animacao 800ms
7. Hidratacao: gotas SVG com splash animation
8. Chat: bolhas diferenciadas (usuario=verde, Praxi=branco+borda)
9. Chat: typing indicator (3 pontos pulsando)
10. Chat: renderizar markdown
11. Tab bar: botao scan com glow pulse
12. Historico: cards com icone + macros visiveis
13. Empty states contextuais por horario
14. Grafico semanal: 7 barras + linha de meta pontilhada
15. Transicoes entre telas: slide 200ms
16. Microinteracoes: scale(0.97) ao pressionar

### 3.4 Mascote Praxi
Componente `PraxiAvatar` com 8 estados:
- happy, thinking, celebrating, cooking, sleeping, waving, worried, proud
- Usar em: header chat, empty states, loading, notificacoes, splash

**Saida:** `docs/design-system.md`

---

## FASE 4 — FEATURES DE PRODUTO (Product Builder)

**Status:** PENDENTE
**Branch:** `feat/product-features`
**Estimativa:** ~3-4 sessoes

### P1 — Criticas para retencao
1. Quick Actions no Chat — chips de sugestao contextuais
2. Categorizacao de refeicoes — auto-detectar por horario
3. Onboarding 3-4 telas — objetivo, metas, primeiro scan
4. Modo Respira — detectar ansiedade, esconder numeros, acolher

### P2 — Engagement
5. Recap Semanal — card animado estilo Stories (shareable)
6. Nutri Score — nota 0-100 (macros + hidratacao + consistencia)
7. Desafios semanais — "Semana da Proteina", "Hidratacao Master"
8. Badges e conquistas — mapa do Brasil por regioes culinarias

### P3 — Receita/monetizacao
9. Prato Fantasma — IA sugere o que falta pra fechar macros
10. Praxi Chef — receitas que fecham macros do dia
11. Lista de Compras Inteligente — gerada do plano semanal
12. Stickers do Praxi — pacote WhatsApp/Instagram

**Saida:** `docs/features-implementadas.md`

---

## FASE 5 — SEGURANCA (Red Team + Blue Team)

**Status:** PARCIALMENTE FEITO (2 ciclos em 2026-03-22)
**Branch:** `fix/security-audit`
**Estimativa:** ~1 sessao (verificacao + pendentes)

Tarefas:
1. Verificar RLS em TODAS as tabelas
2. Testar IDOR em endpoints
3. Validar que API keys NAO estao no frontend
4. Rate limiting no chat
5. Sanitizar inputs (prompt injection)
6. service_role key NAO no client-side
7. Headers de seguranca

**Saida:** `docs/security-audit.md`

---

## FASE 6 — DOCUMENTACAO COMPLETA (Auditor)

**Status:** PENDENTE
**Branch:** nenhum
**Estimativa:** ~1 sessao

Gerar:
- `docs/inventario-projeto.md`
- `docs/bugs-corrigidos.md`
- `docs/ai-engine.md`
- `docs/design-system.md`
- `docs/features-implementadas.md`
- `docs/security-audit.md`
- `docs/decisions/ADR-001` a `ADR-005`
- `docs/sessao-[DATA].md`
- `docs/roadmap.md`
- `docs/metricas.md`
- `CLAUDE.md` atualizado

---

## REGRAS GLOBAIS

1. Ler TUDO antes de mudar qualquer coisa
2. Um commit por mudanca logica
3. Testar apos cada correcao
4. IA do chatbot = Groq + Gemini (NUNCA Claude API)
5. Mobile-first
6. Filosofia anti-culpa (nunca mensagem punitiva)
7. Auditor executa ao final de CADA fase
8. TypeScript strict (sem `any`)
9. Timezone: America/Sao_Paulo (UTC-3)
10. Acessibilidade: labels em inputs, contrastes adequados

---

## PLANO DE EXECUCAO SEMANAL

| Semana | Fases | Foco |
|--------|-------|------|
| Semana 1 | 0 + 1 | Inventario + bugs criticos |
| Semana 2 | 2 | Motor de IA completo |
| Semana 3 | 3 | Design system + mascote |
| Semana 4 | 4 (P1) | Features criticas de retencao |
| Semana 5 | 4 (P2+P3) + 5 | Features engagement + seguranca |
| Semana 6 | 6 | Documentacao final |
