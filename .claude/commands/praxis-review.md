---
description: Revisa output de agentes PRAXIS antes de marcar task como done — verifica fronteiras cliente/servidor, NativeWind v4, Reanimated v4, TanStack Query v5 e regras do CLAUDE.md
allowed-tools: Read, Bash, Glob, Grep
---

# PRAXIS Review

## Task / arquivos a revisar
$ARGUMENTS

## A Lei de Ferro

```
NENHUMA TASK MARCADA DONE SEM PASSAR POR ESTE CHECKLIST
```

## Passo 1 — Identificar Arquivos Modificados

```bash
rtk git diff --name-only HEAD
```

Classificar cada arquivo por camada:
- `app/`, `components/`, `hooks/`, `stores/`, `services/` → camada RN
- `api/` → camada Node
- `app/_layout.tsx`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` → Director-Only

## Passo 2 — Verificar Fronteira Cliente/Servidor

**Arquivos em `app/` / `components/` / `hooks/`:**
```bash
# Imports proibidos em RN
grep -r "from 'node:" app/ components/ hooks/ 2>/dev/null
grep -r "@supabase/supabase-js" app/ components/ hooks/ 2>/dev/null
# (supabase deve vir de services/supabase.ts, não direto)
```

**Arquivos em `api/`:**
```bash
# Imports proibidos em Node
grep -r "expo-" api/ 2>/dev/null
grep -r "react-native" api/ 2>/dev/null
```

## Passo 3 — Verificar NativeWind v4

```bash
# styled() é proibido no v4 — usar className
grep -rn "styled(" app/ components/ 2>/dev/null

# tw() também proibido
grep -rn "tw\`" app/ components/ 2>/dev/null
```

Correto: `<View className="flex-1 bg-white">`
Proibido: `const StyledView = styled(View)`

## Passo 4 — Verificar Reanimated v4

```bash
# API legada do v2/v3 (proibida no v4)
grep -rn "useAnimatedValue\|useSharedValue.*Animated" app/ components/ 2>/dev/null
grep -rn "runOnJS\|runOnUI" app/ components/ 2>/dev/null  # ainda OK se necessário
```

Correto: `const val = useSharedValue(0)` + `withTiming()`
Proibido: `const val = useAnimatedValue(0)`

## Passo 5 — Verificar TanStack Query v5

```bash
# Sintaxe v4 (objeto obrigatório no v5)
grep -rn "useQuery(" app/ hooks/ 2>/dev/null | grep -v "useQuery({"
grep -rn "useMutation(" app/ hooks/ 2>/dev/null | grep -v "useMutation({"
```

Correto: `useQuery({ queryKey: [...], queryFn: ... })`
Proibido: `useQuery(['key'], fetchFn, options)`

## Passo 6 — Verificar Director-Only

Se qualquer arquivo Director-Only foi modificado por agente que não seja o Director:
→ **REPROVAR IMEDIATAMENTE** e pedir ao usuário para revisar manualmente.

## Passo 7 — Verificar Anti-Shame

```bash
# Linguagem punitiva proibida
grep -rni "falhou\|fracasso\|punição\|penalidade\|você errou\|você falhou" app/ components/ 2>/dev/null
```

## Passo 8 — Gate TypeScript

```bash
rtk tsc --noEmit
```

Se falhar → REPROVAR. Listar os erros específicos.

## Output da Revisão

```
## Revisão [Task ID] — [APROVADO ✅ / REPROVADO ❌]

Verificações:
  [✓/✗] Fronteira cliente/servidor
  [✓/✗] NativeWind v4 (sem styled())
  [✓/✗] Reanimated v4 (API v3)
  [✓/✗] TanStack Query v5 (sintaxe objeto)
  [✓/✗] Director-Only intocado
  [✓/✗] Anti-shame
  [✓/✗] TypeScript: X erros

Violações encontradas:
  1. [arquivo:linha] — [descrição]
  ...

Ações necessárias:
  - [ação específica por violação]
```
