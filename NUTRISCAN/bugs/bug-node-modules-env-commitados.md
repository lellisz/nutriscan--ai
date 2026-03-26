---
tags: [bug, nutriscan, git, seguranca, critico]
data: 2026-03-13
status: resolvido
commit: f35c88c
---

## Erro
Repositorio continha `node_modules/` e `.env` commitados. Repo gigante e credenciais expostas.

## Causa
Projeto iniciado sem `.gitignore`. Primeiro commit incluiu tudo.

## Solucao
1. Criar `.gitignore` com `node_modules/`, `.env`, `.env.*`
2. Remover arquivos do tracking: `git rm -r --cached node_modules .env`
3. Commitar a remocao

**Commit:** `f35c88c`

## ALERTA DE SEGURANCA
Se `.env` foi commitado com chaves reais:
- **Rotacionar TODAS as chaves** (Supabase, Anthropic, Groq, Sentry)
- Verificar se repo era publico (chaves ja podem estar comprometidas)
- Usar `git filter-branch` ou BFG para limpar historico se necessario

## Prevencao
- Criar `.gitignore` ANTES do primeiro commit
- Usar template: `npx gitignore node`
- Revisar `git status` antes de cada commit

## Relacionados
- [[decisao-variaveis-ambiente]]
- [[Coach Nutri]]
