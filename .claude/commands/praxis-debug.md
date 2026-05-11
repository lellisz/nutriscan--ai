---
description: Debug PRAXIS-aware — coleta evidências automaticamente dos logs corretos, classifica erros por padrão do stack RN+Expo+Supabase e propõe hipótese com próximos passos
allowed-tools: Read, Bash, Glob, Grep
---

# PRAXIS Debug

## Sintoma / task com falha
$ARGUMENTS

## Lei de Ferro

```
NENHUM FIX SEM ROOT CAUSE PRIMEIRO
```

Nunca alterar código baseado em suposição. Coletar evidências primeiro.

## Fase 1 — Coleta de Evidências

### Logs do projeto
```bash
# Dispatcher
tail -50 C:/projetos/praxis/dispatch.log

# Preview web
tail -30 C:/projetos/praxis/web-preview.err.log 2>/dev/null

# TypeScript
rtk tsc --noEmit 2>&1
```

### O que mudou recentemente
```bash
rtk git diff HEAD
rtk git log --oneline -5
```

## Fase 2 — Classificar o Erro

| Padrão no log | Causa provável | Ação inicial |
|---------------|----------------|-------------|
| `Cannot find module` | Import path errado ou dep não instalada | Verificar tsconfig paths + pnpm list |
| `Cannot find type` | Dep de tipos não instalada | `pnpm add -D @types/...` |
| `Type error` em arquivo RN | Tipos gerados desatualizados ou violação de stack | Ver Fase 3 |
| `Cannot read properties of undefined` | Dado null em runtime | Verificar loading states + optional chaining |
| Array vazio inesperado (Supabase) | RLS bloqueando silenciosamente | Verificar policies + user.id presente |
| `Reanimated` worklet error | Código JS rodando na UI thread | Mover para `runOnJS` ou worklet-safe |
| `useQuery` / stale data | QueryKey errada ou staleTime incorreto | Verificar invalidation + queryKey unique |
| Edge Function 500 | Erro no Deno function | `supabase functions logs nome-da-funcao` |
| Metro bundle error | Import circular ou dep incompatível | Limpar cache Metro |

## Fase 3 — Análise Específica por Tipo

### Erro TypeScript
```bash
# Listar todos os erros com contexto
rtk tsc --noEmit 2>&1 | head -50

# Ver arquivo com erro
# Verificar se é violação de stack ou tipo gerado desatualizado
```

### Erro de RLS (Supabase retornando vazio)
```bash
# Verificar services com query sem user_id
grep -n "\.from(" C:/projetos/praxis/services/*.ts
# Checar se .eq('user_id', user.id) está presente
```

### Erro de Edge Function
```bash
# Checar logs da função (requer supabase CLI)
supabase functions logs nome-da-funcao --tail 20
```

### Erro Metro/Bundle
```bash
# Limpar cache
npx expo start --clear
```

## Fase 4 — Hipótese

Após coletar evidências, formular:

```
Hipótese: [causa raiz provável]
Evidência: [linha/arquivo/log que suporta]
Confiança: [Alta/Média/Baixa]

Próximos 3 passos de verificação:
1. [verificação específica]
2. [verificação específica]
3. [verificação específica]
```

## Fase 4.5 — Pausa Arquitetural

Se após 3 tentativas de fix o problema persiste:
→ Parar. O problema pode ser arquitetural.
→ Perguntar ao usuário: "Suspeito que o problema é em [camada]. Quer revisar a abordagem antes de continuar?"

## Anti-Padrões

- Alterar código sem ter visto a mensagem de erro real
- "Provavelmente é X" sem evidência
- Tentar múltiplos fixes ao mesmo tempo (impossível isolar causa)
- Ignorar erros de RLS silenciosos (array vazio pode ser bug ou segurança)
