# CLAUDE.md — Sistema Director-Agent

> **Versão:** 1.2 (comprimido para economia de tokens)
> **Arquitetura:** Director (Claude Code) + Agentes (Cursor, Codex CLI, Antigravity)

---

## 🔒 ARQUIVOS DE TOPOLOGIA — DIRECTOR-ONLY
Nunca editar exceto Director:
```
app/_layout.tsx, app.json, metro.config.js, babel.config.js, tsconfig.json
```

---

## 📌 STACK PINS — VERSÕES OBRIGATÓRIAS
```
React 19.1.0 | React Native 0.81.5 | Expo ~54.0.33 | Expo Router ~6.0.23
NativeWind ^4.2.0 (className prop, não styled())
Reanimated ~4.1.1 (API v3: useSharedValue, withTiming)
TanStack Query ^5.96.2 | Zustand ^5.0.12 | TypeScript ~5.9.2 strict
Node 20.x (API)
```

---

## 🚧 FRONTEIRA CLIENTE / SERVIDOR
| Camada | Dir | Runtime | Imports |
|--------|-----|---------|---------|
| App (RN) | `app/`, `components/`, `hooks/`, `stores/`, `services/` | React Native | expo-*, react-native |
| API (Node) | `api/` | Vercel / Node 20 | @supabase/supabase-js, Node puro |

**Regra absoluta:** `expo-*` e `react-native` PROIBIDOS em `api/`. Módulos Node PROIBIDOS em `app/`.

---

## 🔑 REGRAS DE SEGURANÇA
- Antigravity: read-only para `services/supabase.ts`, `.env*`, `stores/authStore.*`
- Nenhum agente sugere queries que ignorem RLS
- Secrets: NEVER em blocos de delegação, apenas `process.env.NOME`

---

## 🤖 AGENTES

### 🔵 CURSOR
**Use para:** Edição de `.tsx/.ts` em `app/` e `components/`, testes, refatoração, tipos TypeScript
**NÃO use para:** Terminal, BD, topologia, `api/` (Node)

### 🟡 CODEX CLI
**Use para:** `api/` (Node), scripts, lógica pura, tipos Zod, migrations Supabase
**NÃO use para:** React Native/Expo, componentes, edição cirúrgica

### 🟢 ANTIGRAVITY
**Use para:** Análise read-only, diagnóstico bugs, auditoria RLS, documentação
**RESTRIÇÃO:** Read-only total — nunca escreve em `services/supabase.ts`, `.env*`, `stores/authStore.*`

---

## 📋 WORKFLOW DO DIRECTOR

1. **Analisar:** `rtk tsc --noEmit`, `npx expo-doctor`
2. **Decompor:** Subtarefas atômicas com `files_locked`
3. **Delegar:** Bloco claro ao agente certo
4. **Revisar:** `tsc --noEmit` obrigatório antes de marcar DONE
5. **Integrar:** Validar compatibilidade entre módulos

**Gate obrigatório:** Task marcada DONE **IFF** `tsc --noEmit` + `expo-doctor` passam zero erros.

---

## 🚦 REGRAS DE OURO

✅ **SEMPRE:**
- Ler codebase antes de delegar
- Verificar se task toca Director-Only
- Definir `files_locked` para evitar conflitos
- Iterar até aprovação

❌ **NUNCA:**
- Aceitar output sem revisão
- Delegar tarefas ambíguas
- Instalar deps sem aprovação
- Permitir Codex gerar React Native
- Dar mesmo arquivo a 2 agentes paralelos
- Ignorar erros TypeScript / expo-doctor

---

*v1.2 — Reduzido de 579 → 160 linhas (~70% economia de tokens)*
