---
description: QA PRAXIS antes de deploy — gate TypeScript + expo-doctor + regras de negócio (PRAXIS Score, coach via Edge Function, RLS, anti-shame) + verificação de arquitetura
allowed-tools: Read, Bash, Glob, Grep
---

# PRAXIS QA

## Escopo
$ARGUMENTS
(padrão: `full` | opções: `full`, `quick`)

## Modo QUICK

```bash
# Gate automático apenas
rtk tsc --noEmit && npx expo-doctor
```

Se ambos passarem: "Gate OK — código pronto para deploy rápido."
Se qualquer um falhar: reportar e parar.

---

## Modo FULL

### Gate 1 — TypeScript + Expo Doctor

```bash
rtk tsc --noEmit
npx expo-doctor
```

Se falhar → **PARAR**. Listar erros. Não continuar com QA.

### Gate 2 — Regras de Negócio

**PRAXIS Score mínimo:**
```bash
# Garantir que score nunca vai abaixo de 12
grep -rn "Math.max" C:/projetos/praxis/hooks/ C:/projetos/praxis/stores/
# Esperado: Math.max(12, score) ou similar
```

**Coach via Edge Function:**
```bash
# Claude nunca deve ser chamado direto do cliente
grep -rn "anthropic\|ANTHROPIC_API_KEY\|claude-" C:/projetos/praxis/app/ C:/projetos/praxis/components/
# Se encontrar → FALHA CRÍTICA
```

**RLS em dados de saúde:**
```bash
# Queries devem filtrar por user_id
grep -n "\.from(" C:/projetos/praxis/services/*.ts | grep -v "user_id\|auth.uid"
# Linhas retornadas = possíveis violações de RLS
```

**Anti-shame:**
```bash
grep -rni "fracasso\|falhou\|punição\|penalidade\|você errou\|você falhou\|perdeu\|desapontado" \
  C:/projetos/praxis/app/ C:/projetos/praxis/components/ 2>/dev/null
```

### Gate 3 — Arquitetura

**Fronteira cliente/servidor:**
```bash
# expo-* em api/
grep -rn "expo-" C:/projetos/praxis/api/ 2>/dev/null

# Node em app/
grep -rn "from 'fs\|from 'path\|from 'crypto" C:/projetos/praxis/app/ C:/projetos/praxis/hooks/ 2>/dev/null
```

**NativeWind v4:**
```bash
grep -rn "styled(" C:/projetos/praxis/app/ C:/projetos/praxis/components/ 2>/dev/null
```

**TanStack Query v5:**
```bash
# Detectar sintaxe v4 (sem objeto)
grep -rn "useQuery(\[" C:/projetos/praxis/hooks/ C:/projetos/praxis/app/ 2>/dev/null
grep -rn "useMutation(\[" C:/projetos/praxis/hooks/ C:/projetos/praxis/app/ 2>/dev/null
```

### Gate 4 — Estado das Tasks

```bash
# Tasks falhadas impedem deploy
cat C:/projetos/praxis/TASKS.json | python -c "import json,sys; d=json.load(sys.stdin); [print(t['id'],t.get('status')) for t in d.get('tasks',[]) if t.get('status')=='failed']"
```

### Output do Relatório

```
## QA PRAXIS — [data]

Gate TypeScript: [PASS ✅ / FAIL ❌ — N erros]
Gate expo-doctor: [PASS ✅ / FAIL ❌]

Regras de negócio:
  [✓/✗] PRAXIS Score mínimo (Math.max presente)
  [✓/✗] Coach via Edge Function (sem API key no cliente)
  [✓/✗] RLS em dados de saúde
  [✓/✗] Anti-shame (sem linguagem punitiva)

Arquitetura:
  [✓/✗] Fronteira cliente/servidor
  [✓/✗] NativeWind v4 (sem styled())
  [✓/✗] TanStack Query v5 (sintaxe objeto)

Tasks:
  [✓/✗] Nenhuma task failed

Score: [N/11] — [pronto para deploy / N itens para corrigir]
```

**Score 11/11 = pronto para deploy.**
Qualquer item falhado = corrigir antes de fazer push/release.
