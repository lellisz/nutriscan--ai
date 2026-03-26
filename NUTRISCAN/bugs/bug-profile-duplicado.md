---
tags: [bug, nutriscan, database, supabase, upsert]
data: 2026-03-15
status: resolvido
---

## Erro
```
duplicate key value violates unique constraint "profiles_pkey"
```
Ao salvar perfil pela segunda vez.

## Causa
Usar `insert` ao inves de `upsert` para `profiles` e `daily_goals`.

## Solucao
```javascript
.upsert(payload, { onConflict: "user_id" })
```

**Tabelas:** `profiles`, `daily_goals`
**Arquivo afetado:** `src/lib/db.js`

## Relacionados
- [[bug-upsert-logs-duplicados]] — mesmo padrao
- [[Coach Nutri]]
