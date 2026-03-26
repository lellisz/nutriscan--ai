---
tags: [decisao, nutriscan, seguranca, env]
data: 2026-03-13
---

## Contexto
Gerenciamento de chaves de API e configuracoes sensiveis.

## Decisao
- **Nunca commitar** `.env`, `.env.claude`, `.env.local`
- `.env.example` com nomes das variaveis (sem valores)
- `.gitignore` inclui todos os patterns de env
- Variaveis necessarias:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY`
  - `GROQ_API_KEY` (opcional)
  - `GEMINI_API_KEY` (opcional)
  - `OLLAMA_BASE_URL`, `OLLAMA_MODEL` (opcional)
  - `SENTRY_DSN`
  - `AI_PROVIDER`

## Motivo
- [[bug-node-modules-env-commitados]] — ja tivemos credenciais commitadas uma vez
- Seguranca basica: chaves fora do repositorio

## Quando revisar
- Se adotar vault (HashiCorp, AWS Secrets Manager)

## Referencias
- [[bug-node-modules-env-commitados]]
- [[Coach Nutri]]
