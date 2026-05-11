---
description: Análise completa de nova feature PRAXIS — impacto em telas/tabelas/Edge Functions, checklist de constraints, spec detalhada e tasks prontas para decompor
allowed-tools: Read, Bash, Glob, Grep
---

# PRAXIS Feature

## Feature a analisar
$ARGUMENTS

## Hard Gate

Não criar tasks nem escrever código sem completar este processo. Uma feature mal analisada custa múltiplas reexecuções.

## Passo 1 — Contexto Atual

```bash
# Branch e tasks em andamento
git branch --show-current
cat C:/projetos/praxis/TASKS.json | python -c "import json,sys; d=json.load(sys.stdin); [print(t['id'],t.get('status'),t.get('spec','')[:60]) for t in d.get('tasks',[])]"
```

Verificar: há conflito com trabalho em andamento? Se sim, alertar antes de continuar.

## Passo 2 — Análise de Impacto

Explorar o codebase para responder:

**Telas existentes afetadas:**
```bash
grep -rn "[termo_da_feature]" C:/projetos/praxis/app/ C:/projetos/praxis/components/ 2>/dev/null
```

**Tabelas Supabase necessárias:**
```bash
grep -rn "\.from(" C:/projetos/praxis/services/ | grep -v ".ts:" | head -20
ls C:/projetos/praxis/supabase/migrations/
```

**Edge Functions necessárias:**
```bash
ls C:/projetos/praxis/supabase/functions/ 2>/dev/null
```

**Stores/hooks afetados:**
```bash
ls C:/projetos/praxis/stores/ C:/projetos/praxis/hooks/
```

## Passo 3 — Checklist de Constraints PRAXIS

Verificar cada item antes de prosseguir:

| Constraint | Verificação |
|------------|-------------|
| Dados de saúde/nutri | Todas as queries filtradas por user_id + RLS |
| UI nova | NativeWind v4 (className), design system Obsidian Warm, sans-serif |
| Princípio anti-shame | Nenhuma linguagem punitiva, score sempre ≥ 12 |
| Coach/AI | Sempre via Edge Function Supabase, nunca API key no cliente |
| Director-Only | Não tocar `_layout.tsx`, `app.json`, etc. |
| Novos deps | Solicitar aprovação do Director antes de instalar |

## Passo 4 — Design de Alto Nível

Propor:

**Estrutura de dados:**
```
Nova(s) tabela(s) ou coluna(s) necessária(s)
```

**Fluxo de telas:**
```
Tela A → ação → Tela B → resultado
```

**Edge Functions:**
```
Quais precisam ser criadas, com input/output esperado
```

**Estimativa de complexidade:**
- Baixa: 1-3 tasks (features simples, 1 tela, sem migration)
- Média: 4-7 tasks (nova tela + migration + store)
- Alta: 8+ tasks (considerar sprints separados)

## Passo 5 — Tasks Esboçadas

Listar as tasks propostas em alto nível (sem escrever no TASKS.json ainda):

```
[Migration] se necessária — sempre first
[Edge Function] se necessária
[Store/Hook] para gerenciar estado
[Componentes] UI components reutilizáveis
[Tela] screen principal
[Integração] conectar tudo
```

## Passo 6 — Pergunta de Aprovação

Apresentar o design ao usuário e perguntar:
"Devo criar as tasks no TASKS.json agora? Alguma ajuste no design antes?"

Aguardar confirmação antes de usar `/praxis-task-decompose`.

## Riscos a Destacar

Sempre mencionar riscos identificados:
- Migrations são irreversíveis em produção
- Edge Functions têm cold start (impacto na UX)
- Novas stores podem conflitar com cache do TanStack Query
- Features de notificação requerem permissão do usuário
