---
description: Decompõe features ou bugs em tasks atômicas para o TASKS.json — aplica regras de roteamento de agentes do CLAUDE.md, define files_locked e valida dependências
allowed-tools: Read, Bash, Glob, Grep, Write
---

# PRAXIS Task Decompose

## Feature / bug a decompor
$ARGUMENTS

## Passo 1 — Absorver Contexto

Ler:
- `C:/projetos/praxis/CLAUDE.md` → regras de agente, fronteiras, arquivos Director-Only
- `C:/projetos/praxis/TASKS.json` → próximo ID disponível + tasks em andamento (files_locked ativos)

## Passo 2 — Análise da Feature

Responder antes de decompor:
1. Quais arquivos existentes são tocados?
2. É camada RN (`app/`, `components/`) ou Node (`api/`) ou ambas?
3. Há migration Supabase necessária?
4. Toca algum arquivo Director-Only? Se sim → Director executa essa parte
5. Há dependência entre partes? (ex: migration antes de implementação)

## Passo 3 — Regras de Roteamento

| Arquivos | Agente |
|----------|--------|
| `app/**/*.tsx`, `components/**/*.tsx`, `hooks/**/*.ts` | **Cursor** |
| `api/**/*.ts`, scripts, migrações SQL | **Codex** |
| `services/supabase.ts`, `.env*`, `stores/authStore.*` | **Antigravity** (read-only) |
| `app/_layout.tsx`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` | **Director** |

Nunca dar o mesmo arquivo a dois agentes.

## Passo 4 — Decompor em Tasks Atômicas

Para cada task:
- **ID**: `T{próximo número disponível}` (ex: T015)
- **Agente**: cursor / codex / director
- **Spec**: máximo 120 caracteres. Auto-suficiente. Sem ambiguidade.
- **files_locked**: lista exata de arquivos que serão modificados
- **depends_on**: IDs de tasks que devem completar antes
- **priority**: high / medium / low

Critérios para task atômica:
- Máximo 2-3 arquivos por task
- Um único agente executa tudo
- Spec clara sem precisar de contexto externo
- Verificável com `tsc --noEmit` após execução

## Passo 5 — Validação Antes de Escrever

Verificar:
- Nenhum arquivo aparece em dois `files_locked` ao mesmo tempo (incluindo tasks em andamento)
- Dependências formam DAG (sem ciclos)
- Migrations vêm antes das tasks que dependem delas
- Tasks de tipos TypeScript vêm antes de tasks que usam os tipos

## Passo 6 — Apresentar para Aprovação

```
## Tasks Propostas para [feature]

T015 (cursor) — "Criar tela ProfileSettings com form de preferências alimentares"
  files_locked: app/(tabs)/settings/profile.tsx, components/ProfileForm.tsx
  depends_on: T016

T016 (codex) — "Migration 011: adicionar colunas dietary_preferences em profiles"
  files_locked: supabase/migrations/011_dietary_preferences.sql
  depends_on: []

[...]

Confirmar para adicionar ao TASKS.json? (s/n)
```

## Passo 7 — Escrever no TASKS.json

Após confirmação, adicionar as tasks mantendo o formato JSON existente.

```bash
# Verificar formato atual
cat C:/projetos/praxis/TASKS.json | head -30
```

## Anti-Padrões

- Spec ambígua ("implementar a tela") → ser específico
- Task sem `files_locked` → sempre definir
- Um arquivo em dois `files_locked` → BLOQUEANTE
- Task de migration sem depends_on → verificar dependências
- Spec com mais de 120 chars → dividir em subtasks
