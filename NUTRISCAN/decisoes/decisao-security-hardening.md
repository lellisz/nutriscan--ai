---
tags: [decisao, praxis-nutri, seguranca]
data: 2026-03-22
---

## Contexto
O app NutriScan estava em fase de crescimento (Fase 2) sem ter passado por nenhuma auditoria de seguranca. APIs sem autenticacao, sem rate limiting no chat, CORS wildcard, RLS incompleto, credenciais no git history. A motivacao foi provar que apps construidos com "IA tools" podem ser tao seguros quanto apps tradicionais.

## Opcoes consideradas
1. **Auditoria manual incremental** — revisar arquivo por arquivo, corrigindo conforme encontra
   - Pro: Baixo risco de regressao
   - Contra: Lento, facil perder vulnerabilidades
2. **Red Team vs Blue Team com agentes paralelos** — agentes atacantes e defensores trabalhando simultaneamente
   - Pro: Cobertura ampla, encontra falhas que um humano perderia, documenta tudo
   - Contra: Mais complexo de coordenar, possibilidade de conflito entre agentes
3. **Ferramenta de SAST/DAST automatizada** — usar tools como Snyk, SonarQube
   - Pro: Padrao da industria
   - Contra: Nao entende logica de negocio, nao testa RLS do Supabase

## Decisao
Opcao 2 — Red Team vs Blue Team com 2 ciclos de 3 agentes cada.

Ciclo 1: Backend Security + Red Team + Architect Security (triagem inicial)
Ciclo 2: Red Team Opus (ataque massivo) + Blue Team Opus (correcoes) + Auditor Haiku (documentacao)

## Consequencias
- 15+ vulnerabilidades encontradas e corrigidas em uma unica sessao
- JWT obrigatorio em todas as APIs
- RLS completo com policies para todas as tabelas e operacoes
- Rate limiting em scan e chat
- CORS blindado (sem wildcard)
- Security headers em producao (CSP, HSTS, X-Frame-Options)
- Premium escalation bloqueado via RLS subquery
- Documentacao completa em `docs/security/` (7 documentos)
- 2 itens pendentes: Redis rate limiter + Gemini API key na URL
- Modelo pode ser replicado para futuras auditorias

## Links
- [[2026-03-22-security-hardening]]
- [[decisao-premium-rls-protection]]
