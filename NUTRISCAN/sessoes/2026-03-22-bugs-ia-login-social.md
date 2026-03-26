---
tags: [sessao, nutriscan, praxis-nutri]
data: 2026-03-22
---

## Sessao: Debug IA + Login Social + Dev Account + Mega-Prompt

### O que foi feito

**Bugs de IA corrigidos (agente backend):**
1. **CRITICO** — `systemInstruction` (camelCase) no Gemini scan.js → corrigido para `system_instruction` (snake_case). Causava 502 quando Groq falhava e fallback ia pro Gemini — o system prompt era ignorado silenciosamente e o modelo respondia sem JSON.
2. **ALTO** — `err.errors` no Zod v4 (chat.js) → corrigido para `err.issues`. Detalhes de validacao nunca chegavam ao cliente.
3. **ALTO** — Retry de 401/403 engolido nos 3 providers do scan.js → adicionado guard que relanca imediatamente erros de auth em vez de retentar 3x com mesma chave invalida.

**Frontend corrigido (agente frontend):**
4. **MEDIO** — Botao CTA do onboarding sobre a navbar → `paddingBottom: 20px` corrigido para `calc(var(--ns-nav-height) + 20px)`.

**Features implementadas:**
5. **Login social (Google + Apple)** — botoes adicionados em SignInPage e SignUpPage com OAuth via Supabase. Separador visual "ou continue com". SVGs inline dos logos. AuthContext nao precisou de mudanca (onAuthStateChange ja captura OAuth).
6. **Dev account** — coluna `role` (user/dev/admin) na tabela profiles. Dev bypassa rate limit + paywall + scan limit. Migration SQL criada em `supabase/migrations/20260322_dev_role.sql`. CEO precisa rodar migration no Supabase Dashboard.

**Documentacao:**
7. Mega-prompt de evolucao salvo em `NUTRISCAN/roadmap/mega-prompt-evolucao.md` — plano de 6 fases com estimativa de 6 semanas.
8. 4 notas de bugs criadas em `NUTRISCAN/bugs/`
9. Coach Nutri.md atualizado com todos os itens

### Decisoes tomadas
- Login social usa `signInWithOAuth` direto na page (nao no AuthContext) porque redireciona o navegador imediatamente
- Dev account usa coluna `role` em vez de `is_dev` boolean — mais flexivel pra futuro (admin, moderador, etc)
- Mega-prompt sera executado fase por fase, uma por semana, comecando na proxima sessao

### Bugs encontrados e corrigidos
- [[bug-gemini-system-instruction-camelcase]] (critico)
- [[bug-zod-v4-err-errors-chat]] (alto)
- [[bug-retry-auth-scan-engolido]] (alto)
- [[bug-onboarding-botao-sobre-navbar]] (medio)

### O que ficou pendente
1. **CEO criar conta no app** — precisa rodar `npm run dev`, fazer signup, depois rodar migration + UPDATE no Supabase
2. **Configurar providers OAuth** — Google Cloud Console (Client ID/Secret) + Apple Developer (Services ID/Key)
3. **Rotacionar Supabase service_role_key** — exposta no git history
4. **Mega-prompt Fase 0** — inventario completo do projeto (primeira tarefa da proxima semana)

### Feedback salvo
- Obsidian e OBRIGATORIO em toda sessao — consultar antes/durante/depois de cada tarefa (nao so no context-load)
- Felipe e o CEO/criador do Praxis Nutri, aprendendo programacao

### Aprendizados
- Gemini REST API ignora campos desconhecidos silenciosamente (nao retorna erro) — bugs de naming sao dificeis de detectar
- Zod v4 renomeou `.errors` para `.issues` — verificar breaking changes ao migrar libs
- Erros de auth sao deterministicos — retry so faz sentido pra erros transientes

## Proxima sessao — focar em
1. Criar conta do CEO no app + rodar migration dev_role
2. Mega-prompt Fase 0 — inventario completo
3. Mega-prompt Fase 1 — bugs criticos (acentuacao, markdown no chat, streak, timezone)

## Prompt de continuidade
```
Continuando Praxis Nutri de 2026-03-22 (sessao 2).
3 bugs de IA corrigidos (systemInstruction Gemini, Zod v4, retry auth).
Login social (Google+Apple) implementado mas precisa configurar providers no Supabase Dashboard.
Dev account implementada mas precisa rodar migration.
Mega-prompt salvo em NUTRISCAN/roadmap/mega-prompt-evolucao.md — comecar pela Fase 0 (inventario).
CEO ainda nao criou conta no app.
```

## Links
- [[Coach Nutri]]
- [[bug-gemini-system-instruction-camelcase]]
- [[bug-zod-v4-err-errors-chat]]
- [[bug-retry-auth-scan-engolido]]
- [[bug-onboarding-botao-sobre-navbar]]
- [[mega-prompt-evolucao]]
