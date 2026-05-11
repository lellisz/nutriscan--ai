# /sessao — Ponte de Sessão PRAXIS

Você é o Director (Claude Code Sonnet). Execute este ritual de sessão completo.

## PASSO 1 — LER CONTEXTO PERSISTENTE

Leia estes arquivos do Obsidian Vault em paralelo:
- `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Agentes\CLAUDE.md`
- `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Projetos\PRAXIS\stack.md`
- `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Projetos\PRAXIS\TASKS.md`

## PASSO 2 — LER SESSÃO DE ONTEM

Calcule a data de ontem (hoje - 1 dia) no formato `YYYY-MM-DD`.
Tente ler: `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Sessoes\PRAXIS\{ONTEM}.md`

Se o arquivo não existir, registre "Primeira sessão ou sessão anterior não encontrada."

## PASSO 3 — LER SESSÃO DE HOJE (se já existir)

Tente ler: `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Sessoes\PRAXIS\{HOJE}.md`

Se existir, use como base para atualizar (não sobrescreva o que já foi feito).
Se não existir, crie do zero com o template abaixo.

## PASSO 4 — GERAR/ATUALIZAR ARQUIVO DE SESSÃO DE HOJE

Salve em: `C:\Users\felip\Documents\Obsidian\_AI_SYSTEM\Sessoes\PRAXIS\{HOJE}.md`

Use este template:

```markdown
# Sessão {HOJE} — PRAXIS

## 🔗 Ponte de Contexto
> Conecta ontem → hoje → amanhã

### Ontem ({ONTEM})
[Resumo do que foi feito na sessão anterior — extraído do arquivo de ontem]
[Se não houver sessão anterior: "Primeira sessão do projeto."]

### Hoje ({HOJE}) — Em andamento
**Objetivo da sessão:** [descrever o que o Felipe quer fazer]

**O que foi feito:**
- [ ] [preencher durante a sessão]

**Decisões tomadas:**
- [preencher durante a sessão]

**Problemas encontrados:**
- [preencher durante a sessão]

### Amanhã — Próximos passos recomendados
> Baseado no TASKS.md e no que ficou pendente hoje

1. [task prioritária 1]
2. [task prioritária 2]
3. [task prioritária 3]

---

## 📋 Estado das Tasks (snapshot)
[Copiar as tasks "Em Execução" e "Backlog Alta Prioridade" do TASKS.md]

## 🤖 Agentes Utilizados Hoje
| Agente | Tasks | Status |
|--------|-------|--------|
| Director | | |
| Cursor | | |
| Codex | | |
| Antigravity | | |
| Opus QA | | |

## 💡 Insights e Aprendizados
[Decisões arquiteturais, padrões descobertos, bugs resolvidos — vai para AGENT_LOG.md se relevante]
```

## PASSO 5 — APRESENTAR RESUMO AO FELIPE

Após criar/atualizar o arquivo, apresente no chat:

```
═══════════════════════════════════════
RITUAL DE SESSÃO — {HOJE}
═══════════════════════════════════════

📅 ONTEM
[2-3 linhas do que foi feito]

🎯 HOJE — Pronto para briefing
Stack carregada ✅ | Tasks carregadas ✅ | Vault sincronizado ✅

⏭️ PRÓXIMOS PASSOS SUGERIDOS
1. [task 1 do backlog alta prioridade]
2. [task 2 do backlog alta prioridade]
3. [task 3 do backlog alta prioridade]

Qual é o briefing de hoje?
═══════════════════════════════════════
```

## PASSO 6 — AO FINAL DA SESSÃO

Quando o Felipe disser "encerra sessão", "finaliza" ou quando context > 80%, execute:

### 6a — Atualizar arquivo de sessão
- Substituir `[ ]` por `[x]` no que foi feito
- Preencher decisões, problemas, próximos passos

### 6b — Atualizar TASKS.md e TASKS.json
- Refletir estado real das tasks (done/pending/failed)
- Adicionar tasks novas ao TASKS.json se houver backlog

### 6c — Gerar HANDOFF.md (CRÍTICO — permite retomada autônoma)

Salve em `C:/projetos/praxis/HANDOFF.md`:

```markdown
# HANDOFF — PRAXIS Sessão {HOJE}
> Gerado pelo Director em {DATETIME}
> Lido pelo dispatcher.py para retomada autônoma

## Contexto do Projeto
Stack: React Native 0.81.5 / Expo Router 6 / NativeWind v4 / Supabase / TanStack Query v5
Design: bg #09080C | ivory #EBE4D2 | gold #C9A96E
Fonts: Cormorant Garamond (serifLight) | Jost (sansLight/sansMedium) | DM Sans (monoLight)

## O que foi feito nesta sessão
[lista de mudanças reais com arquivos afetados]

## Estado atual do TASKS.json
[copiar tasks pending e failed com seus specs completos]

## Próxima ação esperada
[instrução clara e direta para o agente headless — ex: "Implementar X em arquivo Y seguindo padrão Z"]

## Decisões arquiteturais tomadas
[decisões que impactam tarefas futuras]

## Arquivos críticos para contexto
- constants/design.ts — tokens de cor e tipografia
- services/supabase.ts — cliente Supabase
- stores/authStore.ts — user + profile
- [outros arquivos relevantes para as tasks pendentes]

## Regras inegociáveis
1. NÃO alterar: app/_layout.tsx, app.json, metro.config.js, babel.config.js, tsconfig.json
2. NÃO usar expo-* ou react-native em api/
3. NÃO usar styled() — sempre className com NativeWind v4
4. TypeScript strict: sem any, sem @ts-ignore
5. tsc --noEmit deve passar após cada mudança
```

### 6d — Commit final
```bash
git add -A
git commit -m "chore: handoff sessão {HOJE} — {N} tasks done, {M} pending"
```
