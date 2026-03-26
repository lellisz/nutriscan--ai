---
tags: [bug, nutriscan, api, coach, supabase]
data: 2026-03-21
status: resolvido
---

## Erro
`ensureChatTablesExist()` nao detectava corretamente quando tabelas do Coach nao existiam.

## Causa
Checava codigo de erro `PGRST116` (zero rows do `.single()`), mas a query usava `.limit(1)` que retorna array vazio sem erro. O codigo correto para tabela inexistente e `42P01` (PostgreSQL `undefined_table`).

## Solucao
Corrigido para checar `42P01` e `error.message.includes("does not exist")`.

## Relacionados
- [[bug-coach-migration-pendente]] — migration que cria as tabelas
- [[Coach Nutri]]
