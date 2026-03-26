---
tags: [decisao, praxis-nutri, infra, mcp]
data: 2026-03-22
---

## Contexto
Claude Code tem acesso ao filesystem e terminal, mas nao consegue acessar diretamente o banco de dados Supabase, documentacao atualizada de libs, ou a API do GitHub. Isso limitava debug de dados, forçava consultas manuais e impedia automacao de PRs/issues.

## Opcoes consideradas

### MCP Servers avaliados
1. **Supabase MCP** — acesso direto ao banco (queries, schema, RLS)
2. **Context7** — docs atualizadas de qualquer lib (React, Supabase, Recharts, etc.)
3. **GitHub MCP** — issues, PRs, repos, code search
4. **Playwright MCP** — testes E2E no browser (descartado: projeto ainda sem testes)
5. **Filesystem MCP** — acesso a arquivos (descartado: Claude Code ja tem Read/Write/Glob)
6. **Figma MCP** — tokens de design (descartado: projeto nao usa Figma)

## Decisao
Configurar 3 MCPs: Supabase (read-only), Context7, e GitHub.

- **Supabase em read-only** por segurança — Claude consulta mas nao modifica dados
- **Context7** resolve o problema do knowledge cutoff (maio/2025) para documentacao de libs
- **GitHub** complementa o `gh` CLI ja disponivel com integracao nativa

## Consequencias
- Claude Code ganha acesso direto ao banco para debug e verificacao
- Documentacao de libs sempre atualizada durante desenvolvimento
- Gestao de issues/PRs integrada ao fluxo de trabalho
- `.mcp.json` no `.gitignore` (credenciais via env vars)
- MCPs carregam na inicializacao — requer restart do Claude Code apos mudancas

## Links
- [[2026-03-22-revisao-documentacao]]
- [[Coach Nutri]]
